-- Denní otisky návštěv (visit_days) se budou po uzavření dne mazat; místo nich zůstane jen počet lidí za den.
-- Tahle migrace nic nemaže: přidá sloupce a jednorázově dopočítá počty ze všech dosavadních otisků.
-- visitors_closed = 0: počet je jen dopočítaný a otisky dne ještě existují (při úklidu se počet nahradí přesným);
-- visitors_closed = 1: den je uzavřený a otisky smazané, pozdní otisky se k počtu přičtou (VisitStats.rollUp).
ALTER TABLE site_stats_daily ADD COLUMN IF NOT EXISTS visitors INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visitors_closed TINYINT(1) NOT NULL DEFAULT 0;
INSERT INTO site_stats_daily (day, visitors)
  SELECT day, COUNT(*) FROM visit_days GROUP BY day
  ON DUPLICATE KEY UPDATE visitors = VALUES(visitors);
