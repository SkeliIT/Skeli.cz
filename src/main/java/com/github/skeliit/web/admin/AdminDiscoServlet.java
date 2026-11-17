package com.github.skeliit.web.admin;

import com.github.skeliit.dao.SongDao;
import com.github.skeliit.model.DiscoItem;
import com.github.skeliit.model.DiscoPicture;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Admin → Hudba → Obrázky v Diskografii: všechny karty písní pohromadě, jak je vidí návštěvník na Hudbě
 * (stejný výběr obrázku jako music.jsp). Úprava jedné karty je u písně (/admin/song?id=…#disco-art).
 * Přístup hlídá AdminFilter.
 */
@WebServlet(name = "AdminDiscoServlet", urlPatterns = {"/admin/disco"})
public class AdminDiscoServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        List<DiscoPicture> cards = new ArrayList<>();
        try {
            SongDao songs = new SongDao();
            Map<Integer, String[]> picked = songs.discoPictures();
            Set<String> sharp = getServletContext().getResourcePaths("/img/disco/");
            if (sharp == null) sharp = Set.of();
            for (DiscoItem d : songs.discography("cs")) {
                if (!d.song) continue;   // video bez písně se upravit nedá (nemá řádek v songs)
                DiscoPicture p = new DiscoPicture();
                p.id = d.id;
                p.name = d.name;
                p.year = d.year;
                p.collab = d.collab;
                String[] pick = picked.get(d.id);
                if (pick != null && pick[0] != null) {
                    p.src = pick[0];
                    p.own = true;
                } else if (d.youtubeId != null) {
                    p.src = sharp.contains("/img/disco/" + d.youtubeId + ".webp")
                            ? "/img/disco/" + d.youtubeId + ".webp" : "/yt-thumb/" + d.youtubeId + "/mqdefault.jpg";
                } else {
                    p.src = d.previewUrl();
                }
                if (pick != null) p.style = pick[1];
                cards.add(p);
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        req.setAttribute("cards", cards);
        req.getRequestDispatcher("/WEB-INF/views/admin/disco.jsp").forward(req, resp);
    }
}
