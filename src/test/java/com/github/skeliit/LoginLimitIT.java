package com.github.skeliit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.net.CookieManager;
import java.net.HttpCookie;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Random;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Chybná přihlášení (audit C8) proti běžícímu lokálnímu webu, bez prohlížeče. Různé adresy útočníka se hrají hlavičkou
 * X-Forwarded-For (web jí věří jen od lokální proxy – tady jsme to my). Adresy jsou náhodné, ať se běhy nepletou.
 * Dřív: 10 chybných hesel = účet zamčený pro všechny. Teď útočník zamkne jen sám sebe.
 */
class LoginLimitIT {
    static final String BASE = System.getProperty("it.baseUrl", "http://localhost:8080");
    static final String PASSWORD = "Sel3nium#Test2026";
    static final String TOO_MANY = "Příliš mnoho neúspěšných pokusů";
    static final Pattern CSRF = Pattern.compile("name=\"csrf\" value=\"([^\"]+)\"");

    private Connection db;
    private int userId;
    private String username;
    private final String net = "198.18." + new Random().nextInt(250) + ".";   // testovací rozsah adres, každý běh jiný

    @BeforeEach void createUser() throws SQLException {
        db = DriverManager.getConnection(System.getProperty("it.dbUrl", "jdbc:mariadb://localhost:3306/skeliweb"),
                System.getProperty("it.dbUser", "Skeli"), System.getProperty("it.dbPass", "skeli"));
        username = "limit_" + UUID.randomUUID().toString().substring(0, 8);
        try (PreparedStatement ps = db.prepareStatement(
                "INSERT INTO users (username, email, password_hash, role, created_at, email_verified_at) VALUES (?, ?, ?, 'USER', NOW(), NOW())",
                Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, username);
            ps.setString(2, username + "@example.com");
            ps.setString(3, BCrypt.hashpw(PASSWORD, BCrypt.gensalt(4)));
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { k.next(); userId = k.getInt(1); }
        }
    }

    @AfterEach void deleteUser() throws SQLException {
        try (PreparedStatement ps = db.prepareStatement("DELETE FROM users WHERE id = ?")) { ps.setInt(1, userId); ps.executeUpdate(); }
        db.close();
    }

    @Test void anAttackerLocksOnlyHimselfOut() throws Exception {
        Browser attacker = new Browser(net + "1"), owner = new Browser(net + "2");
        for (int i = 0; i < 10; i++) assertEquals(Result.WRONG, attacker.signIn(username, "spatne" + i));
        assertEquals(Result.TOO_MANY, attacker.signIn(username, "spatne"), "útočník je zablokovaný");
        assertEquals(Result.TOO_MANY, attacker.signIn(username, PASSWORD), "a to i se správným heslem");
        assertEquals(Result.OK, owner.signIn(username, PASSWORD), "majitel z jiné adresy se přihlásí");
        // e-mail místo jména se počítá do stejného účtu (dřív to bylo dalších 10 pokusů navíc)
        assertEquals(Result.TOO_MANY, attacker.signIn(username + "@example.com", "spatne"));
    }

    @Test void anAttackFromManyAddressesStillLetsTheOwnersBrowserIn() throws Exception {
        Browser owner = new Browser(net + "200");
        assertEquals(Result.OK, owner.signIn(username, PASSWORD), "majitel se dřív přihlásil → známé zařízení");
        for (int ip = 10; ip < 20; ip++) {                               // 10 adres × 10 pokusů = limit celého účtu
            Browser bot = new Browser(net + ip);
            for (int i = 0; i < 10; i++) bot.signIn(username, "spatne" + i);
        }
        assertEquals(Result.TOO_MANY, new Browser(net + "100").signIn(username, PASSWORD), "neznámý prohlížeč počká");
        Browser ownerElsewhere = new Browser(net + "201");               // majitel jinde (jiná síť), ale svůj prohlížeč
        ownerElsewhere.copyKnownCookie(owner);
        assertEquals(Result.OK, ownerElsewhere.signIn(username, PASSWORD), "známý prohlížeč majitele projde");
    }

    enum Result { OK, WRONG, TOO_MANY }

    /** Jeden „prohlížeč“: vlastní cookies a adresa, ze které „přichází“. */
    static final class Browser {
        final CookieManager cookies = new CookieManager();
        final HttpClient http = HttpClient.newBuilder().cookieHandler(cookies).followRedirects(HttpClient.Redirect.NEVER).build();
        final String ip;
        String csrf;

        Browser(String ip) { this.ip = ip; }

        Result signIn(String user, String password) throws IOException, InterruptedException {
            if (csrf == null) {
                String page = http.send(req("/login.jsp").GET().build(), HttpResponse.BodyHandlers.ofString()).body();
                Matcher m = CSRF.matcher(page);
                assertTrue(m.find(), "přihlašovací stránka nemá CSRF token");
                csrf = m.group(1);
            }
            String form = "username=" + enc(user) + "&password=" + enc(password) + "&csrf=" + enc(csrf);
            HttpResponse<String> r = http.send(req("/login").header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form)).build(), HttpResponse.BodyHandlers.ofString());
            if (r.statusCode() == 302 || r.statusCode() == 303) {
                csrf = null;                                             // po přihlášení nová relace = nový token
                return Result.OK;
            }
            return r.body().contains(TOO_MANY) ? Result.TOO_MANY : Result.WRONG;
        }

        void copyKnownCookie(Browser from) {
            for (HttpCookie c : from.cookies.getCookieStore().getCookies())
                if (c.getName().equals("skeliKnown")) cookies.getCookieStore().add(URI.create(BASE), c);
        }

        HttpRequest.Builder req(String path) {
            return HttpRequest.newBuilder(URI.create(BASE + path)).header("X-Forwarded-For", ip).header("Accept-Language", "cs")
                    .header("Accept", "text/html");
        }

        static String enc(String s) { return URLEncoder.encode(s, StandardCharsets.UTF_8); }
    }
}
