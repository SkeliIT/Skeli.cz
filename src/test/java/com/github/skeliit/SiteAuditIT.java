package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.mindrot.jbcrypt.BCrypt;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.logging.LogEntry;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;

import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.*;
import java.util.logging.Level;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Automatická kontrola celého webu (spouštět před vydáním na www, proti běžícímu lokálnímu webu):
 * projde všechny stránky na telefonu (na výšku i na šířku) a PC, v tmavém i světlém režimu a v 5 jazycích.
 *
 * CHYBY (test kvůli nim spadne): chyba skriptu nebo nenačtený soubor, stránka vrátí chybu serveru (nebo 404),
 * něco přečuhuje do strany, nepřeložený text (klíč jako „menu.squad“), rozbitý obrázek, na telefonu nedosažitelné Menu.
 * VAROVÁNÍ (jen ve zprávě): drobné písmo, malé plochy na ťuknutí.
 *
 * Zpráva česky: target/site-audit/zprava.txt. Rychlá verze (jen telefon, tmavý, čeština): -Dquick=true.
 * Jen některé stránky: -Dpages=/a,/b. Přihlášené stránky a admin projde jako dočasný admin (po sobě ho smaže).
 */
class SiteAuditIT {
    static final String BASE = System.getProperty("it.baseUrl", "http://localhost:8080");
    static final Path OUT = Path.of("target/site-audit");
    static final String PASSWORD = UiTestSupport.PASSWORD;
    static final String[] LANGS = { "cs", "en", "de", "uk", "vi" };

    /** zařízení: název, šířka, výška, dotyk */
    record Device(String name, int w, int h, boolean touch) {}
    static final Device PHONE = new Device("telefon", 390, 844, true);
    static final Device PHONE_SIDE = new Device("telefon na šířku", 844, 390, true);
    static final Device PC = new Device("PC", 1400, 900, false);

    /** Co se změří na stránce (v prohlížeči). Vrací JSON. */
    static final String PROBE = """
        const vw = document.documentElement.clientWidth, out = {};
        const vis = e => { const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
          const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
        const path = e => { const p = []; for (let x = e; x && x !== document.body && p.length < 3; x = x.parentElement) p.unshift(name(x)); return p.join(' > '); };
        const clipped = e => { for (let x = e.parentElement; x && x !== document.documentElement; x = x.parentElement) {
            const s = getComputedStyle(x); if (s.overflowX !== 'visible' || s.position === 'fixed') { const r = x.getBoundingClientRect(); if (r.right <= vw + 1 && r.left >= -1) return true; } } return false; };
        out.overflow = Math.max(0, document.documentElement.scrollWidth - vw);
        const wide = [];
        if (out.overflow > 1) document.querySelectorAll('body *').forEach(e => { if (!vis(e) || e.closest('svg')) return; const r = e.getBoundingClientRect();
          if ((r.right > vw + 2 || r.left < -2) && !clipped(e)) wide.push(path(e) + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']'); });
        out.wide = [...new Set(wide)].slice(0, 6);
        out.text = document.body.innerText;
        out.images = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && vis(i) && i.getAttribute('src')).map(i => i.getAttribute('src')).slice(0, 6);
        const small = [];
        document.querySelectorAll('a, button, input:not([type=hidden]), select, textarea, summary').forEach(e => { if (!vis(e)) return;
          if (e.closest('p, .prose-card, .lyric-text, .lyric-body') && e.tagName === 'A') return;
          const r = e.getBoundingClientRect(); if (r.width < 30 || r.height < 30) small.push(path(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
        out.small = small.length; out.smallList = [...new Set(small)].slice(0, 4);
        const tiny = [];
        document.querySelectorAll('body *').forEach(e => { if (!vis(e)) return; const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          if (own && parseFloat(getComputedStyle(e).fontSize) < 11.5) tiny.push(path(e) + ' ' + getComputedStyle(e).fontSize); });
        out.tiny = tiny.length; out.tinyList = [...new Set(tiny)].slice(0, 4);
        return JSON.stringify(out);
        """;

    /** Na telefonu je po posunutí stránky Menu pořád vidět a jde na něj ťuknout. */
    static final String MENU_REACH = """
        window.scrollTo(0, document.documentElement.scrollHeight * 0.5);
        const b = document.getElementById('menuToggle'); if (!b || !b.offsetParent) return 'ok';
        const r = b.getBoundingClientRect(); if (r.bottom < 2 || r.top > innerHeight - 2) return 'tlačítko Menu je mimo obrazovku';
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit && (hit === b || b.contains(hit)) ? 'ok' : 'tlačítko Menu zakrývá ' + (hit ? hit.tagName.toLowerCase() + '.' + hit.className : 'nic');
        """;

    final List<String> errors = new ArrayList<>(), warnings = new ArrayList<>();
    Set<String> keys;

    @Test void wholeSite() throws Exception {
        keys = loadKeys();
        boolean quick = Boolean.getBoolean("quick");
        List<String> pages = System.getProperty("pages") != null ? List.of(System.getProperty("pages").split(",")) : publicPages();
        List<String> signedIn = List.of("/uzivatel.jsp", "/nastaveni.jsp", "/zpravy", "/admin.jsp", "/admin/stats", "/admin/songs",
                "/admin/track", "/admin/lyrics", "/admin/karaoke", "/admin/quotes", "/admin/comments", "/admin/feedback",
                "/admin_users.jsp", "/admin/newsletter", "/admin/history", "/admin/notes");
        Files.createDirectories(OUT);
        long t0 = System.currentTimeMillis();
        int loads = 0;

        // čeština: všechna zařízení a oba režimy; ostatní jazyky na telefonu v tmavém režimu (délka textů, překlady)
        List<Object[]> runs = new ArrayList<>();
        for (Device dv : quick ? List.of(PHONE) : List.of(PHONE, PHONE_SIDE, PC))
            for (String theme : quick ? List.of("dark") : List.of("dark", "light")) runs.add(new Object[] { dv, theme, "cs" });
        if (!quick) for (String l : LANGS) if (!l.equals("cs")) runs.add(new Object[] { PHONE, "dark", l });
        for (Object[] run : runs) loads += visit((Device) run[0], (String) run[1], (String) run[2], pages, null);

        // přihlášené stránky a admin jako dočasný admin (telefon a PC, tmavý režim)
        if (System.getProperty("pages") == null) {
            int admin = createAdmin();
            try {
                for (Device dv : quick ? List.of(PHONE) : List.of(PHONE, PC)) loads += visit(dv, "dark", "cs", signedIn, "audit_" + admin);
            } finally {
                deleteUser(admin);
            }
        }

        StringBuilder rep = new StringBuilder("Kontrola webu ").append(BASE).append(" – ").append(loads).append(" načtení stránek, ")
                .append((System.currentTimeMillis() - t0) / 1000).append(" s\n\n");
        rep.append("CHYBY: ").append(errors.size()).append('\n');
        errors.forEach(e -> rep.append("  ✗ ").append(e).append('\n'));
        rep.append("\nVAROVÁNÍ: ").append(warnings.size()).append('\n');
        warnings.forEach(w -> rep.append("  · ").append(w).append('\n'));
        Files.writeString(OUT.resolve("zprava.txt"), rep.toString());
        System.out.println(rep);
        assertTrue(errors.isEmpty(), errors.size() + " chyb, viz target/site-audit/zprava.txt");
    }

    /** Projde stránky na jednom zařízení / režimu / jazyce. user != null = přihlásit se. Vrací počet načtení. */
    int visit(Device dv, String theme, String lang, List<String> pages, String user) throws Exception {
        ChromeOptions o = new ChromeOptions();
        o.addArguments("--headless=new", "--hide-scrollbars", "--use-angle=swiftshader", "--enable-unsafe-swiftshader");
        if (dv.touch()) o.setExperimentalOption("mobileEmulation", Map.of("deviceMetrics", Map.of("width", dv.w(), "height", dv.h(), "pixelRatio", 1.0, "touch", true),
                "userAgent", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"));
        else o.addArguments("--window-size=" + dv.w() + "," + dv.h());
        LoggingPreferences logs = new LoggingPreferences();
        logs.enable(LogType.BROWSER, Level.ALL);
        o.setCapability("goog:loggingPrefs", logs);
        ChromeDriver d = new ChromeDriver(o);
        JavascriptExecutor js = d;
        HttpClient http = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
        int n = 0;
        String where = dv.name() + ", " + (theme.equals("dark") ? "tmavý" : "světlý") + ", " + lang;
        try {
            d.get(BASE + "/index.jsp?lang=" + lang);
            js.executeScript("localStorage.setItem('theme', arguments[0]); localStorage.setItem('cookieConsent','true');"
                    + "localStorage.setItem('consent', JSON.stringify({stats:false,media:true})); localStorage.setItem('fxLow','on'); localStorage.setItem('kevin','hidden');", theme);
            if (user != null) {
                d.get(BASE + "/login.jsp");
                d.findElement(By.name("username")).sendKeys(user);
                d.findElement(By.name("password")).sendKeys(PASSWORD);
                js.executeScript("document.querySelector('form[action*=login] button[type=submit]').click()");
                Thread.sleep(1500);
            }
            for (String p : pages) {
                if (user == null) {   // stav stránky přes HTTP (prohlížeč ho neprozradí)
                    int code = http.send(HttpRequest.newBuilder(URI.create(BASE + p)).build(), HttpResponse.BodyHandlers.discarding()).statusCode();
                    boolean missingOk = p.startsWith("/nic-tu-neni");
                    if (code >= 500 || (code == 404 && !missingOk)) errors.add(p + " vrací " + code + " (" + where + ")");
                }
                d.manage().logs().get(LogType.BROWSER).getAll();   // vyčistit
                d.get(BASE + p);
                n++;
                Thread.sleep(1300);
                js.executeScript("document.querySelectorAll('.reveal, [data-reveal]').forEach(e => e.classList.add('show', 'in'))");
                @SuppressWarnings("unchecked")
                Map<String, Object> r = new com.fasterxml.jackson.databind.ObjectMapper().readValue((String) js.executeScript(PROBE), Map.class);
                String at = p + " (" + where + ")";
                for (LogEntry e : d.manage().logs().get(LogType.BROWSER).getAll()) {
                    String m = e.getMessage();
                    if (e.getLevel().intValue() < Level.SEVERE.intValue() || noise(m, p)) continue;
                    errors.add(at + ": chyba v prohlížeči – " + m.substring(0, Math.min(220, m.length())));
                }
                if (((Number) r.get("overflow")).intValue() > 1)
                    errors.add(at + ": stránka přečuhuje do strany o " + r.get("overflow") + " px – " + r.get("wide"));
                for (String k : untranslated((String) r.get("text"))) errors.add(at + ": nepřeložený text „" + k + "“");
                if (!((List<?>) r.get("images")).isEmpty()) errors.add(at + ": rozbité obrázky " + r.get("images"));
                if (dv.touch()) {
                    String reach = String.valueOf(js.executeScript(MENU_REACH));
                    if (!reach.equals("ok")) errors.add(at + ": " + reach);
                    int tiny = ((Number) r.get("tiny")).intValue(), small = ((Number) r.get("small")).intValue();
                    if (tiny > 0) warnings.add(at + ": drobné písmo (" + tiny + "×) " + r.get("tinyList"));
                    if (small > 0) warnings.add(at + ": malé plochy na ťuknutí (" + small + "×) " + r.get("smallList"));
                }
            }
        } finally {
            d.quit();
        }
        return n;
    }

    /** Cizí služby a očekávané věci, které nejsou chybou webu. */
    static boolean noise(String m, String page) {
        return m.contains("favicon") || m.contains("youtube") || m.contains("googlevideo") || m.contains("ytimg") || m.contains("spotify")
                || m.contains("instagram") || m.contains("doubleclick") || m.contains("AudioContext") || m.contains("google.com")
                || (page.startsWith("/nic-tu-neni") && m.contains("404"));
    }

    /** Klíče překladů, které se na stránce objevily jako text (místo překladu). */
    List<String> untranslated(String text) {
        List<String> out = new ArrayList<>();
        Matcher m = Pattern.compile("\\b[a-z][a-zA-Z0-9]*(?:\\.[a-zA-Z0-9_]+)+\\b").matcher(text == null ? "" : text);
        while (m.find()) if (keys.contains(m.group()) && !out.contains(m.group())) out.add(m.group());
        return out;
    }

    static Set<String> loadKeys() throws Exception {
        Properties p = new Properties();
        try (var in = new InputStreamReader(Files.newInputStream(Path.of("src/main/webapp/WEB-INF/i18n/messages_cs.properties")), StandardCharsets.UTF_8)) { p.load(in); }
        Set<String> k = new HashSet<>(p.stringPropertyNames());
        k.removeIf(s -> !s.contains("."));
        return k;
    }

    /** Stránky ze sitemapy (z písní jen dvě na jazyk – mají jednu šablonu) a pár dalších. */
    static List<String> publicPages() throws Exception {
        String sm = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(BASE + "/sitemap.xml")).build(), HttpResponse.BodyHandlers.ofString()).body();
        Set<String> pages = new LinkedHashSet<>();
        Matcher m = Pattern.compile("<loc>https?://[^/]+(/[^<]*)</loc>").matcher(sm);
        int songs = 0;
        while (m.find()) {
            String p = m.group(1).replace("&amp;", "&");
            if (p.contains("?lang=")) continue;                 // jazyk přepíná běh, ne adresa
            if (p.startsWith("/cs/song/")) { if (songs++ < 2) pages.add(p); continue; }
            if (p.matches("/[a-z]{2}/song/.*")) continue;      // ostatní jazyky písní projde běh s ?lang
            pages.add(p);
        }
        pages.addAll(List.of("/karaoke", "/login.jsp", "/register.jsp", "/forgot.jsp", "/newsletter.jsp", "/nic-tu-neni"));
        return new ArrayList<>(pages);
    }

    // --- dočasný admin pro přihlášené stránky (heslo jako v ostatních testech, po sobě se smaže) ---
    static Connection db() throws Exception {
        return DriverManager.getConnection(System.getProperty("it.dbUrl", "jdbc:mariadb://localhost:3306/skeliweb"),
                System.getProperty("it.dbUser", "Skeli"), System.getProperty("it.dbPass", "skeli"));
    }

    static int createAdmin() throws Exception {
        try (Connection c = db(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO users (username, email, password_hash, role, created_at, email_verified_at) VALUES (?, ?, ?, 'ADMIN', NOW(), NOW())",
                Statement.RETURN_GENERATED_KEYS)) {
            String r = UUID.randomUUID().toString().substring(0, 8);
            ps.setString(1, "audit_tmp_" + r);
            ps.setString(2, "audit-" + r + "@example.com");
            ps.setString(3, BCrypt.hashpw(PASSWORD, BCrypt.gensalt(4)));
            ps.executeUpdate();
            int id;
            try (ResultSet k = ps.getGeneratedKeys()) { k.next(); id = k.getInt(1); }
            try (PreparedStatement u = c.prepareStatement("UPDATE users SET username = ? WHERE id = ?")) { u.setString(1, "audit_" + id); u.setInt(2, id); u.executeUpdate(); }
            return id;
        }
    }

    static void deleteUser(int id) throws Exception {
        try (Connection c = db(); PreparedStatement ps = c.prepareStatement("DELETE FROM users WHERE id = ?")) { ps.setInt(1, id); ps.executeUpdate(); }
    }
}
