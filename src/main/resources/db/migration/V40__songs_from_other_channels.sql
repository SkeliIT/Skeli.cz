-- Skeli's songs and features published on other YouTube channels, so they show
-- up in the discography and the clip player. Safe to re-run: existing rows are
-- kept (songs) or updated (videos).
START TRANSACTION;

INSERT IGNORE INTO `songs` (`uuid`, `name`, `year`) VALUES
  (UUID(), 'Skeli - Ježíšku panáčku', 2016),
  (UUID(), 'JML - No ty vole ft. Farri, Skeli, Babaraptor', 2013),
  (UUID(), 'Skeli a Babar - Divná planeta', 2013),
  (UUID(), 'Refew - Musíme žít ft. Fosco Alma, Skeli', 2018),
  (UUID(), 'Zoom - Drama ft. 3dem7, Skeli, D4niel (prod. LEXNOUR)', 2026);

INSERT INTO `videos` (`youtube_id`, `title`, `published_at`, `song_id`)
SELECT v.youtube_id, v.title, v.published_at, s.id
FROM (
  SELECT 'p2wlP48T04U' AS youtube_id, 'Skeli - Ježíšku panáčku' AS title, '2016-12-24 12:00:00' AS published_at, 'Skeli - Ježíšku panáčku' AS song, 2016 AS yr
  UNION ALL SELECT 'fU_5puhBc-o', 'JML - No ty vole ft. Farri, Skeli, Babaraptor', '2013-06-18 12:00:00', 'JML - No ty vole ft. Farri, Skeli, Babaraptor', 2013
  UNION ALL SELECT 'HSVuJ2GKfDg', 'Skeli a Babar - Divná planeta', '2013-02-12 12:00:00', 'Skeli a Babar - Divná planeta', 2013
  UNION ALL SELECT 'FtFA5A7Xdlo', 'Refew - Musíme žít ft. Fosco Alma, Skeli', '2018-02-11 12:00:00', 'Refew - Musíme žít ft. Fosco Alma, Skeli', 2018
  UNION ALL SELECT 'HCDDuRsWdRw', 'Zoom - Drama ft. 3dem7, Skeli, D4niel (prod. LEXNOUR)', '2026-09-13 12:00:00', 'Zoom - Drama ft. 3dem7, Skeli, D4niel (prod. LEXNOUR)', 2026
) v
JOIN `songs` s ON s.name = v.song AND s.year = v.yr
ON DUPLICATE KEY UPDATE
  `song_id` = VALUES(`song_id`),
  `title` = VALUES(`title`),
  `published_at` = VALUES(`published_at`);

COMMIT;
