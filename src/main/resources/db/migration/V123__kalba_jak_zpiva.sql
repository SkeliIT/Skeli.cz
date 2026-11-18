-- Kalba: Skeli si poslechl nahrávku a potvrdil „při příchodu“ a „ze včerejška v okno“. Překlady se nemění.
UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(l.`words`,
      'u příchodu hnedka panák', 'při příchodu hnedka panák'),
      'ze včerejška okno, no ty krávo', 'ze včerejška v okno, no ty krávo')
WHERE LOWER(s.`name`) LIKE '%kalba%' AND l.`lang` = 'cs';
