package com.github.skeliit;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/** "Sign out other devices" in the account settings: every other session of this user ends. POST + CSRF only. */
@WebServlet(name = "SignOutEverywhereServlet", urlPatterns = {"/profile/signout-others"})
public class SignOutEverywhereServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession s = req.getSession(false);
        if (s == null || !(s.getAttribute("userId") instanceof Integer uid)) {
            resp.sendRedirect("/login.jsp");
            return;
        }
        int n = SessionRegistry.signOut(uid, s);
        resp.sendRedirect("/uzivatel.jsp?signedOut=" + n);
    }
}
