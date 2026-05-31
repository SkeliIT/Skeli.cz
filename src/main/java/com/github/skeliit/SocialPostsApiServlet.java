package com.github.skeliit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.sql.*;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@WebServlet(name = "SocialPostsApiServlet", urlPatterns = { "/api/social-posts" })
public class SocialPostsApiServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json; charset=UTF-8");
        int limit = 10;
        try {
            limit = Math.max(1, Math.min(50, Integer.parseInt(req.getParameter("limit"))));
        } catch (Exception ignore) {
        }

        // Get language from session, default to 'cs'
        String lang = null;
        if (req.getSession(false) != null) {
            lang = (String) req.getSession().getAttribute("lang");
        }
        if (lang == null || lang.isEmpty())
            lang = "cs";
        System.out.println("[SocialPostsApi] Language from session: " + lang);

        String sql = "SELECT id, source, lang, post_id, permalink, image_url, caption, created_at " +
                "FROM social_posts WHERE lang = ? ORDER BY created_at DESC, id DESC LIMIT ?";
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode arr = mapper.createArrayNode();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, lang);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ObjectNode o = mapper.createObjectNode();
                    o.put("id", rs.getInt(1));
                    o.put("source", rs.getString(2));
                    o.put("lang", rs.getString(3));
                    o.put("postId", rs.getString(4));
                    o.put("permalink", rs.getString(5));
                    if (rs.getString(6) != null)
                        o.put("image", rs.getString(6));
                    if (rs.getString(7) != null)
                        o.put("caption", rs.getString(7));
                    Timestamp ts = rs.getTimestamp(8);
                    if (ts != null) {
                        String iso = DateTimeFormatter.ISO_INSTANT.format(ts.toInstant());
                        o.put("createdAt", iso);
                    }
                    arr.add(o);
                }
            }
        } catch (SQLException e) {
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"DB error\"}");
            return;
        }
        PrintWriter out = resp.getWriter();
        out.write(arr.toString());
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String token = System.getenv("SOCIAL_TOKEN");
        String q = req.getParameter("token");
        if (token != null && (q == null || !token.equals(q))) {
            resp.setStatus(403);
            resp.getWriter().write("{\"error\":\"forbidden\"}");
            return;
        }
        ObjectMapper mapper = new ObjectMapper();
        JsonNode body;
        try (InputStream in = req.getInputStream()) {
            body = mapper.readTree(in);
        }
        if (body == null) {
            resp.setStatus(400);
            resp.getWriter().write("{\"error\":\"invalid json\"}");
            return;
        }
        String source = body.path("source").asText(null);
        String lang = body.path("lang").asText("cs"); // default to 'cs' if not provided
        String postId = body.path("postId").asText(null);
        String permalink = body.path("permalink").asText(null);
        String image = body.path("image").asText(null);
        String caption = body.path("caption").asText(null);
        String createdAt = body.path("createdAt").asText(null); // ISO-8601
        if (source == null || postId == null || permalink == null || createdAt == null) {
            resp.setStatus(400);
            resp.getWriter().write("{\"error\":\"missing fields\"}");
            return;
        }
        String sql = "INSERT INTO social_posts(source, lang, post_id, permalink, image_url, caption, created_at) " +
                "VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE lang=VALUES(lang), permalink=VALUES(permalink), image_url=VALUES(image_url), caption=VALUES(caption), created_at=VALUES(created_at)";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, source);
            ps.setString(2, lang);
            ps.setString(3, postId);
            ps.setString(4, permalink);
            ps.setString(5, image);
            ps.setString(6, caption);
            Timestamp ts = Timestamp.from(Instant.parse(createdAt));
            ps.setTimestamp(7, ts);
            ps.executeUpdate();
        } catch (SQLException e) {
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"db error\"}");
            return;
        }
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write("{\"ok\":true}");
    }
}
