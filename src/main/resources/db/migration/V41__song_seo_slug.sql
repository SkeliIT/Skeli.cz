-- SEO-friendly public alias for songs (Google indexing /sitemap).
-- Public URLs: /song/{seo_slug} when set, otherwise /song/{uuid}.

ALTER TABLE `songs`
  ADD COLUMN `seo_slug` varchar(120) NULL AFTER `uuid`,
  ADD UNIQUE KEY `uq_songs_seo_slug` (`seo_slug`);
