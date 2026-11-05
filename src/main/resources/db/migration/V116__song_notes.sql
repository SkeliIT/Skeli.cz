-- Poznámka u písně („Videoklip už brzy na YouTube“), nastříkaná zlatým sprejem pod fotkou nebo videem.
-- Jedna na píseň, píše se v adminu (Hudba → Poznámky). Text v jazycích webu: prázdný překlad = ukáže se česky.
CREATE TABLE `song_notes` (
  `song_id` INT(10) UNSIGNED NOT NULL,
  `text_cs` VARCHAR(80) NOT NULL,
  `text_en` VARCHAR(80) NOT NULL DEFAULT '',
  `text_de` VARCHAR(80) NOT NULL DEFAULT '',
  `text_uk` VARCHAR(80) NOT NULL DEFAULT '',
  `text_vi` VARCHAR(80) NOT NULL DEFAULT '',
  `show_song` TINYINT(1) NOT NULL DEFAULT 1,
  `show_lyrics` TINYINT(1) NOT NULL DEFAULT 1,
  `show_music` TINYINT(1) NOT NULL DEFAULT 1,
  `until_date` DATE NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`song_id`),
  CONSTRAINT `fk_song_notes_song` FOREIGN KEY (`song_id`) REFERENCES `songs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- První poznámka: Musíš odejít zatím nemá video. V adminu jde přepsat nebo smazat.
INSERT INTO `song_notes` (`song_id`, `text_cs`, `text_en`, `text_de`, `text_uk`, `text_vi`)
SELECT s.`id`, 'Videoklip už brzy na YouTube', 'Music video coming soon on YouTube', 'Musikvideo bald auf YouTube',
       'Відеокліп незабаром на YouTube', 'Video âm nhạc sắp có trên YouTube'
FROM `songs` s
WHERE s.`name` = 'Musíš odejít'
LIMIT 1;
