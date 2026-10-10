package com.github.skeliit.web.site;

import com.github.skeliit.Db;
import com.github.skeliit.I18n;
import com.github.skeliit.WebUtils;
import com.github.skeliit.job.VideoTitles;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@WebServlet(name = "EllipticPlayerServlet", urlPatterns = { "/elliptic" })
public class EllipticPlayerServlet extends HttpServlet {
        static class Vid {
                String id;
                String title;
                String year;
                String preview; // song preview image, optional
        }

        @Override
        protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
                resp.setContentType("text/html; charset=UTF-8");
                List<Vid> vids = new ArrayList<>();
                // Titles missing in the DB are filled from YouTube in the background (VideoTitles)
                String sql = "SELECT v.youtube_id, v.title, s.name, s.year, s.preview_image_url " +
                                "FROM videos v LEFT JOIN songs s ON s.id=v.song_id " +
                                "ORDER BY s.year DESC, v.id DESC";
                try (Connection c = Db.get();
                                PreparedStatement ps = c.prepareStatement(sql);
                                ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                                Vid v = new Vid();
                                v.id = rs.getString(1);
                                String title = VideoTitles.display(rs.getString(2));
                                v.title = title != null ? title : (rs.getString(3) != null ? rs.getString(3) : "YouTube");
                                v.year = rs.getString(4);
                                v.preview = rs.getString(5);
                                vids.add(v);
                        }
                } catch (SQLException e) {
                        /* silent -> render empty */ }

                PrintWriter out = resp.getWriter();
                java.util.Properties tr = I18n.bundle(req);
                // Elliptic player styles are defined in external CSS under src/main/webapp/css/pages.css.

                // HTML structure: the clip on a wide stage (water and fire round it, js/clip-fx.js loaded by
                // music.jsp), the carousel under it, the comments under that
                out.println("<div class='ep-wrap'>");
                out.println("  <section class='clip-stage ep-stage has-fx' data-clip-fx>");
                out.println("    <canvas class='clip-fx-gl' aria-hidden='true'></canvas><canvas class='clip-fx-2d' aria-hidden='true'></canvas>");
                out.println("    <div class='ep-frame-wrap' data-clip-player>");
                out.println("      <div id='ep-poster' class='ep-poster' hidden></div>");
                out.println("      <iframe id='ep-main' allow='autoplay; encrypted-media; picture-in-picture' allowfullscreen></iframe>");
                out.println("    </div>");
                out.println("  </section>");
                out.println("  <div class='ep-carousel'>");
                out.println("    <button class='ep-arrow' id='ep-prev' aria-label='" + WebUtils.escapeHtml(tr.getProperty("player.prev")) + "'>‹</button>");
                out.println("    <div class='ep-viewport' id='ep-viewport'></div>");
                out.println("    <button class='ep-arrow' id='ep-next' aria-label='" + WebUtils.escapeHtml(tr.getProperty("player.next")) + "'>›</button>");
                out.println("  </div>");
                out.println("</div>");

                // JavaScript logic
                out.println("<script>");
                out.println("(function(){");
                out.println("const videos = [];");
                for (Vid v : vids) {
                        String escTitle = v.title == null ? ""
                                        : v.title.replace("\\", "\\\\").replace("\"", "\\\"").replace("'", "\\'");
                        String prev = v.preview == null ? ""
                                        : v.preview.replace("\\", "\\\\").replace("\"", "\\\"").replace("'", "\\'");
                        out.printf("videos.push({id:'%s', title:'%s', preview:'%s'});%n", v.id, escTitle, prev);
                }
                out.println("function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;'); }");
                out.println("const frame = document.getElementById('ep-main');");
                out.println("const poster = document.getElementById('ep-poster');");
                out.println("const viewport = document.getElementById('ep-viewport');");
                out.println("let currentIndex = 0;");

                out.println("function build(){");
                out.println("  videos.forEach((video, index) => {");
                out.println("    const item = document.createElement('div');");
                out.println("    item.className = 'ep-item';");
                out.println("    item.dataset.index = index;");
                out.println("    const thumb = video.preview || `/yt-thumb/${video.id}/hqdefault.jpg`;");
                out.println("    item.innerHTML = `");
                out.println("      <img src='${thumb}' alt='${esc(video.title)}'>");
                out.println("      <div class='ep-title'>${esc(video.title)}</div>");
                out.println("    `;");
                out.println("    item.addEventListener('click', () => goTo(index, true));");
                out.println("    viewport.appendChild(item);");
                out.println("  });");
                out.println("}");

                out.println("function updateUI(){");
                out.println("  const items = viewport.querySelectorAll('.ep-item');");
                out.println("  items.forEach((el, i) => {");
                out.println("    el.classList.remove('is-prev2','is-prev','is-active','is-next','is-next2','is-hidden');");
                out.println("    if (i === currentIndex) el.classList.add('is-active');");
                out.println(
                                "    else if (i === (currentIndex - 1 + videos.length) % videos.length) el.classList.add('is-prev');");
                out.println("    else if (i === (currentIndex + 1) % videos.length) el.classList.add('is-next');");
                out.println(
                                "    else if (i === (currentIndex - 2 + videos.length) % videos.length) el.classList.add('is-prev2');");
                out.println("    else if (i === (currentIndex + 2) % videos.length) el.classList.add('is-next2');");
                out.println("    else el.classList.add('is-hidden');");
                out.println("  });");
                out.println("}");

                out.println("function play(id, autoplay){");
                out.println("  frame.parentElement.dataset.yt = id;");
                out.println("  const video = videos.find(v => v.id === id) || videos[currentIndex];");
                out.println("  const ap = autoplay ? 1 : 0;");
                // without consent to third-party content (cookie bar) the player waits behind its
                // poster until a click: only then does the browser talk to YouTube
                out.println("  const consented = window.skeliConsent && window.skeliConsent();");
                out.println("  if (!autoplay && poster && ((video && video.preview) || !consented)) {");
                out.println("    poster.style.backgroundImage = `url('${video && video.preview ? video.preview : '/yt-thumb/' + id + '/hqdefault.jpg'}')`;");
                out.println("    poster.hidden = false;");
                out.println("    poster.onclick = () => play(id, true);");
                out.println("    frame.removeAttribute('src');");
                out.println("    return;");
                out.println("  }");
                out.println("  if (poster) { poster.hidden = true; poster.onclick = null; }");
                out.println(
                                "  frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=${ap}&rel=0&playsinline=1&enablejsapi=1`;");
                out.println("}");

                out.println("function goTo(index, autoplay){");
                out.println("  currentIndex = (index + videos.length) % videos.length;");
                out.println("  updateUI();");
                out.println("  play(videos[currentIndex].id, autoplay);");
                // the comments under the player (includes/comments.jspf in music.jsp) follow the clip
                out.println("  const cm = document.querySelector('[data-comments][data-kind=video]'); if (cm) cm.dataset.target = videos[currentIndex].id;");
                out.println("}");

                out.println(
                                "document.getElementById('ep-prev').addEventListener('click', () => goTo(currentIndex - 1, true));");
                out.println(
                                "document.getElementById('ep-next').addEventListener('click', () => goTo(currentIndex + 1, true));");

                out.println("// Keyboard navigation");
                out.println("document.addEventListener('keydown', (e) => {");
                // not while typing (a comment) in a field
                out.println("  const el = document.activeElement; if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;");
                out.println("  if (e.key === 'ArrowLeft') goTo(currentIndex - 1, true);");
                out.println("  else if (e.key === 'ArrowRight') goTo(currentIndex + 1, true);");
                out.println("});");

                out.println("if (videos.length > 0) {");
                out.println("  build();");
                // ?clip=<YouTube id> (a link from the admin to a comment) starts on that clip
                out.println("  const want = new URLSearchParams(location.search).get('clip');");
                out.println("  goTo(Math.max(0, videos.findIndex(v => v.id === want)), false);");
                out.println("} else {");
                out.println("  frame.closest('.ep-frame-wrap').hidden = true;");
                out.println("}");

                out.println("})();");
                out.println("</script>");
        }
}
