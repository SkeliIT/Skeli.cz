package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;
import java.util.UUID;

@WebServlet(name = "ProfileDeleteServlet", urlPatterns = { "/profile/delete" })
public class ProfileDeleteServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        if (s == null || s.getAttribute("userId") == null) {
            resp.sendRedirect("/login.jsp");
            return;
        }
        String confirm = req.getParameter("confirm");
        if (confirm == null || !"DELETE".equalsIgnoreCase(confirm.trim())) {
            resp.sendRedirect("/uzivatel.jsp?confirm=required");
            return;
        }
        int uid = (int) s.getAttribute("userId");
        try (Connection c = Db.get()) {
            // all personal data goes, the comments stay as "Deleted account" (AccountDeletion)
            AccountDeletion.delete(c, uid, getServletContext());
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        // signed out on every device
        SessionRegistry.signOut(uid, s);
        s.invalidate();
        resp.sendRedirect("/index.jsp?account=deleted");
    }
}
