START TRANSACTION;

ALTER TABLE `songs`
  ADD COLUMN `apple_music_id` VARCHAR(20) DEFAULT NULL,
  ADD UNIQUE KEY `uq_songs_apple_music_id` (`apple_music_id`);

ALTER TABLE `lyrics`
  ADD COLUMN `timed_lyrics` LONGTEXT DEFAULT NULL;

COMMIT;
