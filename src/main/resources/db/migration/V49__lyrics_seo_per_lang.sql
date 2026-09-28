-- Per-language SEO slug + meta description on lyrics (one row per song+lang).
-- Public URL: /{lang}/song/{seo_slug|uuid}
-- IF NOT EXISTS: the test DB already got this as Vítězslav's V42.

-- Drop duplicate lyric rows keeping the lowest id per (song_id, lang)
DELETE l1 FROM `lyrics` l1
INNER JOIN `lyrics` l2
  ON l1.song_id = l2.song_id
 AND l1.lang = l2.lang
 AND l1.id > l2.id;

ALTER TABLE `lyrics`
  ADD COLUMN IF NOT EXISTS `seo_slug` varchar(120) NULL AFTER `lang`,
  ADD COLUMN IF NOT EXISTS `meta_description` varchar(320) NULL AFTER `seo_slug`;

ALTER TABLE `lyrics`
  ADD UNIQUE KEY IF NOT EXISTS `uq_lyrics_lang_seo_slug` (`lang`, `seo_slug`);

ALTER TABLE `lyrics`
  ADD UNIQUE KEY IF NOT EXISTS `uq_lyrics_song_lang` (`song_id`, `lang`);

-- Copy legacy song-level seo_slug (V48) onto Czech lyrics when present
UPDATE `lyrics` l
JOIN `songs` s ON s.id = l.song_id
SET l.seo_slug = s.seo_slug
WHERE l.lang = 'cs'
  AND s.seo_slug IS NOT NULL
  AND s.seo_slug <> ''
  AND (l.seo_slug IS NULL OR l.seo_slug = '');
