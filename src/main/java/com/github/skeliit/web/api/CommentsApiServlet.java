package com.github.skeliit.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.CommentDao;
import com.github.skeliit.dao.CommentDao.Kind;
import com.github.skeliit.dao.CommentDao.Ref;
import com.github.skeliit.dao.CommentDao.Sort;
import com.github.skeliit.dao.CommentDao.Viewer;
import com.github.skeliit.model.CommentItem;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Comments under lyrics and clips, for js/comments.js (the same for the song page and the Music page).
 *
 * GET  ?kind=lyric|video&target=<lyric id|YouTube id>&sort=top|new
 *      → {"total", "me": {...}, "artistAvatar", "items": [CommentItem with replies]}
 * POST action=add (kind, target, content, parent), edit (kind, id, content), delete (kind, id),
 *      vote (kind, id, vote=1|-1; the same vote again takes it back), pin / heart (kind, id, on=1|0).
 *      Answers JSON; with "back" (a path on this site, used by the forms on the profile page) it redirects.
 * Errors: 401 not signed in, 403 not allowed or e-mail not confirmed ({"error":"verify"}), 429 too many.
 */
@WebServlet(name = "CommentsApiServlet", urlPatterns = {"/api/comments"})
public class CommentsApiServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    private final CommentDao dao = new CommentDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Kind kind = Kind.of(req.getParameter("kind"));
        String target = req.getParameter("target");
        if (kind == null || !kind.validTarget(target)) {
            resp.sendError(400);
            return;
        }
        Sort sort = "new".equals(req.getParameter("sort")) ? Sort.NEW : Sort.TOP;
        HttpSession s = req.getSession(false);
        try {
            Viewer viewer = viewer(s);
            List<CommentItem> items = dao.threads(kind, target, viewer, sort);
            int total = 0;
            for (CommentItem it : items) total += 1 + it.replies.size();
            Map<String, Object> me = new LinkedHashMap<>();
            me.put("authed", viewer.userId() != null);
            me.put("canPost", viewer.userId() != null && EmailVerification.isVerified(s));
            me.put("artist", viewer.artist());
            me.put("avatar", s != null ? WebUtils.safeUrl((String) s.getAttribute("avatar_url"), "") : "");
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("total", total);
            out.put("me", me);
            out.put("artistAvatar", dao.artistAvatar());
            out.put("items", items);
            resp.setHeader("Cache-Control", "no-store");
            write(resp, 200, out);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        HttpSession s = req.getSession(false);
        Integer userId = s != null ? (Integer) s.getAttribute("userId") : null;
        String back = LoginServlet.safeNext(req.getParameter("back"));
        Kind kind = Kind.of(req.getParameter("kind"));
        String action = req.getParameter("action");
        if (userId == null) {
            answer(resp, back, 401, null);
            return;
        }
        if (kind == null || action == null) {
            answer(resp, back, 400, null);
            return;
        }
        try {
            Viewer viewer = viewer(s);
            if ("add".equals(action)) {
                add(req, resp, s, kind, viewer, back);
                return;
            }
            Integer id = number(req.getParameter("id"));
            Ref ref = id == null ? null : dao.find(kind, id);
            if (ref == null) {
                answer(resp, back, 404, null);
                return;
            }
            boolean mineOrAdmin = ref.userId() == userId || viewer.admin();
            switch (action) {
                case "edit" -> {
                    String content = WebUtils.cleanComment(req.getParameter("content"));
                    if (!mineOrAdmin) { answer(resp, back, 403, null); return; }
                    if (content == null) { answer(resp, back, 400, null); return; }
                    dao.edit(kind, ref.id(), content);
                    answer(resp, back, 200, Map.of("ok", true));
                }
                case "delete" -> {
                    if (!mineOrAdmin) { answer(resp, back, 403, null); return; }
                    dao.delete(kind, ref.id());
                    answer(resp, back, 200, Map.of("ok", true));
                }
                case "vote" -> {
                    if (!EmailVerification.isVerified(s)) { answer(resp, back, 403, Map.of("error", "verify")); return; }
                    if (!RequestLimiter.tryAcquire("comment-vote", userId, 60, RequestLimiter.MINUTE)) { answer(resp, back, 429, null); return; }
                    int vote = "-1".equals(req.getParameter("vote")) ? -1 : 1;
                    int[] r = dao.vote(kind, ref.id(), userId, vote);
                    answer(resp, back, 200, Map.of("up", r[0], "down", r[1], "my", r[2]));
                }
                case "pin" -> {
                    if (ref.parentId() != null || !(viewer.artist() || viewer.admin())) { answer(resp, back, 403, null); return; }
                    dao.pin(kind, ref, "1".equals(req.getParameter("on")));
                    answer(resp, back, 200, Map.of("pinned", dao.isPinned(kind, ref.id())));
                }
                case "heart" -> {
                    if (!viewer.artist()) { answer(resp, back, 403, null); return; }
                    dao.heart(kind, ref.id(), "1".equals(req.getParameter("on")));
                    answer(resp, back, 200, Map.of("hearted", dao.isHearted(kind, ref.id())));
                }
                default -> answer(resp, back, 400, null);
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private void add(HttpServletRequest req, HttpServletResponse resp, HttpSession s, Kind kind, Viewer viewer, String back)
            throws SQLException, IOException {
        String target = req.getParameter("target");
        String content = WebUtils.cleanComment(req.getParameter("content"));
        if (WebUtils.isBot(req)) {
            answer(resp, back, 200, Map.of("ok", true)); // honeypot filled in: pretend it worked, store nothing
            return;
        }
        if (!kind.validTarget(target) || content == null || !dao.targetExists(kind, target)) {
            answer(resp, back, 400, null);
            return;
        }
        if (!EmailVerification.isVerified(s)) {
            answer(resp, back, 403, Map.of("error", "verify"));
            return;
        }
        if (!RequestLimiter.tryAcquire("comment", viewer.userId(), 5, RequestLimiter.MINUTE)) {
            answer(resp, back, 429, null);
            return;
        }
        int id = dao.add(kind, target, viewer.userId(), number(req.getParameter("parent")), content);
        answer(resp, back, 200, Map.of("ok", true, "id", id));
    }

    /** The signed-in user's role and artist flag come from the database, not the session (they can change). */
    private static Viewer viewer(HttpSession s) throws SQLException {
        Integer uid = s != null ? (Integer) s.getAttribute("userId") : null;
        if (uid == null) return Viewer.ANONYMOUS;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT role, is_artist FROM users WHERE id = ?")) {
            ps.setInt(1, uid);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next() || "DELETED".equals(rs.getString(1))) return Viewer.ANONYMOUS;
                return new Viewer(uid, "ADMIN".equals(rs.getString(1)), rs.getBoolean(2));
            }
        }
    }

    private static Integer number(String v) {
        return v != null && v.matches("\\d{1,9}") ? Integer.valueOf(v) : null;
    }

    private static void answer(HttpServletResponse resp, String back, int status, Object body) throws IOException {
        if (back != null) {
            resp.sendRedirect(back);
            return;
        }
        write(resp, status, body != null ? body : Map.of("ok", status == 200));
    }

    private static void write(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        JSON.writeValue(resp.getWriter(), body);
    }
}
