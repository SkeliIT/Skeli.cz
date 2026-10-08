-- Apple Music: every Skeli track in the public catalogue (artist 1820513581, found through the free
-- iTunes lookup, no API key) gets its song on the web and its Apple Music ID.
-- Songs are matched by name, so this works on test and www whatever their ids are; nothing is
-- overwritten (only empty apple_music_id) and nothing is duplicated (a song is created only when
-- no song of that name exists). Safe to re-run.

-- 1) Tracks that so far were only a clip without a song (or not on the web at all)
INSERT INTO `songs` (`uuid`, `name`, `year`)
SELECT UUID(), 'Jdi', 2017 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `songs` WHERE `name` LIKE '%Jdi%');
INSERT INTO `songs` (`uuid`, `name`, `year`)
SELECT UUID(), 'Úplně vzadu', 2016 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `songs` WHERE `name` LIKE '%vzadu%');
INSERT INTO `songs` (`uuid`, `name`, `year`)
SELECT UUID(), 'Marihuanaalamadama (feat. Toxe Team)', 2016 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `songs` WHERE `name` LIKE '%Marihuana%');
INSERT INTO `songs` (`uuid`, `name`, `year`)
SELECT UUID(), 'Solo', 2016 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `songs` WHERE `name` LIKE '%Solo%');
INSERT INTO `songs` (`uuid`, `name`, `year`)
SELECT UUID(), 'Trosky (feat. Babar)', 2016 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `songs` WHERE `name` LIKE '%Trosky%');
INSERT INTO `songs` (`uuid`, `name`, `year`, `preview_image_url`)
SELECT UUID(), 'Ganja', 2025, '/img/previews/ganja.webp' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `songs` WHERE `name` LIKE '%Ganja%');

-- their clips (only clips that are not linked to a song yet)
UPDATE `videos` v JOIN `songs` s ON s.`name` LIKE '%Jdi%'        SET v.`song_id` = s.`id` WHERE v.`youtube_id` = '8y60i79nVJc' AND v.`song_id` IS NULL;
UPDATE `videos` v JOIN `songs` s ON s.`name` LIKE '%vzadu%'      SET v.`song_id` = s.`id` WHERE v.`youtube_id` = '2vWZfiMnQ3Y' AND v.`song_id` IS NULL;
UPDATE `videos` v JOIN `songs` s ON s.`name` LIKE '%Marihuana%'  SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'sVOz2GRE3Cg' AND v.`song_id` IS NULL;
UPDATE `videos` v JOIN `songs` s ON s.`name` LIKE '%Solo%'       SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'AMEQfe9hWlg' AND v.`song_id` IS NULL;
UPDATE `videos` v JOIN `songs` s ON s.`name` LIKE '%Trosky%'     SET v.`song_id` = s.`id` WHERE v.`youtube_id` = '8jcSUU-Xgvs' AND v.`song_id` IS NULL;

-- 2) Apple Music IDs (IGNORE: an id already used by another song is left alone)
UPDATE IGNORE `songs` SET `apple_music_id` = '1820619793' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Tisíc kousků%'     ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1825091799' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Tik Tak%'          ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1821223044' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Chillujem%'        ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1826406113' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Musíš odejít%'     ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1821215289' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Fajn%'             ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1821215240' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Nechápu%'          ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1821206311' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Ježíšku panáčku%'  ORDER BY `id` LIMIT 1;
-- only the 2025 remake is on Apple Music; on the web it is a version of "Já už vím" (V45)
UPDATE IGNORE `songs` SET `apple_music_id` = '1857402284' WHERE `apple_music_id` IS NULL AND `name` LIKE 'Já už vím%'         ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1821215635' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Jdi%'              ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1821215710' WHERE `apple_music_id` IS NULL AND `name` LIKE '%vzadu%'            ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1822652771' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Marihuana%'        ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1821222735' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Solo%'             ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1824685866' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Trosky%'           ORDER BY `id` LIMIT 1;
UPDATE IGNORE `songs` SET `apple_music_id` = '1821055187' WHERE `apple_music_id` IS NULL AND `name` LIKE '%Ganja%'            ORDER BY `id` LIMIT 1;
