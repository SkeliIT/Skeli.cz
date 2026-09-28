<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ page import="java.util.List, com.github.skeliit.AdminLyricsServlet.SongRow, com.github.skeliit.AdminLyricsServlet.VideoRow" %>
<%
  @SuppressWarnings("unchecked") List<SongRow> songs = (List<SongRow>) request.getAttribute("songs");
  @SuppressWarnings("unchecked") List<VideoRow> videos = (List<VideoRow>) request.getAttribute("videos");
  SongRow song = (SongRow) request.getAttribute("song");
  String editLang = (String) request.getAttribute("lang");
  String words = (String) request.getAttribute("words");
  Integer lyricId = (Integer) request.getAttribute("lyricId");
  String csrfToken = com.github.skeliit.CsrfFilter.token(session);
%>
<main class="admin-lyrics">
  <h2>Texty písní</h2>
  <p class="page-lead"><a href="/admin.jsp">← Zpět do administrace</a></p>

  <% if ("1".equals(request.getParameter("saved"))) { %><div class="form-success">Text uložen.</div><% } %>
  <% if ("1".equals(request.getParameter("error"))) { %><div class="form-alert">Něco chybí nebo je text moc dlouhý (max 20 000 znaků).</div><% } %>

  <div class="lyrics-editor-layout">
    <aside class="card lyrics-song-list">
      <h3>Songy</h3>
      <ul>
      <% for (SongRow s : songs) { boolean empty = s.langs.isEmpty(); %>
        <li>
          <a href="/admin/lyrics?song=<%= s.id %>" class="<%= song != null && song.id == s.id ? "active" : "" %> <%= empty ? "missing" : "" %>">
            <span class="ls-name"><%= com.github.skeliit.WebUtils.escapeHtml(s.name) %></span>
            <span class="ls-meta"><%= s.year != null ? s.year : "" %> · <%= empty ? "bez textu" : s.langs %></span>
          </a>
        </li>
      <% } %>
      </ul>

      <% if (!videos.isEmpty()) { %>
      <h3>Klipy bez songu</h3>
      <p class="text-dim">Kliknutím z klipu uděláš song a můžeš mu doplnit text.</p>
      <% for (VideoRow v : videos) { %>
        <form method="post" action="/admin/lyrics" class="ls-video">
          <input type="hidden" name="csrf" value="<%= csrfToken %>">
          <input type="hidden" name="action" value="from_video">
          <input type="hidden" name="youtube_id" value="<%= com.github.skeliit.WebUtils.escapeHtml(v.youtubeId) %>">
          <button type="submit"><i class="fab fa-youtube"></i> <%= com.github.skeliit.WebUtils.escapeHtml(v.title) %></button>
        </form>
      <% } %>
      <% } %>

      <h3>Nový song</h3>
      <form method="post" action="/admin/lyrics" class="ls-new">
        <input type="hidden" name="csrf" value="<%= csrfToken %>">
        <input type="hidden" name="action" value="new_song">
        <input name="name" placeholder="Název songu" required>
        <input name="year" type="number" min="1990" max="2100" placeholder="Rok">
        <button type="submit">Přidat</button>
      </form>
    </aside>

    <section class="card lyrics-edit">
      <% if (song == null) { %>
        <p class="text-dim">Vyber vlevo song. Songy bez textu jsou nahoře a zvýrazněné.</p>
      <% } else { %>
        <h3><%= com.github.skeliit.WebUtils.escapeHtml(song.name) %> <% if (song.year != null) { %><span class="song-year"><%= song.year %></span><% } %></h3>
        <nav class="lyrics-langs">
          <% for (String l : new String[]{"cs", "en", "de", "uk", "vi"}) { %>
            <a href="/admin/lyrics?song=<%= song.id %>&lang=<%= l %>" class="<%= l.equals(editLang) ? "active" : "" %>"><%= l.toUpperCase() %></a>
          <% } %>
          <% if (lyricId != null) { %><a class="lyrics-view" href="/lyrics/<%= lyricId %>" target="_blank">Zobrazit na webu ↗</a><% } %>
        </nav>
        <form method="post" action="/admin/lyrics">
          <input type="hidden" name="csrf" value="<%= csrfToken %>">
          <input type="hidden" name="action" value="save">
          <input type="hidden" name="song_id" value="<%= song.id %>">
          <input type="hidden" name="lang" value="<%= editLang %>">
          <textarea name="words" rows="24" placeholder="Sem vlož text písně. Prázdné řádky oddělují sloky."><%= com.github.skeliit.WebUtils.escapeHtml(words) %></textarea>
          <p class="form-note">Když text úplně smažeš a uložíš, tahle jazyková verze zmizí z webu i s komentáři u ní.</p>
          <button type="submit" class="btn-primary">Uložit text</button>
        </form>
      <% } %>
    </section>
  </div>
</main>
<%@ include file="/includes/footer.jsp" %>
