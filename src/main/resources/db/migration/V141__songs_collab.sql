-- Rozdělení hudby na moje skladby a spolupráce (2026-11-16).
-- collab = 1: cizí track, kde Skeli hostuje (Zoom, Refew, Farri, Babaraptor, JML). Takové písně
-- web řadí až za Skeliho vlastní (úvod, Hudba, Texty, Karaoke). V adminu jde přepnout u každé písně.
ALTER TABLE songs ADD COLUMN IF NOT EXISTS collab TINYINT(1) NOT NULL DEFAULT 0;

-- Výchozí stav podle názvu: „Interpret - Název“, kde interpret není Skeli (ani „Skeli a Babar“).
UPDATE songs
   SET collab = 1
 WHERE name LIKE '% - %'
   AND TRIM(SUBSTRING_INDEX(name, ' - ', 1)) NOT LIKE 'Skeli%';
