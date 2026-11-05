package com.github.skeliit.web.profile;

import com.github.skeliit.Db;
import com.github.skeliit.dao.FriendDao;
import com.github.skeliit.dao.FriendDao.Rel;
import com.github.skeliit.dao.NotificationDao;
import com.github.skeliit.security.RequestLimiter;
import com.github.skeliit.web.auth.EmailVerification;
import com.github.skeliit.web.auth.LoginServlet;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * POST /profile/friends: action = request | accept | decline | cancel | remove | block | unblock, name = jméno druhého,
 * back = kam se vrátit. Formulář má CSRF token (CsrfFilter), „já“ je vždy ze session.
 * Žádostí nejvýš 30 za hodinu. Kdo mě zablokoval, se dozví jen to, že žádost nešla poslat.
 */
@WebServlet(name = "FriendsServlet", urlPatterns = {"/profile/friends"})
public class FriendsServlet extends HttpServlet {
    private final FriendDao friends = new FriendDao();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        if (me == null) { resp.sendRedirect("/login.jsp?next=%2Fuzivatel.jsp%23pratele"); return; }
        String back = LoginServlet.safeNext(req.getParameter("back"));
        if (back == null) back = "/uzivatel.jsp";
        String anchor = back.startsWith("/hrac/") ? "" : "#pratele";
        String result = "ok";
        try {
            Integer other = idOf(req.getParameter("name"));
            String action = String.valueOf(req.getParameter("action"));
            if (other == null || other.equals(me)) {
                result = "fail";
            } else {
                Rel rel = friends.relation(me, other);
                NotificationDao bell = new NotificationDao();
                switch (action) {
                    case "request" -> {
                        if (!EmailVerification.isVerified(s)) result = "verify";
                        else if (rel == Rel.BLOCKS_ME || rel == Rel.I_BLOCKED) result = "fail";
                        else if (rel == Rel.RECEIVED) {                  // poslali jsme si ji navzájem: rovnou přátelé
                            if (friends.accept(me, other)) bell.addFriend(other, me, "friend_accept");
                        } else if (rel == Rel.NONE) {
                            if (!RequestLimiter.tryAcquire("friend-request", me, 30, RequestLimiter.HOUR)) result = "limit";
                            else if (friends.request(me, other)) bell.addFriend(other, me, "friend_request");
                            else result = "closed";
                        }
                    }
                    case "accept" -> { if (friends.accept(me, other)) bell.addFriend(other, me, "friend_accept"); else result = "fail"; }
                    case "decline", "cancel", "remove" -> { if (rel == Rel.SENT || rel == Rel.RECEIVED || rel == Rel.FRIENDS) friends.remove(me, other); }
                    case "block" -> friends.block(me, other);
                    case "unblock" -> friends.unblock(me, other);
                    default -> result = "fail";
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect(back + (back.contains("?") ? "&" : "?") + "friend=" + result + anchor);
    }

    /** Účet podle jména; smazaný ani zablokovaný se nepočítá. */
    private static Integer idOf(String name) throws SQLException {
        if (name == null || name.length() > 60) return null;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT id FROM users WHERE username = ? AND role <> 'DELETED' AND blocked_at IS NULL")) {
            ps.setString(1, name);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : null; }
        }
    }
}
