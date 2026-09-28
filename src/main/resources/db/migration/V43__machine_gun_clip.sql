-- Clip of "Machine gun Skeli RMX" on Skeli's channel (6 Jul 2019).
START TRANSACTION;

INSERT INTO `videos` (`youtube_id`, `title`, `published_at`) VALUES
  ('aYK45A3oxFY', 'Machine gun SKELI RMX', '2019-07-06 09:50:35')
ON DUPLICATE KEY UPDATE `title` = COALESCE(`title`, VALUES(`title`));

UPDATE `videos` v JOIN `songs` s ON s.`name` = 'Machine gun Skeli RMX'
SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'aYK45A3oxFY';

COMMIT;
