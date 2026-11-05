package com.github.skeliit.web.profile;

import com.github.skeliit.dao.ChatDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/** Stránka Zprávy: /zpravy (seznam konverzací), /zpravy?s=jméno (otevřený chat). Zprávy si načítá js/chat.js přes /api/chat. */
@WebServlet(name = "ChatPageServlet", urlPatterns = {"/zpravy"})
public class ChatPageServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        if (me == null) { resp.sendRedirect("/login.jsp?next=%2Fzpravy"); return; }
        resp.setHeader("X-Robots-Tag", "noindex");
        req.setAttribute("pageNoIndex", Boolean.TRUE);
        try {
            ChatDao chat = new ChatDao();
            req.setAttribute("chatList", chat.conversations(me));
            req.setAttribute("chatPrefs", chat.prefs(me));
            String with = req.getParameter("s");
            Integer other = chat.userId(with);
            if (other != null && !other.equals(me)) req.setAttribute("chatWith", with);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        req.getRequestDispatcher("/WEB-INF/views/chat.jsp").forward(req, resp);
    }
}
