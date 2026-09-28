-- Release dates of the clips from Skeli's channel (YouTube upload dates, UTC).
-- Without them the home page "news" sorted old dated features above new clips.
-- Also adds two 2013 collaborations with Babar from the Raptor Rumosaur channel.
START TRANSACTION;

UPDATE `videos` SET `published_at` = '2025-05-25 18:00:06' WHERE `youtube_id` = 'YQt6qBZ2f4g' AND `published_at` IS NULL;
UPDATE `videos` SET `published_at` = '2025-07-25 16:58:06' WHERE `youtube_id` = 'pZx0xa6MpbE' AND `published_at` IS NULL;
UPDATE `videos` SET `published_at` = '2019-08-02 20:49:00' WHERE `youtube_id` = 'DUyWTpG57NY' AND `published_at` IS NULL;
UPDATE `videos` SET `published_at` = '2017-12-24 19:39:50' WHERE `youtube_id` = 'euIYhNMeq8A' AND `published_at` IS NULL;
UPDATE `videos` SET `published_at` = '2017-10-10 21:54:04' WHERE `youtube_id` = '8y60i79nVJc' AND `published_at` IS NULL;
UPDATE `videos` SET `published_at` = '2016-11-20 09:38:42' WHERE `youtube_id` = '2vWZfiMnQ3Y' AND `published_at` IS NULL;
UPDATE `videos` SET `published_at` = '2016-10-30 22:12:06' WHERE `youtube_id` = 'sVOz2GRE3Cg' AND `published_at` IS NULL;
UPDATE `videos` SET `published_at` = '2016-10-09 20:33:23' WHERE `youtube_id` = 'AMEQfe9hWlg' AND `published_at` IS NULL;
UPDATE `videos` SET `published_at` = '2016-05-22 17:31:08' WHERE `youtube_id` = '8jcSUU-Xgvs' AND `published_at` IS NULL;

INSERT IGNORE INTO `songs` (`uuid`, `name`, `year`) VALUES
  (UUID(), 'Skeli a Babar - No ty vole', 2013),
  (UUID(), 'Babaraptor - Obyčejnej člověk ft. Skeli', 2013);

INSERT INTO `videos` (`youtube_id`, `title`, `published_at`) VALUES
  ('vcmA7sB4RDo', 'Skeli a Babar - No ty vole', '2013-04-14 16:03:41'),
  ('m_9c6BYME7g', 'Babaraptor - Obyčejnej člověk ft. Skeli', '2013-08-20 23:27:19')
ON DUPLICATE KEY UPDATE `published_at` = COALESCE(`published_at`, VALUES(`published_at`));

UPDATE `videos` v JOIN `songs` s ON s.`name` = 'Skeli a Babar - No ty vole' AND s.`year` = 2013
SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'vcmA7sB4RDo';
UPDATE `videos` v JOIN `songs` s ON s.`name` = 'Babaraptor - Obyčejnej člověk ft. Skeli' AND s.`year` = 2013
SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'm_9c6BYME7g';

COMMIT;
