-- Statistiky pro marketing (admin → Statistiky → Odkud lidi chodí). Jen počty za den, nic se nespojuje s člověkem:
-- žádné cookies, žádná IP, žádný otisk prohlížeče.

-- Začátek návštěvy: odkud člověk přišel (jen název webu, např. instagram), štítek kampaně z odkazu (?z=ig-bio),
-- zařízení (mobil / tablet / pc), jazyk webu a hodina (pražský čas).
CREATE TABLE IF NOT EXISTS `visit_origins` (
  `day` DATE NOT NULL,
  `hour` TINYINT NOT NULL,
  `source` VARCHAR(60) NOT NULL,
  `campaign` VARCHAR(32) NOT NULL DEFAULT '',
  `device` VARCHAR(8) NOT NULL,
  `lang` VARCHAR(4) NOT NULL,
  `visits` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`day`, `hour`, `source`, `campaign`, `device`, `lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kliknutí z webu ven: Spotify, Apple Music, YouTube, Instagram… a na jakém druhu stránky (píseň, hudba, úvod…).
CREATE TABLE IF NOT EXISTS `outbound_clicks` (
  `day` DATE NOT NULL,
  `target` VARCHAR(16) NOT NULL,
  `page_kind` VARCHAR(12) NOT NULL,
  `clicks` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`day`, `target`, `page_kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Co lidi hledají v Textech (malými písmeny, bez vazby na člověka) a jestli se něco našlo; maže se po 90 dnech.
CREATE TABLE IF NOT EXISTS `search_terms` (
  `day` DATE NOT NULL,
  `term` VARCHAR(40) NOT NULL,
  `found` TINYINT(1) NOT NULL,
  `n` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`day`, `term`, `found`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
