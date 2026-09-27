-- "Já už vím (2025 remake)" with the better sound, published 12 Dec 2025.
-- Linked to the same song as the 2016 clip; pages show the newest clip of a song.
START TRANSACTION;

INSERT INTO `videos` (`youtube_id`, `title`, `published_at`) VALUES
  ('LJ7ER355Hgg', 'Skeli - Já už vím (2025 remake) Official video', '2025-12-12 16:56:59')
ON DUPLICATE KEY UPDATE `published_at` = COALESCE(`published_at`, VALUES(`published_at`));

UPDATE `videos` v JOIN `songs` s ON s.`name` = 'Já už vím' AND s.`year` = 2016
SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'LJ7ER355Hgg';

COMMIT;
