-- Spotify track IDs of Skeli's singles (from his Spotify artist page, every ID checked against
-- Spotify's oEmbed title). Only a song without one gets it; IGNORE skips an ID another song has.
-- Not found yet: Chillujem, Jdi, Ježíšku panáčku, Marihuanaalamadama (paste the link in admin).
UPDATE IGNORE `songs` SET `spotify_id` = '0UrzcoQ2G85th0BiF7MXe1' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` LIKE 'Trosky%'          ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '2iUKv2j22iOxLYvUA30xMo' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` LIKE 'Tisíc kousků%'   ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '7uE1clujqoq2QEImURD5Oe' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` = 'Ganja'             ORDER BY `id` LIMIT 1;
-- Spotify has only the 2025 remake; on the web it is the same song as the original
UPDATE IGNORE `songs` SET `spotify_id` = '1B2MPn96Z0LHTgQ5DX7fRl' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` = 'Já už vím'         ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '35sN3ItPcpn9H9ZmllXUCi' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` LIKE '%Úplně vzadu%'   ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '4LTvLgMxPlO0lJTOcbb8fL' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` LIKE 'Tik Tak%'        ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '01wNVzySGEMcHVzaY6EFAA' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` LIKE 'Musíš odejít%'   ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '47NAznP9NubBWLGEzS1eRI' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` = 'Solo'              ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '0aBqyAsoMgOmLplwERsvT9' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` = 'Fajn'              ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `spotify_id` = '5UsiHIF4pIwZgBt8F5Ahhy' WHERE (`spotify_id` IS NULL OR `spotify_id` = '') AND `name` = 'Nechápu'           ORDER BY `id` LIMIT 1;
