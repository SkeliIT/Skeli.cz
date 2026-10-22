<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="/includes/header.jsp" %>
<%@ page import="java.util.List, com.github.skeliit.web.admin.AdminLyricsServlet.SongRow, com.github.skeliit.web.admin.AdminLyricsServlet.VideoRow" %>
<%-- Texty: přehled, co u písní chybí. Samotné texty se upravují u písně v záložce Texty (/admin/song#texty);
     tady zůstaly klipy bez písně (udělat z nich píseň / smazat) a nová píseň bez klipu. --%>
<%
  @SuppressWarnings("unchecked") List<SongRow> songs = (List<SongRow>) request.getAttribute("songs");
  @SuppressWarnings("unchecked") List<VideoRow> videos = (List<VideoRow>) request.getAttribute("videos");
  String csrfToken = com.github.skeliit.filter.CsrfFilter.token(session);
  int complete = 0;
  for (SongRow s : songs) if ("všech 5 jazyků".equals(s.getLangSummary())) complete++;
%>
<main class="admin-page admin-lyrics">
  <%@ include file="/includes/admin-nav.jspf" %>
  <h2 class="admin-page-title">Texty</h2>
  <p class="text-dim">Kompletní (všech 5 jazyků): <b><%= complete %> z <%= songs.size() %></b>. Kliknutím otevřeš píseň rovnou v záložce Texty.</p>

  <% if ("1".equals(request.getParameter("hidden"))) { %><div class="form-success">Klip je smazaný z webu i z databáze a synchronizace z YouTube ho už nevrátí. 30 dní ho najdeš v Koši.</div><% } %>
  <% if ("1".equals(request.getParameter("error"))) { %><div class="form-alert">Něco chybí, zkus to znovu.</div><% } %>

  <section class="admin-card">
    <ul class="texts-overview">
    <% for (SongRow s : songs) { String sum = s.getLangSummary(); boolean done = "všech 5 jazyků".equals(sum), none = "bez textu".equals(sum); %>
      <li class="<%= done ? "done" : none ? "none" : "part" %>">
        <a href="/admin/song?id=<%= s.id %>#texty">
          <span class="to-name"><%= com.github.skeliit.WebUtils.escapeHtml(s.name) %><% if (s.year != null) { %> <small><%= s.year %></small><% } %></span>
          <span class="to-state"><i class="fa-solid <%= done ? "fa-circle-check" : none ? "fa-circle-xmark" : "fa-circle-half-stroke" %>" aria-hidden="true"></i> <%= sum %></span>
        </a>
      </li>
    <% } %>
    </ul>
  </section>

  <div class="admin-grid">
    <% if (!videos.isEmpty()) { %>
    <section class="admin-card">
      <h3><i class="fa-brands fa-youtube" aria-hidden="true"></i> Klipy bez písně</h3>
      <p class="text-dim">Klikni na klip a udělá se z něj píseň. Klip, který ještě není hotová písnička, smaž košem.</p>
      <% for (VideoRow v : videos) { String vid = com.github.skeliit.WebUtils.escapeHtml(v.youtubeId), vtitle = com.github.skeliit.WebUtils.escapeHtml(v.title); %>
        <div class="ls-video-row">
          <form method="post" action="/admin/lyrics" class="ls-video">
            <input type="hidden" name="csrf" value="<%= csrfToken %>">
            <input type="hidden" name="action" value="from_video">
            <input type="hidden" name="youtube_id" value="<%= vid %>">
            <button type="submit"><i class="fab fa-youtube"></i> <%= vtitle %></button>
          </form>
          <form method="post" action="/admin/lyrics" class="ls-video-hide" onsubmit="return confirm('Smazat tenhle klip z webu i z databáze? 30 dní ho najdeš v Koši.')">
            <input type="hidden" name="csrf" value="<%= csrfToken %>">
            <input type="hidden" name="action" value="hide_video">
            <input type="hidden" name="youtube_id" value="<%= vid %>">
            <button type="submit" title="Smazat klip" aria-label="Smazat klip: <%= vtitle %>"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
          </form>
        </div>
      <% } %>
    </section>
    <% } %>

    <section class="admin-card">
      <h3><i class="fa-solid fa-plus" aria-hidden="true"></i> Nová píseň bez klipu</h3>
      <p class="text-dim">Píseň s klipem přidáš přes „Přidat track“.</p>
      <form method="post" action="/admin/lyrics" class="ls-new">
        <input type="hidden" name="csrf" value="<%= csrfToken %>">
        <input type="hidden" name="action" value="new_song">
        <input name="name" placeholder="Název písně" required>
        <input name="year" type="number" min="1990" max="2100" placeholder="Rok">
        <button type="submit">Přidat</button>
      </form>
    </section>
  </div>
</main>
<%@ include file="/includes/footer.jsp" %>
