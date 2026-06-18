<%@ include file="includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<main>
  <h2>Admin</h2>
  <p>Tato sekce je dostupná pouze pro ADMIN.</p>

  <div class="admin-grid">
    <section class="admin-card">
      <h3>Synchronizace YouTube</h3>
      <div class="admin-actions">
        <a class="admin-sync" href="/admin/sync">Spustit sync</a>
      </div>
      <p style="opacity:.8; font-size:.95em;">Načte poslední videa z kanálu a spáruje je se songy.</p>
    </section>

    <section class="admin-card">
      <h3>Upravit / napojit video</h3>
      <form method="post" action="/admin/video" style="display:grid; gap:8px;">
        <label>YouTube ID: <input name="youtube_id" required></label>
        <label>Název (přepíše title v DB): <input name="title"></label>
        <label>Song name (vytvoří/propojí): <input name="song_name"></label>
        <label>Rok: <input name="year" type="number" min="1900" max="2100"></label>
        <label>Napojit na lyric ID: <input name="lyric_id" type="number" min="1"></label>
        <button type="submit">Uložit</button>
      </form>
    </section>

    <section class="admin-card">
      <h3>Přehled písní</h3>
      <p><a href="/admin/songs">Zobrazit tabulku písní</a> – status textů (jazyky) a videí.</p>
    </section>

    <section class="admin-card">
      <h3>Moderace komentářů</h3>
      <form method="post" action="/admin/comment" style="display:flex; gap:8px; align-items:center;">
        <label>ID komentáře: <input name="comment_id" required></label>
        <button type="submit" style="background:#7b1e1e;color:#fff;border:none;padding:6px 10px;border-radius:8px;">Smazat</button>
      </form>
    </section>

    <section class="admin-card">
      <h3>Uživatelé</h3>
      <div class="admin-actions">
        <a href="/admin_users.jsp">Správa uživatelů</a>
      </div>
    </section>

    <section class="admin-card">
      <h3>Nástroje</h3>
      <ul style="margin:0; padding-left:18px;">
        <li>Rebuild search index (TODO)</li>
        <li>Cache clear (TODO)</li>
        <li>Export DB (SQL dump) (TODO)</li>
      </ul>
    </section>
  </div>
</main>

<%@ include file="includes/footer.jsp" %>
