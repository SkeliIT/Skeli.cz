package com.github.skeliit;

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
                // CSRF token for JS
                String __csrfToken = CsrfFilter.token(req.getSession());
                // Elliptic player styles are defined in external CSS under src/main/webapp/css/pages.css.

                // HTML structure
                out.println("<div class='ep-wrap'>");
                out.println("  <div class='ep-layout'>");
                out.println("    <div class='ep-left'>");
                out.println("      <div class='ep-frame-wrap'>");
                out.println("        <div id='ep-poster' class='ep-poster' hidden></div>");
                out.println(
                                "        <iframe id='ep-main' allow='autoplay; encrypted-media; picture-in-picture' allowfullscreen></iframe>");
                out.println("      </div>");
                out.println("      <div class='ep-carousel'>");
                out.println("        <button class='ep-arrow' id='ep-prev' aria-label='" + WebUtils.escapeHtml(tr.getProperty("player.prev")) + "'>‹</button>");
                out.println("        <div class='ep-viewport' id='ep-viewport'></div>");
                out.println("        <button class='ep-arrow' id='ep-next' aria-label='" + WebUtils.escapeHtml(tr.getProperty("player.next")) + "'>›</button>");
                out.println("      </div>");
                out.println("    </div>");
                out.println("    <aside class='ep-comments'>");
                out.println(
                                "      <h4 class='ep-comments-title'>" + WebUtils.escapeHtml(tr.getProperty("comments.title")) + "</h4>");
                out.println("      <div id='ep-comments-list' class='ep-comments-list'></div>");
                out.println("      <form id='ep-comment-form' class='ep-comment-form'>");
                out.println(
                                "        <textarea id='ep-comment-text' rows='3' placeholder='" + WebUtils.escapeHtml(tr.getProperty("comment.placeholder")) + "'></textarea>");
                out.println(
                                "        <button type='submit'>" + WebUtils.escapeHtml(tr.getProperty("common.send")) + "</button>");
                out.println("      </form>");
                out.println("    </aside>");
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
                out.println("const frame = document.getElementById('ep-main');");
                out.println("const poster = document.getElementById('ep-poster');");
                out.println("const viewport = document.getElementById('ep-viewport');");
                out.println("const commentsList = document.getElementById('ep-comments-list');");
                out.println("const commentForm = document.getElementById('ep-comment-form');");
                out.println("const commentText = document.getElementById('ep-comment-text');");
                out.println("const isAuthed = "
                                + (req.getSession(false) != null && req.getSession(false).getAttribute("userId") != null
                                                ? "true"
                                                : "false")
                                + ";");
                out.println(
                                "const CSRF = '" + __csrfToken.replace("\\", "\\\\").replace("\"", "\\\"").replace("'",
                                                "\\'") + "';");
                out.println("let currentIndex = 0;");

                out.println("function build(){");
                out.println("  videos.forEach((video, index) => {");
                out.println("    const item = document.createElement('div');");
                out.println("    item.className = 'ep-item';");
                out.println("    item.dataset.index = index;");
                out.println("    const thumb = video.preview || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;");
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
                out.println("  const video = videos.find(v => v.id === id) || videos[currentIndex];");
                out.println("  const ap = autoplay ? 1 : 0;");
                out.println("  if (!autoplay && video && video.preview && poster) {");
                out.println("    poster.style.backgroundImage = `url('${video.preview}')`;");
                out.println("    poster.hidden = false;");
                out.println("    poster.onclick = () => play(id, true);");
                out.println("    frame.removeAttribute('src');");
                out.println("    return;");
                out.println("  }");
                out.println("  if (poster) { poster.hidden = true; poster.onclick = null; }");
                out.println(
                                "  frame.src = `https://www.youtube.com/embed/${id}?autoplay=${ap}&rel=0&playsinline=1&enablejsapi=1`;");
                out.println("}");

                out.println("function goTo(index, autoplay){");
                out.println("  currentIndex = (index + videos.length) % videos.length;");
                out.println("  updateUI();");
                out.println("  play(videos[currentIndex].id, autoplay);");
                out.println("  loadComments(videos[currentIndex].id);");
                out.println("  syncAsideHeight();");
                out.println("}");

                out.println(
                                "document.getElementById('ep-prev').addEventListener('click', () => goTo(currentIndex - 1, true));");
                out.println(
                                "document.getElementById('ep-next').addEventListener('click', () => goTo(currentIndex + 1, true));");
                out.println(
                                "function syncAsideHeight(){ try{ if(window.innerWidth < 800) { const aside=document.querySelector('.ep-comments'); if(aside) aside.style.height='auto'; return; } const layout=document.querySelector('.ep-layout'); const frame=document.querySelector('.ep-frame-wrap'); const car=document.querySelector('.ep-carousel'); const aside=document.querySelector('.ep-comments'); if(!layout||!frame||!car||!aside) return; const cs=getComputedStyle(layout); const g=parseFloat(cs.rowGap||cs.gap||'0')||0; const mt=parseFloat(getComputedStyle(car).marginTop)||0; const h = frame.getBoundingClientRect().height + mt + car.getBoundingClientRect().height + g; aside.style.height = Math.round(h) + 'px'; }catch(e){} }");
                out.println("window.addEventListener('resize', syncAsideHeight);");

                out.println("// Keyboard navigation");
                out.println("document.addEventListener('keydown', (e) => {");
                out.println("  if (e.key === 'ArrowLeft') goTo(currentIndex - 1, true);");
                out.println("  else if (e.key === 'ArrowRight') goTo(currentIndex + 1, true);");
                out.println("});");

                // comment list: avatar, date, votes; edit/delete for the author and admins
                out.println("const T = " + commentStrings(tr) + ";");
                out.println(COMMENTS_JS);
                out.println("// Initialize");
                out.println(
                                "if (!isAuthed && commentForm){ commentText.disabled=true; commentText.placeholder='" + WebUtils.escapeJs(tr.getProperty("comment.loginRequired")) + "'; commentForm.querySelector('button').disabled=true; }\n");
                out.println("if (videos.length > 0) {");
                out.println("  build();");
                out.println("  goTo(0, false);");
                out.println("} else {");
                out.println("  frame.closest('.ep-frame-wrap').hidden = true;");
                out.println("}");

                out.println("})();");
                out.println("</script>");
        }

        /** UI strings for the comments script, as a JSON object. */
        private static String commentStrings(java.util.Properties tr) {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("like", tr.getProperty("vote.like"));
                m.put("dislike", tr.getProperty("vote.dislike"));
                m.put("edit", tr.getProperty("common.edit"));
                m.put("del", tr.getProperty("common.delete"));
                m.put("save", tr.getProperty("common.save"));
                m.put("cancel", tr.getProperty("common.cancel"));
                m.put("edited", tr.getProperty("comment.edited"));
                m.put("confirmDelete", tr.getProperty("comment.deleteConfirm"));
                m.put("reply", tr.getProperty("comment.reply"));
                m.put("replyPlaceholder", tr.getProperty("comment.replyPlaceholder"));
                m.put("report", tr.getProperty("comment.report"));
                m.put("reportConfirm", tr.getProperty("comment.reportConfirm"));
                m.put("reported", tr.getProperty("flash.reported"));
                m.put("verifyRequired", tr.getProperty("flash.verifyRequired"));
                m.put("commentLimit", tr.getProperty("flash.commentLimit"));
                m.put("max", WebUtils.COMMENT_MAX_LENGTH);
                try {
                        // "<" escaped so a string can never close the <script> element
                        return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(m).replace("<", "\\u003c");
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                        return "{}";
                }
        }

        private static final String COMMENTS_JS = """
                        function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
                        function commentHtml(c, isReply){
                          return `
                            <div class="ep-comment" data-id="${Number(c.id)}" data-root="${Number(c.parentId || c.id)}">
                              <div class="ep-comment-head">
                                ${c.avatar ? `<img class="ep-avatar" src="${esc(c.avatar)}" alt="">` : `<span class="ep-avatar ep-avatar-empty"><i class="fa-solid fa-user"></i></span>`}
                                <div class="ep-comment-who">
                                  <strong>${esc(c.user || 'user')}</strong>
                                  <span class="ep-comment-date">${esc(c.createdAt || '')}${c.edited ? ' · ' + esc(T.edited) : ''}</span>
                                </div>
                                <div class="comment-actions">
                                  ${c.canEdit ? `<button type="button" class="comment-action comment-edit-toggle" data-action="edit" title="${esc(T.edit)}" aria-label="${esc(T.edit)}"><i class="fa-solid fa-pen"></i></button>
                                  <button type="button" class="comment-action comment-delete" data-action="delete" title="${esc(T.del)}" aria-label="${esc(T.del)}"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                                  ${isAuthed && !c.mine ? `<button type="button" class="comment-action comment-report" data-action="report" title="${esc(T.report)}" aria-label="${esc(T.report)}"><i class="fa-solid fa-flag"></i></button>` : ''}
                                </div>
                              </div>
                              <div class="ep-comment-text">${esc(c.content || '')}</div>
                              ${c.canEdit ? `<form class="comment-edit-form" hidden>
                                <textarea maxlength="${T.max}" required>${esc(c.content || '')}</textarea>
                                <div class="comment-edit-actions"><button type="button" data-action="cancel">${esc(T.cancel)}</button><button type="submit">${esc(T.save)}</button></div>
                              </form>` : ''}
                              <div class="act">
                                <button type="button" class="btn-vote up" data-action="vote" data-v="up" title="${esc(T.like)}" ${!isAuthed ? 'disabled' : ''}><i class="fa-solid fa-thumbs-up"></i></button>
                                <button type="button" class="btn-vote down" data-action="vote" data-v="down" title="${esc(T.dislike)}" ${!isAuthed ? 'disabled' : ''}><i class="fa-solid fa-thumbs-down"></i></button>
                                <span class="vote-sum"><strong>${Number(c.up) || 0}</strong> / <strong>${Number(c.down) || 0}</strong></span>
                                ${isAuthed ? `<button type="button" class="comment-reply-toggle" data-action="reply"><i class="fa-solid fa-reply"></i> ${esc(T.reply)}</button>` : ''}
                              </div>
                              ${isAuthed ? `<form class="comment-reply-form" hidden>
                                <textarea maxlength="${T.max}" required placeholder="${esc(T.replyPlaceholder)}"></textarea>
                                <div class="comment-edit-actions"><button type="button" data-action="reply-cancel">${esc(T.cancel)}</button><button type="submit">${esc(T.reply)}</button></div>
                              </form>` : ''}
                            </div>`;
                        }
                        function renderComments(items){
                          // top-level comments newest first, their replies oldest first
                          const tops = items.filter(c => !c.parentId);
                          const replies = items.filter(c => c.parentId).reverse();
                          commentsList.innerHTML = tops.map(c => {
                            const own = replies.filter(r => r.parentId === c.id);
                            return commentHtml(c, false) + (own.length ? `<div class="ep-replies">${own.map(r => commentHtml(r, true)).join('')}</div>` : '');
                          }).join('');
                        }
                        async function loadComments(yt){
                          try { const r = await fetch('/video-comment?yt=' + encodeURIComponent(yt)); if (!r.ok) return; renderComments(await r.json()); } catch (e) {}
                        }
                        /** POSTs and returns the HTTP status (0 = network error); explains 403/429 to the user. */
                        async function post(url, params){
                          const body = new URLSearchParams(params); body.set('csrf', CSRF);
                          try {
                            const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
                            if (r.status === 403) alert(T.verifyRequired);
                            else if (r.status === 429) alert(T.commentLimit);
                            return r.status;
                          } catch (e) { return 0; }
                        }
                        function reloadComments(){ loadComments(videos[currentIndex].id); }
                        if (commentForm) {
                          commentText.maxLength = T.max;
                          commentForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const content = (commentText.value || '').trim(); if (!content) return;
                            if (await post('/video-comment', { action: 'add', yt: videos[currentIndex].id, content }) === 200) { commentText.value = ''; reloadComments(); }
                          });
                        }
                        commentsList.addEventListener('click', async (e) => {
                          const b = e.target.closest('button'); if (!b || b.disabled) return;
                          const box = b.closest('.ep-comment'); if (!box) return;
                          const id = box.dataset.id, act = b.dataset.action;
                          if (act === 'vote') { if (await post('/video-comment', { action: 'vote', comment_id: id, vote: b.dataset.v }) === 200) reloadComments(); }
                          else if (act === 'delete') { if (confirm(T.confirmDelete) && await post('/video-comment', { action: 'delete', comment_id: id }) === 200) reloadComments(); }
                          else if (act === 'report') { if (confirm(T.reportConfirm) && await post('/comment/report', { kind: 'video', comment_id: id }) === 200) alert(T.reported); }
                          else if (act === 'reply' || act === 'reply-cancel') {
                            const f = box.querySelector(':scope > .comment-reply-form');
                            const open = act === 'reply';
                            if (!open) f.reset();
                            f.hidden = !open;
                            if (open) f.querySelector('textarea').focus();
                          }
                          else if (act === 'edit' || act === 'cancel') {
                            const f = box.querySelector(':scope > .comment-edit-form'), text = box.querySelector(':scope > .ep-comment-text');
                            const on = act === 'edit' && f.hidden;
                            if (!on) f.reset();
                            f.hidden = !on; text.hidden = on;
                            if (on) f.querySelector('textarea').focus();
                          }
                        });
                        commentsList.addEventListener('submit', async (e) => {
                          const f = e.target.closest('form'); if (!f) return;
                          e.preventDefault();
                          const box = f.closest('.ep-comment');
                          const content = f.querySelector('textarea').value.trim(); if (!content) return;
                          let status;
                          if (f.classList.contains('comment-reply-form')) {
                            status = await post('/video-comment', { action: 'add', yt: videos[currentIndex].id, parent_id: box.dataset.root, content });
                          } else {
                            status = await post('/video-comment', { action: 'update', comment_id: box.dataset.id, content });
                          }
                          if (status === 200) reloadComments();
                        });
                        """;
}
