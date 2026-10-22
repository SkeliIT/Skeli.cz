package com.github.skeliit.web.auth;

import com.github.skeliit.I18n;
import com.github.skeliit.dao.TwoFactorDao;
import com.github.skeliit.security.RequestLimiter;
import com.github.skeliit.security.Totp;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.Serializable;
import java.sql.SQLException;

/**
 * The second step of signing in for an account with two-factor sign-in: the 6-digit code from the authenticator app
 * or one of the backup codes. Until then the session holds only who is on the way (Pending), never a signed-in user.
 * 5 wrong codes or 5 minutes and it's back to the password; at most 10 wrong codes a quarter of an hour per account.
 * GET /login/2fa – the form; POST code – checks it and signs in.
 */
@WebServlet(name = "TwoFactorLoginServlet", urlPatterns = {"/login/2fa"})
public class TwoFactorLoginServlet extends HttpServlet {
    static final String PENDING = "tfaPending";
    static final long MAX_AGE_MS = 5 * 60_000L;
    static final int MAX_TRIES = 5;
    private final TwoFactorDao twoFactor = new TwoFactorDao();

    /** Someone whose password (or Google) was right, waiting for the second step. Kept in the session (stored on disk). */
    public static class Pending implements Serializable {
        private static final long serialVersionUID = 1L;
        final int uid;
        final String username, role, avatar, target;
        final boolean emailVerified, remember;
        final long at = System.currentTimeMillis();
        int tries;

        Pending(int uid, String username, String role, String avatar, boolean emailVerified, boolean remember, String target) {
            this.uid = uid; this.username = username; this.role = role; this.avatar = avatar;
            this.emailVerified = emailVerified; this.remember = remember; this.target = target;
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (pending(req) == null) { resp.sendRedirect("/login.jsp?tfa=expired"); return; }
        req.getRequestDispatcher("/WEB-INF/views/login-2fa.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Pending p = pending(req);
        if (p == null) { resp.sendRedirect("/login.jsp?tfa=expired"); return; }
        HttpSession s = req.getSession();
        // too many wrong codes for this account lately (from any browser): back to the password
        if (RequestLimiter.isFull("tfa-fail", p.uid, 10, 15 * RequestLimiter.MINUTE)) {
            s.removeAttribute(PENDING);
            resp.sendRedirect("/login.jsp?tfa=locked");
            return;
        }
        String code = req.getParameter("code");
        try {
            TwoFactorDao.State st = twoFactor.state(p.uid);
            boolean ok = false;
            if (st.isEnabled() && code != null) {
                long step = Totp.verify(st.secret, code, System.currentTimeMillis(), st.lastStep);
                if (step >= 0) { twoFactor.usedStep(p.uid, step); ok = true; }
                else ok = twoFactor.useRecoveryCode(p.uid, code);
            }
            if (!ok) {
                RequestLimiter.tryAcquire("tfa-fail", p.uid, 10, 15 * RequestLimiter.MINUTE);   // counts the wrong code
                p.tries++;
                if (p.tries >= MAX_TRIES) {
                    s.removeAttribute(PENDING);
                    resp.sendRedirect("/login.jsp?tfa=locked");
                    return;
                }
                s.setAttribute(PENDING, p);   // (stored again: the session on disk keeps the count)
                req.setAttribute("tfaError", I18n.getText(req, "tfa.login.wrong", "Kód nesedí. Zkus to znovu."));
                req.getRequestDispatcher("/WEB-INF/views/login-2fa.jsp").forward(req, resp);
                return;
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        s.removeAttribute(PENDING);
        HttpSession session = LoginServlet.signIn(req, p.uid, p.username, p.role, p.avatar, p.emailVerified);
        if (p.remember) LoginServlet.rememberMe(req, resp, session);
        // vždy cesta od kořene webu („index.jsp“ by se z /login/2fa složilo na /login/index.jsp = 404)
        resp.sendRedirect(p.target != null && p.target.startsWith("/") ? p.target : "/" + (p.target == null ? "index.jsp" : p.target));
    }

    /** The one on the way, if not too old. */
    private static Pending pending(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        if (s == null || !(s.getAttribute(PENDING) instanceof Pending p)) return null;
        if (System.currentTimeMillis() - p.at > MAX_AGE_MS) { s.removeAttribute(PENDING); return null; }
        return p;
    }
}
