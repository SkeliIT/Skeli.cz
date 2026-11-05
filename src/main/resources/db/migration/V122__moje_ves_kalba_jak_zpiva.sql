-- Karaoke barví slovo po slově, text proto musí být přesně to, co na nahrávce zní (ověřeno přepisem zpěvu).
-- Moje ves: na nahrávce je „nové fotbalové hřiště, které“ a „půjdu hodit“, V119 to změnila zbytečně.
UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(l.`words`,
      'nový fotbalový hřiště, který nás', 'nové fotbalové hřiště, které nás'),
      'že si to spíš budu hodit', 'že si to spíš půjdu hodit')
WHERE LOWER(s.`name`) = 'moje ves' AND l.`lang` = 'cs';

-- Kalba: Skeli zpívá „potkán“ s dlouhým á (rým na „nemám“), „zpozorním“ se píše se z.
UPDATE `lyrics` l JOIN `songs` s ON s.`id` = l.`song_id`
SET l.`words` = REPLACE(REPLACE(l.`words`,
      'plazím jak potkan,', 'plazím jak potkán,'),
      'spozorním, když vidím', 'zpozorním, když vidím')
WHERE LOWER(s.`name`) LIKE '%kalba%' AND l.`lang` = 'cs';
