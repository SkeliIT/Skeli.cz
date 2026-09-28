-- The old "guess the video by title" fallback on lyric pages linked the JML clip
-- to "Machine gun Skeli RMX" and unlinked the Refew clip. Put both back, add the
-- Chillujem clip (13 Jan 2024) and give "Musíš odejít" (no clip yet) the dark
-- background photo as its preview image.
START TRANSACTION;

INSERT INTO `videos` (`youtube_id`, `title`, `published_at`) VALUES
  ('GzIAVWw2ILk', 'Skeli - Chillujem', '2024-01-13 09:26:58')
ON DUPLICATE KEY UPDATE `title` = COALESCE(`title`, VALUES(`title`));

UPDATE `videos` v JOIN `songs` s ON s.`name` = 'Chillujem'
SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'GzIAVWw2ILk';

UPDATE `videos` v JOIN `songs` s ON s.`name` = 'JML - No ty vole ft. Farri, Skeli, Babaraptor'
SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'fU_5puhBc-o';

UPDATE `videos` v JOIN `songs` s ON s.`name` = 'Refew - Musíme žít ft. Fosco Alma, Skeli'
SET v.`song_id` = s.`id` WHERE v.`youtube_id` = 'FtFA5A7Xdlo';

UPDATE `songs` SET `preview_image_url` = '/img/IMG_0090.webp'
WHERE `name` = 'Musíš odejít' AND (`preview_image_url` IS NULL OR `preview_image_url` = '');

COMMIT;
