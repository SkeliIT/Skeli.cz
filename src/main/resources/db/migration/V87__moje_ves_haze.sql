-- Moje ves: "klacky pod nohy háže", as Skeli wrote it (V86 had "hází"); only the Czech text changes.
UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'jeden druhýmu klacky pod nohy hází,', 'jeden druhýmu klacky pod nohy háže,')
WHERE LOWER(s.`name`) = 'moje ves' AND l.`lang` = 'cs';
