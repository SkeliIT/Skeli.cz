-- Kalba: „felíme“ podle Skeliho znamená, že jsme spolu s kámoši (fellaz). V120 to v překladech měla jako „řádíme“.
UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'we booze, we go wild, we smoke weed', 'we booze, we hang with the fellas, we smoke weed')
WHERE LOWER(s.`name`) LIKE '%kalba%' AND l.`lang` = 'en';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'wir saufen, wir drehen auf, wir rauchen Weed', 'wir saufen, wir hängen mit den Jungs ab, wir rauchen Weed')
WHERE LOWER(s.`name`) LIKE '%kalba%' AND l.`lang` = 'de';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'бухаємо, відриваємося, куримо weed', 'бухаємо, тусуємося з пацанами, куримо weed')
WHERE LOWER(s.`name`) LIKE '%kalba%' AND l.`lang` = 'uk';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'nốc rượu, quậy tới bến, hút weed', 'nốc rượu, tụ tập với anh em, hút weed')
WHERE LOWER(s.`name`) LIKE '%kalba%' AND l.`lang` = 'vi';
