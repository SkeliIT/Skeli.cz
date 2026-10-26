-- Spotify ID posledních 4 singlů (ze stránky umělce na Spotify, každé ověřené podle názvu přes oEmbed).
-- Doplní se jen písni, která ID ještě nemá; IGNORE přeskočí ID, které už má jiná píseň.
UPDATE IGNORE `songs` SET `spotify_id` = '7G2HszPJNlH5G1lZ6CZwZE' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` = 'Chillujem'                ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '0UpH4lVs3e296QwTJbuC1G' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` = 'Jdi'                      ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '6HYvvZiNbqu48yrdNjbA6F' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` LIKE '%Ježíšku panáčku%'  ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '47hznVNjpQcsi3hB3vBxYk' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` LIKE 'Marihuanaalamadama%' ORDER BY `id` LIMIT 1;
