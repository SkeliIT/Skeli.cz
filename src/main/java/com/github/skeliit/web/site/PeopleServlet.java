package com.github.skeliit.web.site;

import com.github.skeliit.dao.FriendDao;
import com.github.skeliit.dao.UserDao;
import com.github.skeliit.model.DirectoryPerson;
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
 * /lide: seznam lidí, kteří se chtějí ukázat (users.community_public), a hledání. Jen pro přihlášené, vyhledávače sem nesmí.
 * POST action = on | off zapne nebo vypne „ukázat mě v Komunitě“; stejný vypínač je v Nastavení.
 */
@WebServlet(name = "PeopleServlet", urlPatterns = {"/lide"})
public class PeopleServlet extends HttpServlet {
    private static final int PAGE = 30;

    private static Integer me(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        return s == null ? null : (Integer) s.getAttribute("user_id");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Integer me = me(req);
        if (me == null) { resp.sendRedirect("/login.jsp?next=%2Flide"); return; }
        String q = req.getParameter("q");
        q = q == null ? "" : q.strip();
        if (q.length() > 60) q = q.substring(0, 60);
        String rawPage = req.getParameter("page");
        int page = rawPage != null && rawPage.matches("[0-9]{1,4}") ? Integer.parseInt(rawPage) : 0;
        try {
            List<DirectoryPerson> people = new FriendDao().directory(me, q, page * PAGE, PAGE + 1);
            boolean more = people.size() > PAGE;
            req.setAttribute("people", more ? people.subList(0, PAGE) : people);
            req.setAttribute("peopleMore", more);
            req.setAttribute("peoplePage", page);
            req.setAttribute("peopleQuery", q);
            req.setAttribute("peopleJoined", new UserDao().communityPublic(me));
            req.setAttribute("pageNoIndex", Boolean.TRUE);
            req.getRequestDispatcher("/WEB-INF/views/people.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Integer me = me(req);
        if (me == null) { resp.sendRedirect("/login.jsp?next=%2Flide"); return; }
        try {
            new UserDao().setCommunityPublic(me, "on".equals(req.getParameter("action")));
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/lide");
    }
}
