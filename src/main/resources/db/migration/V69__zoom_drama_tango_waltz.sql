-- Zoom – Drama: Zoom confirmed the dances, "tango a waltz" (the transcript guessed "vals").
-- English, German and Ukrainian already say waltz; only Czech and Vietnamese change.

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'já budu tančit tango a vals.', 'já budu tančit tango a waltz.')
WHERE s.`name` LIKE 'Zoom - Drama%' AND l.`lang` = 'cs';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'tao sẽ nhảy tango và valse.', 'tao sẽ nhảy tango và waltz.')
WHERE s.`name` LIKE 'Zoom - Drama%' AND l.`lang` = 'vi';
