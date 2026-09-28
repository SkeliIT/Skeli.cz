-- "Já už vím (Remake 2025)" was a second song on www with the same lyrics as "Já už vím" (one
-- line differed by a word) and no clip; the remake clip already belongs to "Já už vím" (V45),
-- which shows both versions. So the duplicate goes - only where the original exists.
-- Videos would move to the original first; comments, votes and views of the duplicate's lyrics
-- are removed with them by the foreign keys (there were none on www).

UPDATE `videos` v
JOIN `songs` dup ON dup.id = v.song_id AND dup.name = 'Já už vím (Remake 2025)'
JOIN `songs` orig ON orig.name = 'Já už vím'
SET v.song_id = orig.id;

DELETE l FROM `lyrics` l
JOIN `songs` dup ON dup.id = l.song_id AND dup.name = 'Já už vím (Remake 2025)'
WHERE EXISTS (SELECT 1 FROM `songs` o WHERE o.name = 'Já už vím');

DELETE FROM `songs`
WHERE `name` = 'Já už vím (Remake 2025)'
  AND EXISTS (SELECT 1 FROM (SELECT id FROM `songs` WHERE `name` = 'Já už vím') o);
