-- Obrázek písně v Diskografii (music.jsp), vybírá se v adminu u písně (karta „Obrázek v Diskografii“):
-- NULL = automaticky (ostrý obrázek z klipu img/disco/<klip>.webp, jinak náhled z YouTube),
-- jinak adresa vybraného snímku z YouTube (/yt-thumb/<id>/maxres2.jpg …) nebo nahraného obrázku
-- (/uploads/song-previews/disco-<id>.jpg). Posun a zvětšení dál v poster_x / poster_y / poster_zoom
-- (dřív „Plakát v Karaoke“ – stránka Karaoke už plakáty nemá).
ALTER TABLE songs ADD COLUMN disco_image VARCHAR(300) NULL AFTER poster_zoom;
