-- The admin's "Co čeká" list: a tick says "this is fine as it is" (a featured clip that never gets its own song,
-- a song that stays without lyrics) and the item stops showing. Deleting the row or giving it a song/lyrics
-- clears it anyway.
ALTER TABLE `videos` ADD COLUMN `no_song_ok_at` DATETIME NULL;
ALTER TABLE `songs` ADD COLUMN `no_lyrics_ok_at` DATETIME NULL;
