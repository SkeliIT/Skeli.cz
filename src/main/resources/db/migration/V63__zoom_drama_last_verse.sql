-- Zoom – Drama: the last verse as Zoom wrote it (V60 had a guess from the transcript,
-- "demony, hastiny, je fu na vlně"). Only these lines change, in every language.

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(l.`words`,
      'demony, hastiny, je fu na vlně, dělaj záda,',
      'a stíny jí furt na vlně dělaj záda,'),
      'a sebeúcta zmizela, už není tak hodná.',
      'sebeúcta zmizela, už není tak hodná.')
WHERE s.`name` LIKE 'Zoom - Drama%' AND l.`lang` = 'cs';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(l.`words`,
      'demons, hastiness, she''s riding the wave, they turn their backs,',
      'and the shadows still have her back on the wave,'),
      'and her self-respect is gone, she isn''t that sweet anymore.',
      'her self-respect is gone, she isn''t that sweet anymore.')
WHERE s.`name` LIKE 'Zoom - Drama%' AND l.`lang` = 'en';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(l.`words`,
      'Dämonen, Hast, sie reitet auf der Welle, sie drehen den Rücken zu,',
      'und die Schatten halten ihr auf der Welle immer noch den Rücken frei,'),
      'und die Selbstachtung ist weg, sie ist nicht mehr so lieb.',
      'die Selbstachtung ist weg, sie ist nicht mehr so lieb.')
WHERE s.`name` LIKE 'Zoom - Drama%' AND l.`lang` = 'de';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(l.`words`,
      'демони, поспіх, вона на хвилі, повертаються спиною,',
      'і тіні досі прикривають їй спину на хвилі,'),
      'і самоповага зникла, вона вже не така мила.',
      'самоповага зникла, вона вже не така мила.')
WHERE s.`name` LIKE 'Zoom - Drama%' AND l.`lang` = 'uk';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(l.`words`,
      'quỷ dữ, vội vàng, nó đang lướt trên sóng, người ta quay lưng,',
      'và những cái bóng vẫn luôn chống lưng cho nó trên con sóng,'),
      'và lòng tự trọng đã biến mất, nó chẳng còn ngoan như trước.',
      'lòng tự trọng đã biến mất, nó chẳng còn ngoan như trước.')
WHERE s.`name` LIKE 'Zoom - Drama%' AND l.`lang` = 'vi';
