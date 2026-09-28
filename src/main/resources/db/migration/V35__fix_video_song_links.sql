-- V9 linked the two videos to the wrong songs (the Tisíc kousků clip to
-- Chillujem, the Tik Tak clip to Tisíc kousků), and the Fajn and Nechápu clips
-- were never linked. Link each clip to its song. Songs are matched by name with
-- or without the old "Skeli - " prefix; if a song is missing, nothing changes.
START TRANSACTION;

UPDATE `videos` v
JOIN `songs` s ON s.`name` IN ('Tisíc kousků', 'Skeli - Tisíc kousků')
SET v.`song_id` = s.`id`
WHERE v.`youtube_id` = 'YQt6qBZ2f4g';

UPDATE `videos` v
JOIN `songs` s ON s.`name` LIKE 'Tik Tak%' OR s.`name` LIKE 'Skeli - Tik Tak%'
SET v.`song_id` = s.`id`
WHERE v.`youtube_id` = 'pZx0xa6MpbE';

UPDATE `videos` v
JOIN `songs` s ON s.`name` IN ('Fajn', 'Skeli - Fajn')
SET v.`song_id` = s.`id`
WHERE v.`youtube_id` = 'DUyWTpG57NY';

UPDATE `videos` v
JOIN `songs` s ON s.`name` IN ('Nechápu', 'Skeli - Nechápu')
SET v.`song_id` = s.`id`
WHERE v.`youtube_id` = 'euIYhNMeq8A';

COMMIT;
