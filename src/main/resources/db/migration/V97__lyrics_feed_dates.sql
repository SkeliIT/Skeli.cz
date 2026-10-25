-- Kdy byla jazyková verze textu přidána / naposledy změněna, pro RSS/Atom feedy (/{lang}/feed/*):
-- nový překlad staré písně je novinkou ve feedu daného jazyka.
-- Nové řádky dostanou NOW() samy, INSERTy v adminu a synchronizaci se nemění.

ALTER TABLE `lyrics`
  ADD COLUMN `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  ADD KEY `idx_lyrics_lang_created` (`lang`, `created_at`);

-- Stávající texty by jinak všechny vypadaly jako nové: dostanou datum své písně (premiéra, jinak první klip,
-- jinak 1. leden jejího roku); píseň bez jakéhokoli data nechá text bez data (NULL, ve feedu na konci).
UPDATE `lyrics` l
JOIN `songs` s ON s.id = l.song_id
LEFT JOIN (
  SELECT song_id, MIN(published_at) AS first_at FROM `videos`
  WHERE song_id IS NOT NULL AND published_at IS NOT NULL GROUP BY song_id
) v ON v.song_id = s.id
SET l.created_at = COALESCE(IF(s.release_at IS NULL, NULL, FROM_UNIXTIME(s.release_at DIV 1000)),
                            v.first_at, IF(s.year IS NULL, NULL, MAKEDATE(s.year, 1))),
    l.updated_at = NULL;
