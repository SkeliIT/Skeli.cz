-- Visit statistics without cookies (VisitStats): a visitor is an anonymous hash that changes every day
-- (the day's random key is thrown away at midnight), so visits can be counted but never linked to a person
-- or across days.

-- who came on which day (one row per visitor and day)
CREATE TABLE IF NOT EXISTS `visit_days` (
  `day` DATE NOT NULL,
  `visitor` CHAR(32) NOT NULL,
  PRIMARY KEY (`day`, `visitor`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

-- pages shown per day
CREATE TABLE IF NOT EXISTS `site_stats_daily` (
  `day` DATE NOT NULL,
  `pageviews` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`day`)
) ENGINE=InnoDB;

-- a lyric counts once per visitor and day (lyric_views keeps the total); rows older than 2 days are removed
CREATE TABLE IF NOT EXISTS `lyric_view_days` (
  `day` DATE NOT NULL,
  `lyric_id` INT UNSIGNED NOT NULL,
  `visitor` CHAR(32) NOT NULL,
  PRIMARY KEY (`day`, `lyric_id`, `visitor`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

-- since when the numbers are counted (the admin can start again from zero)
INSERT IGNORE INTO `app_settings` (`k`, `v`) VALUES ('stats_since', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i'));
