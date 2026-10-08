-- The song title in each lyric's language ("Já už vím" → "I already know"), shown under the original
-- title on the English / German / Ukrainian / Vietnamese pages. Empty for Czech.
ALTER TABLE `lyrics` ADD COLUMN IF NOT EXISTS `title` varchar(200) NULL AFTER `lang`;
