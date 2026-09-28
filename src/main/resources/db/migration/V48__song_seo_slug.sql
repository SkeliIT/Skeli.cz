-- SEO-friendly public alias for songs (Google indexing /sitemap).
-- Public URLs: /song/{seo_slug} when set, otherwise /song/{uuid}.
-- IF NOT EXISTS: the test DB already got this as Vítězslav's V41.

ALTER TABLE `songs`
  ADD COLUMN IF NOT EXISTS `seo_slug` varchar(120) NULL AFTER `uuid`,
  ADD UNIQUE KEY IF NOT EXISTS `uq_songs_seo_slug` (`seo_slug`);
