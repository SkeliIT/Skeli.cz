-- Ganja is from 2015 (Apple Music has it as a 2025 release, V54 took that year). Its clip
-- "Skeli - Ganja" (riRijruWINY, age-restricted on YouTube; on www it came in through the YouTube
-- sync) belongs to the song, so the discography shows one Ganja card, not a song and a lone clip.
UPDATE `songs` SET `year` = 2015 WHERE `name` = 'Ganja' AND `year` = 2025;

INSERT IGNORE INTO `videos` (`youtube_id`, `title`, `song_id`)
SELECT 'riRijruWINY', 'Skeli - Ganja', s.`id` FROM `songs` s WHERE s.`name` = 'Ganja' ORDER BY s.`id` LIMIT 1;

UPDATE `videos` v JOIN `songs` s ON s.`name` = 'Ganja'
SET v.`song_id` = s.`id`
WHERE v.`youtube_id` = 'riRijruWINY' AND v.`song_id` IS NULL;
