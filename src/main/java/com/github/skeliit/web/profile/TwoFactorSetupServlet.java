package com.github.skeliit.web.profile;

import com.github.skeliit.Config;
import com.github.skeliit.dao.TwoFactorDao;
import com.github.skeliit.security.Totp;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

/**
 * Two-factor sign-in in My account → Security (uzivatel.jsp).
 * POST action=start    a new key, kept in the session until a code from the app proves it was scanned
 *      action=confirm  code → switched on; ten backup codes shown once (session attribute tfaNewCodes)
 *      action=cancel   the started setup thrown away
 *      action=codes    code → new backup codes (the old ones stop working)
 *      action=disable  code (or a backup code) → switched off; not for an admin while admins must have it
 * Back to uzivatel.jsp?tfa=on|off|codes|wrong|admin#zabezpeceni.
 */
@WebServlet(name = "TwoFactorSetupServlet", urlPatterns = {"/profile/2fa"})
public class TwoFactorSetupServlet extends HttpServlet {
    public static final String SETUP = "tfaSetupSecret";
    public static final String NEW_CODES = "tfaNewCodes";
    private final TwoFactorDao twoFactor = new TwoFactorDao();

    /** Admins must have two-factor sign-in (AdminFilter) unless ADMIN_2FA_REQUIRED=false (a developer's computer). */
    public static boolean requiredForAdmins() {
        return !"false".equalsIgnoreCase(Config.get("ADMIN_2FA_REQUIRED", "true"));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        if (s == null || !(s.getAttribute("userId") instanceof Integer uid)) {
            resp.sendRedirect("/login.jsp?next=%2Fuzivatel.jsp");
            return;
        }
        String action = String.valueOf(req.getParameter("action")), code = req.getParameter("code"), result;
        try {
            TwoFactorDao.State st = twoFactor.state(uid);
            switch (action) {
                case "start" -> {
                    if (!st.isEnabled()) s.setAttribute(SETUP, Totp.newSecret());
                    result = "setup";
                }
                case "cancel" -> {
                    s.removeAttribute(SETUP);
                    result = null;
                }
                case "confirm" -> {
                    String secret = (String) s.getAttribute(SETUP);
                    long step = secret == null ? -1 : Totp.verify(secret, code, System.currentTimeMillis(), 0);
                    if (step < 0) { result = secret == null ? null : "wrong"; break; }
                    twoFactor.enable(uid, secret, step);
                    s.removeAttribute(SETUP);
                    s.setAttribute(NEW_CODES, List.copyOf(twoFactor.newRecoveryCodes(uid)));
                    result = "on";
                }
                case "codes" -> {
                    if (!st.isEnabled() || !appCode(uid, st, code)) { result = "wrong"; break; }
                    s.setAttribute(NEW_CODES, List.copyOf(twoFactor.newRecoveryCodes(uid)));
                    result = "codes";
                }
                case "disable" -> {
                    if ("ADMIN".equals(s.getAttribute("role")) && requiredForAdmins()) { result = "admin"; break; }
                    if (!st.isEnabled() || !(appCode(uid, st, code) || twoFactor.useRecoveryCode(uid, code))) { result = "wrong"; break; }
                    twoFactor.disable(uid);
                    result = "off";
                }
                default -> result = null;
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/uzivatel.jsp" + (result != null ? "?tfa=" + result : "") + "#zabezpeceni");
    }

    /** A right code from the app (it then counts as used). */
    private boolean appCode(int uid, TwoFactorDao.State st, String code) throws SQLException {
        long step = Totp.verify(st.secret, code, System.currentTimeMillis(), st.lastStep);
        if (step < 0) return false;
        twoFactor.usedStep(uid, step);
        return true;
    }
}
