-- Moje ves: "v práci špatná vejplata", the spoken form Skeli raps (V86 had "výplata"); only the Czech text changes.
UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'v práci špatná výplata,', 'v práci špatná vejplata,')
WHERE LOWER(s.`name`) = 'moje ves' AND l.`lang` = 'cs';
