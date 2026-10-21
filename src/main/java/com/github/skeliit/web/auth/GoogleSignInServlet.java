package com.github.skeliit.web.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.skeliit.Config;
import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.Normalizer;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;

/**
 * Sign in (and sign up) with Google: the OpenID Connect authorization code flow with PKCE.
 * GET /auth/google?next=… sends the visitor to Google; Google sends them back to /auth/google/callback with a code,
 * which is exchanged (server to server, with the client secret) for the ID token that says who they are.
 * <ul>
 *   <li>a Google account seen before signs in to its account;</li>
 *   <li>a new one whose e-mail Google has verified and that matches an account here is linked to it;</li>
 *   <li>otherwise a new account is made (name from Google, e-mail verified, no password) and signed in.</li>
 * </ul>
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env (Google Cloud Console, OAuth client "Web application",
 * redirect URI = APP_BASE_URL + /auth/google/callback); without them the button is not shown.
 */
@WebServlet(name = "GoogleSignInServlet", urlPatterns = {"/auth/google", "/auth/google/callback"})
public class GoogleSignInServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public static boolean isConfigured() {
        return notBlank(Config.get("GOOGLE_CLIENT_ID")) && notBlank(Config.get("GOOGLE_CLIENT_SECRET"));
    }

    private static String redirectUri() { return WebUtils.baseUrl() + "/auth/google/callback"; }

    /** The host of APP_BASE_URL, null when it can't be read. */
    static String baseHost() {
        try { return java.net.URI.create(WebUtils.baseUrl()).getHost(); } catch (IllegalArgumentException e) { return null; }
    }

    /** The host the visitor typed: behind Apache from X-Forwarded-Host (the first one), else the Host header; no port. */
    static String requestHost(HttpServletRequest req) {
        return requestHost(req.getHeader("X-Forwarded-Host"), req.getHeader("Host"));
    }

    static String requestHost(String forwarded, String hostHeader) {
        String h = forwarded;
        if (h == null || h.isBlank()) h = hostHeader;
        if (h == null || h.isBlank()) return null;
        h = h.split(",")[0].trim();
        if (h.startsWith("[")) return h.substring(0, h.indexOf(']') + 1);   // [::1]:8080
        int colon = h.indexOf(':');
        return colon >= 0 ? h.substring(0, colon) : h;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isConfigured()) { resp.sendError(404); return; }
        if (req.getServletPath().endsWith("/callback")) callback(req, resp);
        else start(req, resp);
    }

    private void start(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // Google sends the visitor back to APP_BASE_URL (www.skeli.cz). Someone who started on another address of
        // the site (skeli.cz without www) has their session cookie only there: back on www it isn't sent, the state
        // is missing and the first try failed (the second one, already on www, worked). So first over to the right
        // address, once (hop), and start there.
        String want = baseHost(), host = requestHost(req);
        if (want != null && host != null && !want.equalsIgnoreCase(host) && req.getParameter("hop") == null) {
            String next = LoginServlet.safeNext(req.getParameter("next"));
            resp.sendRedirect(WebUtils.baseUrl() + "/auth/google?hop=1" + (next != null ? "&next=" + enc(next) : ""));
            return;
        }
        HttpSession s = req.getSession(true);
        String state = random(), verifier = random() + random();
        s.setAttribute("googleState", state);
        s.setAttribute("googleVerifier", verifier);
        String next = LoginServlet.safeNext(req.getParameter("next"));
        if (next != null) s.setAttribute("googleNext", next); else s.removeAttribute("googleNext");
        String url = "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + enc(Config.get("GOOGLE_CLIENT_ID"))
                + "&redirect_uri=" + enc(redirectUri())
                + "&response_type=code&scope=" + enc("openid email profile")
                + "&state=" + enc(state)
                + "&code_challenge=" + enc(challenge(verifier)) + "&code_challenge_method=S256"
                + "&prompt=select_account";
        resp.sendRedirect(url);
    }

    private void callback(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        String state = s == null ? null : (String) s.getAttribute("googleState");
        String verifier = s == null ? null : (String) s.getAttribute("googleVerifier");
        String next = s == null ? null : (String) s.getAttribute("googleNext");
        if (s != null) { s.removeAttribute("googleState"); s.removeAttribute("googleVerifier"); s.removeAttribute("googleNext"); }
        String code = req.getParameter("code");
        // the state ties the answer to the click on our button (no one can sign a visitor in to someone else's account)
        if (state == null || verifier == null || code == null
                || !MessageDigest.isEqual(state.getBytes(StandardCharsets.UTF_8), String.valueOf(req.getParameter("state")).getBytes(StandardCharsets.UTF_8))) {
            fail(req, resp);
            return;
        }
        JsonNode id;
        try {
            id = identity(code, verifier);
        } catch (Exception e) {
            getServletContext().log("Google sign-in: " + e.getMessage());
            fail(req, resp);
            return;
        }
        if (id == null) { fail(req, resp); return; }

        String sub = id.path("sub").asText(""), email = id.path("email").asText("").toLowerCase(Locale.ROOT);
        boolean verified = id.path("email_verified").asBoolean(false) && !email.isEmpty();
        String name = id.path("name").asText(""), picture = id.path("picture").asText("");
        try (Connection c = Db.get()) {
            Account a = find(c, "google_sub = ?", sub);
            boolean fresh = false;
            if (a == null && verified) {   // an account with this e-mail: link it (Google has verified the address)
                a = find(c, "email = ?", email);
                if (a != null) {
                    try (PreparedStatement ps = c.prepareStatement(
                            "UPDATE users SET google_sub = ?, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?")) {
                        ps.setString(1, sub); ps.setInt(2, a.id); ps.executeUpdate();
                    }
                    a.verified = true;
                }
            }
            if (a == null) { a = create(c, sub, verified ? email : null, name, picture); fresh = true; }
            if ("DELETED".equals(a.role)) { fail(req, resp); return; }
            // signed in, or on to the code from the app when the account has two-factor sign-in
            LoginServlet.finish(req, resp, a.id, a.username, a.role, a.avatar, a.verified, false,
                    next != null ? next : fresh ? "/index.jsp?welcome=1" : "/index.jsp");
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    /** Exchanges the code for tokens and returns the checked claims of the ID token (null when they don't fit). */
    private static JsonNode identity(String code, String verifier) throws IOException, InterruptedException {
        String form = "code=" + enc(code) + "&client_id=" + enc(Config.get("GOOGLE_CLIENT_ID"))
                + "&client_secret=" + enc(Config.get("GOOGLE_CLIENT_SECRET")) + "&redirect_uri=" + enc(redirectUri())
                + "&grant_type=authorization_code&code_verifier=" + enc(verifier);
        HttpResponse<String> r = HTTP.send(HttpRequest.newBuilder(URI.create("https://oauth2.googleapis.com/token"))
                .timeout(Duration.ofSeconds(15)).header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form)).build(), HttpResponse.BodyHandlers.ofString());
        if (r.statusCode() != 200) throw new IOException("token endpoint " + r.statusCode());
        return claims(JSON.readTree(r.body()).path("id_token").asText(""), Config.get("GOOGLE_CLIENT_ID"), System.currentTimeMillis() / 1000);
    }

    /**
     * The claims of an ID token that came straight from Google's token endpoint (over TLS, for our client secret,
     * so its signature need not be checked again – OpenID Connect Core 3.1.3.7); still checked: who issued it,
     * for whom, that it has not expired and that it names an account.
     */
    static JsonNode claims(String idToken, String clientId, long nowSeconds) throws IOException {
        String[] parts = idToken.split("\\.");
        if (parts.length < 2) return null;
        JsonNode c = JSON.readTree(Base64.getUrlDecoder().decode(parts[1]));
        String iss = c.path("iss").asText("");
        boolean ok = ("https://accounts.google.com".equals(iss) || "accounts.google.com".equals(iss))
                && clientId != null && clientId.equals(c.path("aud").asText(""))
                && c.path("exp").asLong(0) > nowSeconds
                && !c.path("sub").asText("").isEmpty();
        return ok ? c : null;
    }

    private static final class Account { int id; String username, role, avatar; boolean verified; }

    private static Account find(Connection c, String where, String value) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT id, username, role, avatar_url, email_verified_at FROM users WHERE " + where + " LIMIT 1")) {
            ps.setString(1, value);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Account a = new Account();
                a.id = rs.getInt(1); a.username = rs.getString(2); a.role = rs.getString(3); a.avatar = rs.getString(4);
                a.verified = rs.getTimestamp(5) != null;
                return a;
            }
        }
    }

    private static Account create(Connection c, String sub, String email, String name, String picture) throws SQLException {
        String base = usernameFrom(name, email);
        for (int n = 0; n < 50; n++) {
            String username = n == 0 ? base : trim(base, 50 - String.valueOf(n + 1).length()) + (n + 1);
            if (find(c, "username = ?", username) != null) continue;
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO users (username, email, password_hash, role, created_at, email_verified_at, google_sub, avatar_url) "
                            + "VALUES (?, ?, '', 'USER', NOW(), NOW(), ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, username);
                ps.setString(2, email);
                ps.setString(3, sub);
                ps.setString(4, picture.startsWith("https://") && picture.length() <= 255 ? picture : null);
                ps.executeUpdate();
                try (ResultSet k = ps.getGeneratedKeys()) {
                    k.next();
                    Account a = new Account();
                    a.id = k.getInt(1); a.username = username; a.role = "USER"; a.verified = true;
                    a.avatar = picture.startsWith("https://") && picture.length() <= 255 ? picture : null;
                    return a;
                }
            }
        }
        throw new SQLException("no free username for " + base);
    }

    /** A username the site allows ([A-Za-z0-9._-], 3–50): the Google name without accents, or the e-mail's first part. */
    static String usernameFrom(String name, String email) {
        String s = slug(name);
        if (s.length() < 3 && email != null && email.contains("@")) s = slug(email.substring(0, email.indexOf('@')));
        if (s.length() < 3) s = "fanousek";
        return trim(s, 50);
    }

    private static String slug(String v) {
        if (v == null) return "";
        String s = Normalizer.normalize(v.trim(), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        s = s.replaceAll("\\s+", ".").replaceAll("[^A-Za-z0-9._-]", "").replaceAll("\\.{2,}", ".");
        return s.replaceAll("^[._-]+|[._-]+$", "");
    }

    private static String trim(String s, int max) { return s.length() <= max ? s : s.substring(0, max); }

    private static void fail(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.sendRedirect("/login.jsp?google=failed");
    }

    private static String random() {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static String challenge(String verifier) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(d);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String enc(String v) { return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8); }

    private static boolean notBlank(String v) { return v != null && !v.isBlank(); }
}
