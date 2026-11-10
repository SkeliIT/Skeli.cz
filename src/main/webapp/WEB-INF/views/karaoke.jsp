<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.github.skeliit.model.KaraokeSong, com.github.skeliit.WebUtils" %>
<%--
  Karaoke (/karaoke, web/site/KaraokeCinemaServlet): vzhled Ulice, návrh C „Vypálené“. Nahoře korunka a KARAOKE
  sprejem, pod tím „pódium“ bez rámu: řádek ukázkové písně se rozžhaví slovo po slovu do bíla a vychladne do barvy
  fotky (opravdové časy, js/karaoke-page.js). Kouřový předěl, pod ním Setlist písní. Zpívat = kino /karaoke-kino/{uuid}
  (jen pro přihlášené; host dostane přihlášení a registraci).
--%>
<%
  @SuppressWarnings("unchecked")
  java.util.List<KaraokeSong> kSongs = (java.util.List<KaraokeSong>) request.getAttribute("karaokeSongs");
  boolean kCanSing = Boolean.TRUE.equals(request.getAttribute("canSing"));
  KaraokeSong kFirst = kSongs == null || kSongs.isEmpty() ? null : kSongs.get(0);
  String kRoles = WebUtils.escapeHtml(t.getProperty("karaoke.page.roles")).replace(" · ", " <b>·</b> ");
%>
<main class="karaoke-page">
  <header class="page-hero with-smoke kp-hero">
    <div class="kp-head">
      <span class="kp-crown" aria-hidden="true"><i class="fa-solid fa-crown"></i></span>
      <h1 class="kp-name"><span class="kp-sign" aria-hidden="true">Karaoke</span><span class="sr-only"><%= WebUtils.escapeHtml(t.getProperty("menu.karaoke")) %></span></h1>
      <p class="kp-roles"><%= kRoles %></p>
      <span class="kp-pass"><i class="dot" aria-hidden="true"></i><%= WebUtils.escapeHtml(t.getProperty(kCanSing ? "karaoke.page.member" : "karaoke.page.guest")) %></span>
    </div>
    <% if (kFirst != null) { %>
    <section class="kp-stage" aria-live="off">
      <div class="kp-glow" id="kpGlow" aria-hidden="true"><img src="<%= kFirst.getThumb() %>" alt=""></div>
      <p class="kp-now"><span><%= WebUtils.escapeHtml(t.getProperty("karaoke.page.now")) %></span><b id="kpNow"><%= WebUtils.escapeHtml(kFirst.title) %></b></p>
      <div class="kp-lyr" id="kpLyr" aria-hidden="true"><span class="kp-line kp-cur">&nbsp;</span><span class="kp-line kp-nxt"></span></div>
      <div class="kp-cta">
        <% if (kCanSing) { %>
        <a class="kp-sing" id="kpSing" href="/karaoke-kino/<%= kFirst.uuid %>"><i class="fa-solid fa-microphone" aria-hidden="true"></i><%= WebUtils.escapeHtml(t.getProperty("karaoke.sing")) %></a>
        <% } else { %>
        <a class="kp-sing" href="/login.jsp?next=%2Fkaraoke"><i class="fa-solid fa-lock" aria-hidden="true"></i><%= WebUtils.escapeHtml(t.getProperty("karaoke.page.login")) %></a>
        <a class="kp-ghost" href="/register.jsp"><%= WebUtils.escapeHtml(t.getProperty("karaoke.page.register")) %></a>
        <% } %>
      </div>
    </section>
    <% } %>
    <div class="smoke-edge b" aria-hidden="true"><canvas></canvas></div>
  </header>

  <section class="kp-setlist">
    <h2 class="kp-setlist-head"><%= WebUtils.escapeHtml(t.getProperty("karaoke.page.setlist")) %></h2>
    <% if (kSongs == null || kSongs.isEmpty()) { %>
    <p class="empty-note"><%= WebUtils.escapeHtml(t.getProperty("karaoke.list.none")) %></p>
    <% } else { int n = 0; for (KaraokeSong s : kSongs) { n++; %>
    <button type="button" class="kp-row<%= n == 1 ? " sel" : "" %>" data-i="<%= n - 1 %>" data-uuid="<%= s.uuid %>" data-thumb="<%= s.getThumb() %>">
      <span class="n" aria-hidden="true"><%= n < 10 ? "0" + n : String.valueOf(n) %></span>
      <span class="t"><b><%= WebUtils.escapeHtml(s.title) %></b><span><%= s.year == null ? "" : s.year %><%= s.credits == null || s.credits.isBlank() ? "" : " · " + WebUtils.escapeHtml(s.credits) %></span></span>
      <span class="d"><span class="eqr" aria-hidden="true"><i></i><i></i><i></i></span><%= s.duration > 0 ? (s.duration / 60) + ":" + (s.duration % 60 < 10 ? "0" : "") + (s.duration % 60) : "" %><% if (!kCanSing) { %> <i class="fa-solid fa-lock" aria-hidden="true"></i><% } %></span>
      <span class="th"><img src="<%= s.getThumb() %>" alt="" loading="lazy"></span>
    </button>
    <% } } %>
  </section>

<script>window.KARAOKE = <%= request.getAttribute("karaokeJson") %>;</script>
<script src="/js/karaoke-page.js?v=<%= assetVersion %>"></script>
</main>
<%@ include file="/includes/footer.jsp" %>
