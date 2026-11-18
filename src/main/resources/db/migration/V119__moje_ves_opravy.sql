-- Moje ves: oprava podle textu od Skeliho. „ňácí zmrdi“ znamená „nějací“, V86 z toho omylem udělala „nácí“
-- a překlady pak mluvily o nacistech. Vrací se i jeho „nový fotbalový hřiště, který“ a „budu hodit“.
UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(REPLACE(l.`words`,
      'si nácí zmrdi z týhle vesnice', 'si ňácí zmrdi z týhle vesnice'),
      'nové fotbalové hřiště, které nás', 'nový fotbalový hřiště, který nás'),
      'že si to spíš půjdu hodit', 'že si to spíš budu hodit')
WHERE LOWER(s.`name`) = 'moje ves' AND l.`lang` = 'cs';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'the Nazi scumbags from this village', 'some scumbags from this village')
WHERE LOWER(s.`name`) = 'moje ves' AND l.`lang` = 'en';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'die Nazi-Arschlöcher aus diesem Dorf', 'irgendwelche Arschlöcher aus diesem Dorf')
WHERE LOWER(s.`name`) = 'moje ves' AND l.`lang` = 'de';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'нацистські покидьки з цього села', 'якісь покидьки з цього села')
WHERE LOWER(s.`name`) = 'moje ves' AND l.`lang` = 'uk';

UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(l.`words`, 'lũ phát xít khốn nạn của làng này', 'mấy thằng khốn nạn của làng này')
WHERE LOWER(s.`name`) = 'moje ves' AND l.`lang` = 'vi';
