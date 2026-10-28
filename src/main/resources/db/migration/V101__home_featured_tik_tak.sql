-- Úvod: jako „Nový song“ nahoře zatím Tik Tak (dokud nevyjde nový klip – pak se ukáže sám ten nejnovější).
-- Klip se hledá podle názvu písně; když se nenajde, nic se nenastaví a úvod ukazuje nejnovější klip jako dřív.
INSERT INTO app_settings (k, v)
SELECT 'home_featured_youtube', v.youtube_id
FROM videos v JOIN songs s ON s.id = v.song_id
WHERE s.name LIKE 'Tik Tak%'
ORDER BY v.published_at DESC, v.id DESC
LIMIT 1
ON DUPLICATE KEY UPDATE v = VALUES(v), updated_at = CURRENT_TIMESTAMP;
