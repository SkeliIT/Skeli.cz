-- Karaoke: when each line of the lyrics is sung in a clip (js/karaoke.js burns it in with the laser).
-- The automatic timings are files in the app (karaoke/<youtube id>.json, made by tools/karaoke-align.py);
-- a row here is a correction made by hand in the admin and wins over the file.
-- times: JSON [[start, end], ...] in seconds, one pair per non-empty line of the Czech lyrics.
CREATE TABLE IF NOT EXISTS `karaoke_timings` (
  `youtube_id` VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `line_count` INT NOT NULL,
  `times` MEDIUMTEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`youtube_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
