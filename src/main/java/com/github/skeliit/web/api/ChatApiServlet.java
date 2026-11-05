package com.github.skeliit.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.ChatDao;
import com.github.skeliit.dao.FriendDao;
import com.github.skeliit.dao.NotificationDao;
import com.github.skeliit.model.ChatMessage;
import com.github.skeliit.model.ChatPrefs;
import com.github.skeliit.security.RequestLimiter;
import com.github.skeliit.service.OnlineUsers;
import com.github.skeliit.web.auth.EmailVerification;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Chat mezi přáteli. GET ?with=jméno&recent=1 (obnovení otevřeného chatu každých pár sekund) nebo &before=id (starší zprávy).
 * POST action = send | edit | delete | react | mute | hide | report | prefs. „Já“ je vždy ze session, CSRF hlídá CsrfFilter.
 * Chyby nikdy neprozradí, proč psát nejde (přítel to vypnul, nebo zablokoval): vždy jen „closed“.
 */
@WebServlet(name = "ChatApiServlet", urlPatterns = {"/api/chat"})
public class ChatApiServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    private final ChatDao chat = new ChatDao();

    private static long number(String raw) {
        return raw != null && raw.matches("[0-9]{1,18}") ? Long.parseLong(raw) : 0;
    }

    private static void json(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setHeader("Cache-Control", "no-store");
        resp.setContentType("application/json; charset=UTF-8");
        JSON.writeValue(resp.getOutputStream(), body);
    }

    private static Integer me(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        return s == null ? null : (Integer) s.getAttribute("user_id");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Integer me = me(req);
        if (me == null) { json(resp, 401, Map.of("error", "login")); return; }
        if ("1".equals(req.getParameter("active"))) OnlineUsers.touch(me, true);   // malé okno chatu se samo nehlásí
        try {
            Integer other = chat.userId(req.getParameter("with"));
            if (other == null || other.equals(me)) { json(resp, 404, Map.of("error", "closed")); return; }
            long before = number(req.getParameter("before"));
            // obnovování otevřeného chatu stačí posledních 30 zpráv: nové a změny (úprava, smazání, reakce)
            int limit = "1".equals(req.getParameter("recent")) ? 30 : ChatDao.PAGE;
            List<ChatMessage> items = chat.messages(me, other, before, limit);
            if (before == 0 && !items.isEmpty()) {
                chat.markRead(me, other);
                new NotificationDao().removeMessages(me, other);
            }
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("items", items);
            out.put("seenId", chat.seenId(me, other));
            out.put("muted", chat.isMuted(me, other));
            out.put("canSend", EmailVerification.isVerified(req.getSession(false)) && chat.canSend(me, other));
            // stav vidí jen přátelé
            out.put("state", new FriendDao().relation(me, other) == FriendDao.Rel.FRIENDS ? chat.shownState(other) : null);
            json(resp, 200, out);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Integer me = me(req);
        if (me == null) { json(resp, 401, Map.of("error", "login")); return; }
        String action = String.valueOf(req.getParameter("action"));
        OnlineUsers.touch(me, true);
        try {
            switch (action) {
                case "send" -> send(req, resp, me);
                case "prefs" -> {
                    ChatPrefs p = new ChatPrefs();
                    p.status = String.valueOf(req.getParameter("status"));
                    p.theme = String.valueOf(req.getParameter("theme"));
                    p.font = String.valueOf(req.getParameter("font"));
                    p.size = String.valueOf(req.getParameter("size"));
                    p.receipts = !"0".equals(req.getParameter("receipts"));
                    json(resp, chat.savePrefs(me, p) ? 200 : 400, Map.of("ok", true));
                }
                case "delete" -> json(resp, chat.deleteOwn(me, number(req.getParameter("id"))) ? 200 : 404, Map.of("ok", true));
                case "edit" -> {
                    String raw = req.getParameter("body");
                    String body = raw != null && raw.length() > ChatDao.MAX_BODY ? null : WebUtils.cleanComment(raw);
                    if (body == null || body.isBlank()) { json(resp, 400, Map.of("error", "empty")); return; }
                    json(resp, chat.edit(me, number(req.getParameter("id")), body) ? 200 : 404, Map.of("ok", true));
                }
                case "react" -> {
                    String emoji = req.getParameter("emoji");
                    long id = number(req.getParameter("id"));
                    Integer other = chat.otherIn(me, id);
                    if (emoji == null || !ChatDao.REACTIONS.contains(emoji) || other == null) { json(resp, 400, Map.of("error", "fail")); return; }
                    if (!chat.canSend(me, other)) { json(resp, 403, Map.of("error", "closed")); return; }
                    chat.react(me, id, emoji);
                    json(resp, 200, Map.of("ok", true));
                }
                case "mute" -> {
                    Integer other = chat.userId(req.getParameter("with"));
                    if (other != null) chat.setMuted(me, other, "1".equals(req.getParameter("on")));
                    json(resp, 200, Map.of("ok", true));
                }
                case "hide" -> {
                    Integer other = chat.userId(req.getParameter("with"));
                    if (other != null) chat.hide(me, other);
                    json(resp, 200, Map.of("ok", true));
                }
                case "report" -> {
                    String reason = req.getParameter("reason");
                    if (reason == null || !ChatDao.REASONS.contains(reason)) { json(resp, 400, Map.of("error", "fail")); return; }
                    if (!RequestLimiter.tryAcquire("chat-report", me, 10, RequestLimiter.HOUR)) { json(resp, 429, Map.of("error", "limit")); return; }
                    String note = req.getParameter("note");
                    if (note != null && note.length() > 300) note = note.substring(0, 300);
                    boolean ok = chat.report(me, number(req.getParameter("id")), reason, note);
                    json(resp, ok ? 200 : 404, Map.of("ok", ok));
                }
                default -> json(resp, 400, Map.of("error", "fail"));
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private void send(HttpServletRequest req, HttpServletResponse resp, int me) throws IOException, SQLException {
        if (!EmailVerification.isVerified(req.getSession(false))) { json(resp, 403, Map.of("error", "verify")); return; }
        Integer other = chat.userId(req.getParameter("with"));
        if (other == null || other.equals(me) || !chat.canSend(me, other)) { json(resp, 403, Map.of("error", "closed")); return; }
        String raw = req.getParameter("body");
        if (raw != null && raw.length() > ChatDao.MAX_BODY) { json(resp, 400, Map.of("error", "long")); return; }
        String body = WebUtils.cleanComment(raw);
        if (body == null || body.isBlank()) { json(resp, 400, Map.of("error", "empty")); return; }
        if (!RequestLimiter.tryAcquire("chat-minute", me, 30, RequestLimiter.MINUTE)
                || !RequestLimiter.tryAcquire("chat-hour", me, 400, RequestLimiter.HOUR)) {
            json(resp, 429, Map.of("error", "limit"));
            return;
        }
        long id = chat.send(me, other, body, number(req.getParameter("replyTo")));
        // do zvonečku jde jen „X ti napsal“, nikdy text zprávy; kdo si mě ztlumil, tomu nic
        if (!chat.isMuted(other, me)) new NotificationDao().addFriend(other, me, "message");
        json(resp, 200, Map.of("ok", true, "id", id));
    }
}
