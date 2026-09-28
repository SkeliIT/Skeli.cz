-- When a lyric comment was last edited (by its author or an admin);
-- NULL means never edited. video_comments already has this column.
ALTER TABLE `comments`
  ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL AFTER `created_at`;
