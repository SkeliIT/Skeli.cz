package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.security.SecureRandom;
import java.sql.*;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@WebServlet(name = "RegisterServlet", urlPatterns = {"/register"})
public class RegisterServlet extends HttpServlet {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z0-9._-]{3,50}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendRedirect("register.jsp");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = normalize(req.getParameter("username"));
        String email = normalizeEmail(req.getParameter("email"));
        String password = req.getParameter("password");
        String password2 = req.getParameter("password2");
        String consent = req.getParameter("consent");

        List<String> errors = new ArrayList<>();
        req.setAttribute("username", username);
        req.setAttribute("email", email);

        if (username.isEmpty()) {
            errors.add(I18n.getText(req, "auth.error.usernameRequired", "Uživatelské jméno je povinné."));
        } else if (!USERNAME_PATTERN.matcher(username).matches()) {
            errors.add(I18n.getText(req, "auth.error.usernameInvalid", "Uživatelské jméno musí mít 3–50 znaků a obsahovat pouze písmena, čísla, ., _ nebo -."));
        }

        if (email.isEmpty()) {
            errors.add(I18n.getText(req, "auth.error.emailRequired", "E-mailová adresa je povinná."));
        } else if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.add(I18n.getText(req, "auth.error.emailInvalid", "Zadejte platnou e-mailovou adresu."));
        }

        if (password == null || password2 == null || password.isEmpty() || password2.isEmpty()) {
            errors.add(I18n.getText(req, "auth.error.passwordRequired", "Obě pole pro heslo jsou povinná."));
        } else if (!password.equals(password2)) {
            errors.add(I18n.getText(req, "auth.error.passwordMismatch", "Hesla se neshodují."));
        } else if (!isPasswordStrong(password)) {
            errors.add(I18n.getText(req, "auth.error.passwordStrength", "Heslo musí mít alespoň 12 znaků, obsahovat velké a malé písmeno, číslo a speciální znak."));
        }

        if (consent == null) {
            errors.add(I18n.getText(req, "auth.error.consent", "Musíte souhlasit se zpracováním osobních údajů a podmínkami."));
        }

        if (!errors.isEmpty()) {
            req.setAttribute("errors", errors);
            req.getRequestDispatcher("/register.jsp").forward(req, resp);
            return;
        }

        Integer newUserId = null;
        try (Connection conn = Db.get()) {
            if (isUsernameTaken(conn, username)) {
                errors.add(I18n.getText(req, "auth.error.usernameTaken", "Uživatelské jméno již existuje, zvolte prosím jiné."));
            }
            if (isEmailTaken(conn, email)) {
                errors.add(I18n.getText(req, "auth.error.emailTaken", "E-mailová adresa je již registrována. Pokud již máte účet, obnovte prosím heslo."));
            }
            if (!errors.isEmpty()) {
                req.setAttribute("errors", errors);
                req.getRequestDispatcher("/register.jsp").forward(req, resp);
                return;
            }

            String hash = BCrypt.hashpw(password, BCrypt.gensalt(12));
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, 'USER', NOW())", Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, username);
                ps.setString(2, email);
                ps.setString(3, hash);
                ps.executeUpdate();
                try (ResultSet gk = ps.getGeneratedKeys()) {
                    if (gk.next()) {
                        newUserId = gk.getInt(1);
                    }
                }
            }

            if (newUserId != null) {
                String token = generateToken();
                try (PreparedStatement ps2 = conn.prepareStatement(
                        "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))")) {
                    ps2.setInt(1, newUserId);
                    ps2.setString(2, token);
                    ps2.executeUpdate();
                }
                try {
                    EmailUtil.sendMail(email, buildRegistrationSubject(), buildRegistrationBody(req, username));
                } catch (Exception mailErr) {
                    // If email sending fails, registration is still valid.
                }
            }
        } catch (SQLIntegrityConstraintViolationException integrityError) {
            errors.add(I18n.getText(req, "auth.error.registrationFailed", "Účet se zadaným uživatelským jménem nebo e-mailem již existuje."));
            req.setAttribute("errors", errors);
            req.getRequestDispatcher("/register.jsp").forward(req, resp);
            return;
        } catch (SQLException e) {
            throw new ServletException(e);
        }

        resp.sendRedirect("login.jsp?registered=1");
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private static String normalizeEmail(String email) {
        return normalize(email).toLowerCase(Locale.ROOT);
    }

    private static boolean isPasswordStrong(String password) {
        if (password == null || password.length() < 12) {
            return false;
        }
        boolean hasUpper = false, hasLower = false, hasDigit = false, hasSpecial = false;
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else if (!Character.isWhitespace(c)) hasSpecial = true;
        }
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    private static boolean isUsernameTaken(Connection conn, String username) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM users WHERE username = ?")) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private static boolean isEmailTaken(Connection conn, String email) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM users WHERE email = ?")) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private static String generateToken() {
        byte[] b = new byte[32]; new SecureRandom().nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static String buildRegistrationSubject() {
        return "Vítejte na Skeli.cz - Registrace úspěšně dokončena";
    }

    private static String buildRegistrationBody(HttpServletRequest req, String username) {
        String base = req.getRequestURL().toString().replace(req.getRequestURI(), req.getContextPath());
        String loginLink = base + "/login.jsp";
        return "Vítejte na Skeli.cz!\n\n" +
               "Váš účet \"" + username + "\" byl úspěšně vytvořen.\n\n" +
               "Nyní se můžete přihlásit na našich stránkách:\n" + loginLink + "\n\n" +
               "Děkujeme za registraci a těšíme se na vaši účast v naší komunitě!\n\n" +
               "S pozdravem,\nTým Skeli.cz";
    }
}
