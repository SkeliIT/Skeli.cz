-- Where the picture sits in the song's row on the Texty page, set by hand in admin
-- (/admin/song): art_x = how far it is moved sideways, in % of the row's picture area (−400…400),
-- art_y = the point of the picture (% of its height) on the row's 45 % line, so a computer and a
-- phone show the same part; art_zoom = size compared with "as wide as the area" (0.25–3).
-- NULL = automatic.
ALTER TABLE `songs`
  ADD COLUMN IF NOT EXISTS `art_x` DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS `art_y` DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS `art_zoom` DECIMAL(4,2) NULL;
