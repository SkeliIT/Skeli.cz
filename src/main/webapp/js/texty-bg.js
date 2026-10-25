// Pozadí stránky Texty: video z Blenderu místo fotek. Tmavý režim = kamera pomalu klouže nad kamenem
// s vypáleným textem, ze kterého stoupá zlatá plazma (zlatý duotón je zapečený do videa). Světlý režim =
// zamlžené okno s textem „Já už vím“: 4 záběry (jeden těsně u skla), stékající kapky, zlatý prach ve slunci
// a hejno ptáků. Obě videa jsou smyčky 48 s. Na šířku video 16:9, na výšku výřez 9:16.
// Kdo má omezený pohyb nebo šetří data, dostane jen snímek. Přepnutí tématu vymění video za druhé.
(function () {
  if (window.__textyBg) return;
  window.__textyBg = true;
  const ver = (document.currentScript && new URL(document.currentScript.src).searchParams.get("v")) || "1";
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches
    || (navigator.connection && navigator.connection.saveData);
  const tall = matchMedia("(orientation: portrait)");
  const light = () => document.body.classList.contains("light");
  const side = () => (tall.matches ? "tall" : "wide");
  const file = (kind) => "/img/texty/" + (light() ? "okno-" : (kind === "poster" ? "" : "texty-"))
    + (kind === "poster" ? "poster-" : "") + side() + (kind === "poster" ? ".webp" : ".mp4") + "?v=" + ver;

  const css = document.createElement("style");
  css.textContent = `
    /* fotky webu schovává už css/effects.css (body:has(main.texty-page)), tady jen vlastní vrstva – je tam
       hned, bez prolínání: nejdřív snímek z videa (poster), video se k němu připojí, až hraje */
    .texty-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; background: #050403; }
    body.light .texty-bg { background: #e9ecef; }
    .texty-bg video, .texty-bg img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    /* závoj nahoře a dole, ať se dá číst hlavička i seznam */
    .texty-bg .shade { position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(5,4,3,.6) 0%, rgba(5,4,3,.2) 30%, rgba(5,4,3,.3) 65%, rgba(5,4,3,.8) 100%); }
    body.light .texty-bg .shade {
      background: linear-gradient(180deg, rgba(244,245,247,.62) 0%, rgba(244,245,247,.22) 32%, rgba(244,245,247,.15) 65%, rgba(244,245,247,.6) 100%); }
  `;
  document.head.appendChild(css);

  const layer = document.createElement("div");
  layer.className = "texty-bg";
  layer.setAttribute("aria-hidden", "true");
  let media;
  if (still) {
    media = document.createElement("img");
    media.alt = "";
    media.src = file("poster");
  } else {
    media = document.createElement("video");
    media.muted = true; media.loop = true; media.playsInline = true; media.autoplay = true;
    media.setAttribute("muted", ""); media.setAttribute("playsinline", "");   // iPhone hraje sám jen s atributy
    media.preload = "auto";
    media.poster = file("poster");
    media.src = file("video");
  }
  layer.appendChild(media);
  layer.insertAdjacentHTML("beforeend", '<div class="shade"></div>');
  document.body.appendChild(layer);
  // při návratu na Texty video pokračuje tam, kde skončilo (ne zase od začátku)
  if (!still) {
    let at = 0;
    try { at = +sessionStorage.getItem("textyBgAt") || 0; } catch (e) { /* bez úložiště od začátku */ }
    if (at) media.addEventListener("loadedmetadata", () => { media.currentTime = at % (media.duration || 48); }, { once: true });
  }

  // otočení telefonu nebo přepnutí tématu: jiné video (obě smyčky mají 48 s, pokračuje od stejného místa)
  let shown = file(still ? "poster" : "video");
  const swap = () => {
    const next = file(still ? "poster" : "video");
    if (next === shown) return;
    shown = next;
    if (still) { media.src = next; return; }
    const t = media.currentTime;
    media.poster = file("poster");
    media.src = next;
    media.currentTime = t;
    sync();
  };
  const sync = () => { if (still) return; if (document.hidden) media.pause(); else media.play().catch(() => {}); };
  tall.addEventListener("change", swap);
  document.addEventListener("visibilitychange", sync);
  const themeWatch = new MutationObserver(swap);
  themeWatch.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  sync();
  layer.cleanup = () => {
    tall.removeEventListener("change", swap); document.removeEventListener("visibilitychange", sync); themeWatch.disconnect();
    if (!still) {
      try { sessionStorage.setItem("textyBgAt", String(media.currentTime || 0)); } catch (e) { /* nevadí */ }
      media.pause(); media.removeAttribute("src"); media.load();
    }
  };

  // při odchodu ze stránky Texty (PJAX) uklidit hned, jak zmizí obsah Textů – fotky webu se vrátí samy (CSS)
  const gone = new MutationObserver(() => {
    if (document.querySelector("main.texty-page")) return;
    gone.disconnect();
    layer.cleanup();
    layer.remove(); css.remove(); window.__textyBg = false;
  });
  gone.observe(document.body, { childList: true, subtree: true });
})();
