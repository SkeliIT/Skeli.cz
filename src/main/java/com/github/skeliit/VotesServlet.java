package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.*;

@WebServlet(name = "VotesServlet", urlPatterns = {"/vote"})
public class VotesServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        Integer userId = (session != null) ? (Integer) session.getAttribute("userId") : null;
        String lyricIdStr = req.getParameter("lyric_id");
        String action = req.getParameter("action"); // up|down
        if (userId == null || lyricIdStr == null || action == null) {
            resp.setStatus(400);
            return;
        }
        int lyricId = Integer.parseInt(lyricIdStr);
        int vote = "up".equals(action) ? 1 : -1;
        try (Connection conn = Db.get()) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO lyrics_votes (lyric_id, user_id, vote) VALUES (?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE vote = VALUES(vote)")) {
                ps.setInt(1, lyricId);
                ps.setInt(2, userId);
                ps.setInt(3, vote);
                ps.executeUpdate();
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("lyric.jsp?id=" + lyricId);
    }
}
