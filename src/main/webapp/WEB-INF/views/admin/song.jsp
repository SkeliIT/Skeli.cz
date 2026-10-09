<%@ include file="/includes/header.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<main class="admin-page admin-song-page">
  <%@ include file="/includes/admin-nav.jspf" %>
  <p class="admin-crumb">
    <a href="/admin/songs">Písně</a> ·
    <strong><c:out value="${song.name}"/></strong>
  </p>

  <c:if test="${not empty param.msg}">
    <p class="admin-flash">
      <c:choose>
        <c:when test="${param.msg == 'saved'}">Uloženo.</c:when>
        <c:when test="${param.msg == 'track_added'}">Track přidán. Teď můžeš doplnit překlady textu a obrázek.</c:when>
        <c:when test="${param.msg == 'video_linked'}">YouTube video napojeno.</c:when>
        <c:when test="${param.msg == 'video_unlinked'}">YouTube video odpojeno.</c:when>
        <c:when test="${param.msg == 'preview_saved'}">Náhledový obrázek uložen.</c:when>
        <c:when test="${param.msg == 'preview_deleted'}">Náhledový obrázek smazán.</c:when>
        <c:when test="${param.msg == 'art_saved'}">Obrázek v seznamu Texty uložen.</c:when>
        <c:when test="${param.msg == 'bad_art'}">Pozici obrázku se nepodařilo přečíst – zkus to znovu.</c:when>
        <c:when test="${param.msg == 'bad_youtube'}">Neplatné YouTube ID / URL.</c:when>
        <c:when test="${param.msg == 'bad_name'}">Název písně je povinný.</c:when>
        <c:when test="${param.msg == 'locale_saved'}">Překlad / SEO uloženo.</c:when>
        <c:when test="${param.msg == 'translated'}">Přeloženo.</c:when>
        <c:when test="${param.msg == 'no_translator'}">Není nastaven překladač (DEEPL_API_KEY nebo LIBRETRANSLATE_URL).</c:when>
        <c:when test="${param.msg == 'no_cs_source'}">Nejdřív ulož český text.</c:when>
        <c:when test="${param.msg == 'translate_failed'}">Překlad selhal.</c:when>
        <c:when test="${param.msg == 'bad_seo_slug'}">SEO URL musí být krátký alias (a–z, 0–9, pomlčky).</c:when>
        <c:when test="${param.msg == 'seo_slug_taken'}">Tento SEO alias už v tomto jazyce používá jiná píseň.</c:when>
        <c:when test="${param.msg == 'no_file'}">Nebyl vybrán žádný soubor.</c:when>
        <c:when test="${param.msg == 'too_large'}">Soubor je příliš velký (max 20&nbsp;MB).</c:when>
        <c:when test="${param.msg == 'invalid_image'}">Neplatný obrázek.</c:when>
        <c:otherwise><c:out value="${param.msg}"/></c:otherwise>
      </c:choose>
    </p>
  </c:if>

  <header class="song-hub-head">
    <c:choose>
      <c:when test="${not empty song.previewImageUrl}">
        <img class="song-hub-cover" src="<c:out value='${song.previewImageUrl}'/>" alt="">
      </c:when>
      <c:otherwise>
        <div class="song-hub-cover song-hub-cover-empty"><i class="fa-solid fa-music"></i></div>
      </c:otherwise>
    </c:choose>
    <div>
      <h2><c:out value="${song.name}"/></h2>
      <p class="song-uuid-row">
        <span class="text-dim">UUID</span>
        <code id="song-uuid" class="song-uuid"><c:out value="${song.uuid}"/></code>
        <button type="button" id="song-uuid-copy" class="control-btn song-uuid-copy" title="Kopírovat UUID" aria-label="Kopírovat UUID">
          <i class="fa-regular fa-copy"></i>
        </button>
        <span id="song-uuid-copied" class="song-uuid-copied" hidden>Zkopírováno</span>
      </p>
      <p class="text-dim song-hub-meta">
        <c:if test="${not empty song.year}">${song.year} · </c:if>
        interní ID ${song.id}
        <c:if test="${not empty song.uuid}">
          · <a href="<c:out value='${song.publicPath}'/>" target="_blank" rel="noopener">veřejná stránka ↗</a>
        </c:if>
      </p>
      <c:if test="${not empty publicSongUrl}">
        <p class="song-uuid-row">
          <span class="text-dim">Sdílecí odkaz</span>
          <code id="song-share-url" class="song-uuid song-share-url"><c:out value="${publicSongUrl}"/></code>
          <button type="button" id="song-share-copy" class="control-btn song-uuid-copy" title="Kopírovat odkaz" aria-label="Kopírovat odkaz">
            <i class="fa-regular fa-copy"></i>
          </button>
          <span id="song-share-copied" class="song-uuid-copied" hidden>Zkopírováno</span>
        </p>
      </c:if>
    </div>
  </header>

  <div class="admin-grid song-hub-grid">

    <!-- Základní údaje -->
    <section class="admin-card">
      <h3>Píseň</h3>
      <form method="post" action="/admin/song" class="admin-form">
        <input type="hidden" name="csrf" value="${csrf}">
        <input type="hidden" name="id" value="${song.id}">
        <input type="hidden" name="action" value="save">
        <label>Název
          <input name="name" value="<c:out value='${song.name}'/>" required>
        </label>
        <label>Rok
          <input name="year" type="number" min="1900" max="2100" value="${song.year != null ? song.year : ''}">
        </label>
        <button type="submit">Uložit</button>
      </form>
    </section>

    <!-- Náhled / OG -->
    <section class="admin-card">
      <h3>Náhledový obrázek (Open Graph)</h3>
      <p class="text-dim">16:9, 1280×720. Před uložením ořízni, přibliž nebo otoč. Max. 20&nbsp;MB (JPEG/PNG/WebP).</p>
      <c:if test="${param.msg == 'too_large'}"><p class="admin-error">Soubor je příliš velký (max. 20&nbsp;MB).</p></c:if>
      <c:if test="${param.msg == 'invalid_image'}"><p class="admin-error">Soubor není platný obrázek.</p></c:if>
      <c:if test="${param.msg == 'no_file'}"><p class="admin-error">Nebyl vybrán žádný soubor.</p></c:if>
      <c:if test="${param.msg == 'csrf'}"><p class="admin-error">Relace vypršela — obnov stránku a zkus znovu.</p></c:if>

      <div class="song-preview-toolbar">
        <label class="song-preview-upload">
          <input id="song-preview-input" type="file" accept="image/jpeg,image/png,image/webp">
          <span>Nahrát jiný soubor</span>
        </label>
        <c:if test="${not empty song.previewImageUrl}">
          <form method="post" action="/admin/songs/preview" class="song-preview-form" id="song-preview-delete">
            <input type="hidden" name="csrf" value="${csrf}">
            <input type="hidden" name="song_id" value="${song.id}">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="redirect" value="/admin/song?uuid=${song.uuid}">
            <button type="submit" class="btn-delete" onclick="return confirm('Smazat náhled?')">Smazat náhled</button>
          </form>
        </c:if>
      </div>

      <p id="song-preview-empty" class="text-dim"<c:if test="${not empty song.previewImageUrl}"> hidden</c:if>>Zatím žádný náhled — vyber soubor.</p>

      <div id="song-cropper-wrap" class="song-cropper-wrap"<c:if test="${empty song.previewImageUrl}"> hidden</c:if>>
        <c:choose>
          <c:when test="${not empty song.previewImageUrl}">
            <img id="song-cropper-img" alt="Ořez náhledu" src="<c:out value='${song.previewImageUrl}'/>">
          </c:when>
          <c:otherwise>
            <img id="song-cropper-img" alt="Ořez náhledu">
          </c:otherwise>
        </c:choose>
        <div class="song-cropper-btns">
          <button type="button" id="song-zoom-out" class="control-btn" title="Oddálit"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
          <button type="button" id="song-zoom-in" class="control-btn" title="Přiblížit"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
          <button type="button" id="song-rotate-left" class="control-btn" title="Otočit vlevo"><i class="fa-solid fa-rotate-left"></i></button>
          <button type="button" id="song-rotate-right" class="control-btn" title="Otočit vpravo"><i class="fa-solid fa-rotate-right"></i></button>
          <button type="button" id="song-crop-reset" class="control-btn" title="Obnovit uložený">Obnovit</button>
          <button type="button" id="song-crop-save" class="control-btn control-btn-primary">Uložit náhled</button>
        </div>
        <p id="song-crop-status" class="text-dim" hidden></p>
      </div>

      <form id="song-preview-form" method="post" action="/admin/songs/preview" enctype="multipart/form-data" hidden>
        <input type="hidden" name="csrf" value="${csrf}">
        <input type="hidden" name="song_id" value="${song.id}">
        <input type="hidden" name="redirect" value="/admin/song?uuid=${song.uuid}">
      </form>
    </section>

    <!-- Obrázek v řádku na stránce Texty: posun a velikost ručně -->
    <section class="admin-card admin-card-wide" id="row-art">
      <h3>Obrázek v seznamu Texty</h3>
      <c:choose>
        <c:when test="${empty rowArt}">
          <p class="text-dim">Song nemá klip ani náhledovou fotku, v seznamu má jen zlatou záři. Nahraj náhled výš a pak ho tu můžeš posunout.</p>
        </c:when>
        <c:otherwise>
          <p class="text-dim">
            Obrázek <strong>táhni myší</strong> (na telefonu prstem), <strong>kolečkem myši</strong> nebo posuvníkem ho zvětšíš a zmenšíš.
            Nahoře je řádek na počítači, pod ním na telefonu. Používá se nejnovější klip, jinak náhledová fotka.
          </p>
          <div class="art-editor" id="artEditor"
               data-x="${song.artX != null ? song.artX : ''}" data-y="${song.artY != null ? song.artY : ''}" data-zoom="${song.artZoom != null ? song.artZoom : ''}">
            <c:forEach var="device" items="desk,phone">
              <div class="art-preview art-${device}">
                <span class="art-device">${device == 'desk' ? 'Počítač' : 'Telefon'}</span>
                <div class="song-row art-row">
                  <span class="song-row-art"><img src="<c:out value='${rowArt}'/>" alt="" draggable="false" data-trim-bars></span>
                  <span class="song-row-text">
                    <span class="song-row-title"><c:out value="${songTitle.title}"/></span>
                    <c:if test="${not empty songTitle.credits}"><span class="song-row-meta"><c:out value="${songTitle.credits}"/></span></c:if>
                  </span>
                </div>
              </div>
            </c:forEach>
          </div>
          <div class="art-controls">
            <label class="art-zoom">Velikost
              <input type="range" id="artZoom" min="25" max="300" step="1" value="100">
              <output id="artZoomOut">100 %</output>
            </label>
            <button type="button" id="artWhole" class="control-btn">Celá fotka</button>
            <button type="button" id="artFill" class="control-btn">Vyplnit řádek</button>
          </div>
          <form method="post" action="/admin/song" class="admin-inline-form art-form" id="artForm">
            <input type="hidden" name="csrf" value="${csrf}">
            <input type="hidden" name="id" value="${song.id}">
            <input type="hidden" name="action" value="save_art">
            <input type="hidden" name="art_x" id="artX">
            <input type="hidden" name="art_y" id="artY">
            <input type="hidden" name="art_zoom" id="artZoomVal">
            <button type="submit">Uložit</button>
            <button type="submit" name="auto" value="1" class="control-btn">Vrátit automaticky</button>
            <span class="text-dim">${song.artZoom != null ? 'Teď: nastaveno ručně' : 'Teď: automaticky'}</span>
          </form>
        </c:otherwise>
      </c:choose>
    </section>

    <!-- Streaming IDs -->
    <section class="admin-card">
      <h3>Streaming</h3>
      <form method="post" action="/admin/song" class="admin-form">
        <input type="hidden" name="csrf" value="${csrf}">
        <input type="hidden" name="id" value="${song.id}">
        <input type="hidden" name="action" value="save">
        <input type="hidden" name="name" value="<c:out value='${song.name}'/>">
        <input type="hidden" name="year" value="${song.year != null ? song.year : ''}">
        <label>Apple Music ID
          <input name="apple_music_id" value="<c:out value='${song.appleMusicId}'/>" placeholder="např. 1234567890">
        </label>
        <c:if test="${not empty song.appleMusicId}">
          <p><a href="https://music.apple.com/song/<c:out value='${song.appleMusicId}'/>" target="_blank" rel="noopener">Otevřít v Apple Music ↗</a></p>
        </c:if>
        <label>Spotify track ID
          <input name="spotify_id" value="<c:out value='${song.spotifyId}'/>" placeholder="např. 4iV5W9uYEdYUVa79Axb7Rh">
        </label>
        <c:if test="${not empty song.spotifyId}">
          <p><a href="https://open.spotify.com/track/<c:out value='${song.spotifyId}'/>" target="_blank" rel="noopener">Otevřít ve Spotify ↗</a></p>
        </c:if>
        <button type="submit">Uložit streaming ID</button>
      </form>
    </section>

    <!-- Texty + SEO per language -->
    <section class="admin-card admin-card-wide">
      <h3>Texty, popisky a SEO URL</h3>
      <p class="text-dim">
        Každý jazyk má vlastní veřejnou adresu <code>/{lang}/song/{alias}</code> (nebo UUID).
        <c:choose>
          <c:when test="${translatorReady}">Překlad: <strong><c:out value="${translatorName}"/></strong>.</c:when>
          <c:otherwise>Překladač není nastavený — doplň <code>DEEPL_API_KEY</code> nebo <code>LIBRETRANSLATE_URL</code> v <code>.env</code>.</c:otherwise>
        </c:choose>
      </p>
      <div class="locale-tabs" id="locale-tabs">
        <c:forEach var="lang" items="${langs}">
          <button type="button" class="locale-tab${param.tab == lang || (empty param.tab && lang == 'cs') ? ' active' : ''}" data-lang="${lang}">${lang}</button>
        </c:forEach>
      </div>
      <c:forEach var="lang" items="${langs}">
        <c:set var="loc" value="${locales[lang]}"/>
        <div class="locale-panel${param.tab == lang || (empty param.tab && lang == 'cs') ? '' : ' hidden'}" data-panel="${lang}">
          <form method="post" action="/admin/song" class="admin-form">
            <input type="hidden" name="csrf" value="${csrf}">
            <input type="hidden" name="id" value="${song.id}">
            <input type="hidden" name="action" value="save_locale">
            <input type="hidden" name="lang" value="${lang}">
            <label>Text (${lang})
              <textarea name="words" rows="12"><c:out value="${loc.words}"/></textarea>
            </label>
            <label>SEO URL alias (${lang})
              <input name="seo_slug" value="<c:out value='${loc.seoSlug}'/>"
                     pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxlength="120"
                     placeholder="napr. musis-odejit" autocomplete="off">
            </label>
            <p class="text-dim">
              Veřejná URL:
              <code>/<c:out value="${lang}"/>/song/<c:out value="${empty loc.seoSlug ? song.uuid : loc.seoSlug}"/></code>
              · <a href="/<c:out value='${lang}'/>/song/<c:out value='${empty loc.seoSlug ? song.uuid : loc.seoSlug}'/>" target="_blank" rel="noopener">otevřít ↗</a>
            </p>
            <label>Meta popisek (max 320 znaků)
              <textarea name="meta_description" rows="3" maxlength="320"><c:out value="${loc.metaDescription}"/></textarea>
            </label>
            <div class="admin-inline-form">
              <button type="submit">Uložit ${lang}</button>
            </div>
          </form>
          <c:if test="${lang != 'cs'}">
            <form method="post" action="/admin/song" class="admin-form admin-inline-form translate-form">
              <input type="hidden" name="csrf" value="${csrf}">
              <input type="hidden" name="id" value="${song.id}">
              <input type="hidden" name="action" value="translate_locale">
              <input type="hidden" name="lang" value="${lang}">
              <button type="submit" ${translatorReady ? '' : 'disabled'}>
                Přeložit z CS (<c:out value="${translatorName}"/>)
              </button>
              <label class="inline-check">
                <input type="checkbox" name="overwrite" value="1"> přepsat existující text
              </label>
            </form>
          </c:if>
        </div>
      </c:forEach>
    </section>

    <!-- YouTube -->
    <section class="admin-card admin-card-wide">
      <h3><i class="fab fa-youtube icon-youtube"></i> YouTube videa</h3>
      <c:choose>
        <c:when test="${empty videos}">
          <p class="text-dim">Žádné napojené video.</p>
        </c:when>
        <c:otherwise>
          <table class="admin-table">
            <thead>
              <tr><th></th><th>Název</th><th>YouTube ID</th><th></th></tr>
            </thead>
            <tbody>
              <c:forEach var="v" items="${videos}">
                <tr>
                  <td>
                    <img class="song-preview-thumb" src="/yt-thumb/<c:out value='${v.youtubeId}'/>/mqdefault.jpg" alt="">
                  </td>
                  <td><c:out value="${v.title}"/></td>
                  <td>
                    <a href="https://www.youtube.com/watch?v=<c:out value='${v.youtubeId}'/>" target="_blank" rel="noopener">
                      <c:out value="${v.youtubeId}"/>
                    </a>
                  </td>
                  <td>
                    <form method="post" action="/admin/song" class="inline-form">
                      <input type="hidden" name="csrf" value="${csrf}">
                      <input type="hidden" name="id" value="${song.id}">
                      <input type="hidden" name="action" value="unlink_video">
                      <input type="hidden" name="youtube_id" value="<c:out value='${v.youtubeId}'/>">
                      <button type="submit" class="btn-delete" onclick="return confirm('Odpojit video od této písně?')">Odpojit</button>
                    </form>
                  </td>
                </tr>
              </c:forEach>
            </tbody>
          </table>
        </c:otherwise>
      </c:choose>

      <h4>Napojit video</h4>
      <form method="post" action="/admin/song" class="admin-form admin-form-row">
        <input type="hidden" name="csrf" value="${csrf}">
        <input type="hidden" name="id" value="${song.id}">
        <input type="hidden" name="action" value="link_video">
        <label>YouTube ID nebo URL
          <input name="youtube_id" required placeholder="dQw4w9WgXcQ nebo https://youtu.be/...">
        </label>
        <label>Název (volitelné)
          <input name="title" placeholder="ponechá stávající / ID">
        </label>
        <button type="submit">Napojit</button>
      </form>
    </section>
  </div>
</main>

<link href="/vendor/cropper/cropper.min.css" rel="stylesheet">
<script src="/vendor/cropper/cropper.min.js"></script>
<script>
(function () {
  function wireCopy(btnId, sourceId, copiedId) {
    const copyBtn = document.getElementById(btnId);
    const sourceEl = document.getElementById(sourceId);
    const copiedEl = document.getElementById(copiedId);
    if (!copyBtn || !sourceEl) return;
    copyBtn.addEventListener('click', function () {
      const text = sourceEl.textContent.trim();
      const done = function () {
        if (!copiedEl) return;
        copiedEl.hidden = false;
        setTimeout(function () { copiedEl.hidden = true; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          window.prompt('Zkopíruj:', text);
        });
      } else {
        window.prompt('Zkopíruj:', text);
      }
    });
  }
  wireCopy('song-uuid-copy', 'song-uuid', 'song-uuid-copied');
  wireCopy('song-share-copy', 'song-share-url', 'song-share-copied');

  document.querySelectorAll('.locale-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      document.querySelectorAll('.locale-tab').forEach(function (b) { b.classList.toggle('active', b === btn); });
      document.querySelectorAll('.locale-panel').forEach(function (p) {
        p.classList.toggle('hidden', p.getAttribute('data-panel') !== lang);
      });
    });
  });
})();
</script>
<script>
(function () {
  const input = document.getElementById('song-preview-input');
  const wrap = document.getElementById('song-cropper-wrap');
  const img = document.getElementById('song-cropper-img');
  const form = document.getElementById('song-preview-form');
  const empty = document.getElementById('song-preview-empty');
  const statusEl = document.getElementById('song-crop-status');
  const csrf = form.querySelector('input[name="csrf"]').value;
  let cropper = null;
  let objectUrl = null;
  let lastSavedUrl = (img.getAttribute('src') || '').trim() || null;

  const cropperOpts = {
    aspectRatio: 16 / 9,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 1,
    movable: true,
    rotatable: true,
    scalable: true,
    zoomOnWheel: true,
    background: false,
    responsive: true
  };

  function setStatus(msg) {
    if (!statusEl) return;
    if (!msg) { statusEl.hidden = true; statusEl.textContent = ''; return; }
    statusEl.hidden = false;
    statusEl.textContent = msg;
  }

  function showEditor(hasImage) {
    wrap.hidden = !hasImage;
    if (empty) empty.hidden = hasImage;
  }

  function initCropper() {
    if (cropper) { cropper.destroy(); cropper = null; }
    cropper = new Cropper(img, cropperOpts);
  }

  function loadUrl(url) {
    if (!url) {
      if (cropper) { cropper.destroy(); cropper = null; }
      if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
      img.removeAttribute('src');
      showEditor(false);
      setStatus('');
      return;
    }
    showEditor(true);
    if (cropper) { cropper.destroy(); cropper = null; }
    const onReady = function () {
      img.removeEventListener('load', onReady);
      img.removeEventListener('error', onReady);
      if (img.naturalWidth) initCropper();
    };
    img.addEventListener('load', onReady);
    img.addEventListener('error', onReady);
    img.src = url;
    if (img.complete && img.naturalWidth) onReady();
  }

  function loadFile(f) {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { alert('Soubor je příliš velký (max. 20 MB).'); return; }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(f);
    loadUrl(objectUrl);
  }

  input.addEventListener('change', function () {
    loadFile(this.files && this.files[0]);
  });

  document.getElementById('song-crop-reset').addEventListener('click', function () {
    input.value = '';
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    if (lastSavedUrl) loadUrl(lastSavedUrl);
    else loadUrl(null);
  });
  document.getElementById('song-zoom-in').addEventListener('click', function () { if (cropper) cropper.zoom(0.1); });
  document.getElementById('song-zoom-out').addEventListener('click', function () { if (cropper) cropper.zoom(-0.1); });
  document.getElementById('song-rotate-left').addEventListener('click', function () { if (cropper) cropper.rotate(-90); });
  document.getElementById('song-rotate-right').addEventListener('click', function () { if (cropper) cropper.rotate(90); });

  document.getElementById('song-crop-save').addEventListener('click', function () {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
      width: 1280,
      height: 720,
      imageSmoothingQuality: 'high',
      fillColor: '#000'
    });
    if (!canvas) return;
    setStatus('Ukládám…');
    canvas.toBlob(async function (blob) {
      if (!blob) { setStatus('Nepodařilo se vytvořit obrázek.'); return; }
      const fd = new FormData(form);
      fd.append('preview', blob, 'preview.jpg');
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: fd,
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': csrf
          },
          credentials: 'same-origin'
        });
        const data = await res.json().catch(function () { return null; });
        if (!res.ok || !data || !data.ok) {
          const err = data && data.error;
          if (err === 'csrf') alert('Relace vypršela — obnov stránku a zkus znovu.');
          else if (err === 'too_large') alert('Soubor je příliš velký.');
          else if (err === 'invalid_image') alert('Neplatný obrázek.');
          else alert('Uložení selhalo.');
          setStatus('');
          return;
        }
        lastSavedUrl = data.url;
        if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
        input.value = '';
        loadUrl(data.url);
        setStatus('Uloženo.');
        setTimeout(function () { setStatus(''); }, 2000);
      } catch (e) {
        alert('Síťová chyba při ukládání.');
        setStatus('');
      }
    }, 'image/jpeg', 0.9);
  });

  // Always open editor when a preview already exists
  if (lastSavedUrl) {
    if (img.complete && img.naturalWidth) initCropper();
    else img.addEventListener('load', function once() {
      img.removeEventListener('load', once);
      initCropper();
    });
  }
})();
</script>
<script src="/js/trim-bars.js?v=<%= assetVersion %>"></script>
<script>
// the picture in the song's Texty row: drag to move it, wheel / slider to resize. The same CSS
// variables as on the Texty page (--tx = moved sideways, in % of the picture area, --py = the point
// of the picture, in % of its height, on the area's 45 % line, --az = size compared with "as wide as
// the area"), so the preview is exactly what visitors see, on a computer and on a phone.
(function () {
  var ed = document.getElementById('artEditor');
  if (!ed) return;
  var rows = [].slice.call(ed.querySelectorAll('.art-row'));
  var imgs = [].slice.call(ed.querySelectorAll('.song-row-art img'));
  var range = document.getElementById('artZoom'), outEl = document.getElementById('artZoomOut');
  var num = function (s, d) { var v = parseFloat(s); return isFinite(v) ? v : d; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var st = { x: num(ed.dataset.x, 0), y: num(ed.dataset.y, 45), z: num(ed.dataset.zoom, 1) };

  function apply() {
    st.x = clamp(st.x, -400, 400); st.y = clamp(st.y, -200, 300); st.z = clamp(st.z, 0.25, 3);
    imgs.forEach(function (i) {
      i.style.setProperty('--tx', st.x.toFixed(2));
      i.style.setProperty('--py', st.y.toFixed(2));
      i.style.setProperty('--az', st.z.toFixed(3));
      // moved by hand = the whole picture with its own soft edges, as on the Texty page
      i.toggleAttribute('data-manual', !(Math.abs(st.x) < 0.01 && Math.abs(st.y - 45) < 0.01 && Math.abs(st.z - 1) < 0.001));
    });
    range.value = Math.round(st.z * 100);
    outEl.textContent = Math.round(st.z * 100) + ' %';
    document.getElementById('artX').value = st.x.toFixed(2);
    document.getElementById('artY').value = st.y.toFixed(2);
    document.getElementById('artZoomVal').value = st.z.toFixed(2);
  }
  // the picture area of a row and the height of the whole picture at 100 % (as wide as the area)
  function sizes(row) {
    var box = row.querySelector('.song-row-art').getBoundingClientRect(), img = imgs[0];
    var nw = img.naturalWidth || 16, nh = img.naturalHeight || 9;
    return { bw: box.width, bh: box.height, h: box.width * nh / nw };
  }
  // resize around the middle of the area (the picture grows from its left edge, so shift it back)
  function zoomTo(z) {
    z = clamp(z, 0.25, 3);
    st.x = 50 - (50 - st.x) * z / st.z;
    st.z = z;
    apply();
  }

  rows.forEach(function (row) {
    var drag = null;
    row.addEventListener('pointerdown', function (e) {
      drag = { px: e.clientX, py: e.clientY, x: st.x, y: st.y, s: sizes(row) };
      row.setPointerCapture(e.pointerId);
      row.classList.add('dragging');
      e.preventDefault();
    });
    row.addEventListener('pointermove', function (e) {
      if (!drag) return;
      // the picture follows the pointer: sideways in % of the area, up / down in % of the picture
      st.x = drag.x + (e.clientX - drag.px) / drag.s.bw * 100;
      st.y = drag.y - (e.clientY - drag.py) / (drag.s.h * st.z) * 100;
      apply();
    });
    var end = function () { drag = null; row.classList.remove('dragging'); };
    row.addEventListener('pointerup', end);
    row.addEventListener('pointercancel', end);
    row.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomTo(st.z * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
    }, { passive: false });
  });
  range.addEventListener('input', function () { zoomTo(range.value / 100); });
  // the whole picture at the right end of the computer row (the row fades out to the left)
  document.getElementById('artWhole').addEventListener('click', function () {
    var s = sizes(rows[0]);
    st.z = Math.min(1, s.bh / s.h);
    st.x = (1 - st.z) * 100;
    // its top at 45 % of the area minus py of the picture; put its middle in the area's middle
    st.y = (0.45 * s.bh - (s.bh - s.h * st.z) / 2) / (s.h * st.z) * 100;
    apply();
  });
  document.getElementById('artFill').addEventListener('click', function () { st.x = 0; st.y = 45; st.z = 1; apply(); });
  apply();
})();
</script>
<%@ include file="/includes/footer.jsp" %>
