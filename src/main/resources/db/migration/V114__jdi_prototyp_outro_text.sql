-- Položka „6: Skeli - Jdi (Prototyp outro)“ je stejná skladba jako Jdi (potvrdil Skeli), jen neměla text.
-- Zkopíruje text i překlady z písně Jdi do všech jazyků, které tam zatím chybí. Kde ta položka není (test, lokálně), nestane se nic.
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT o.`id`, j.`lang`, j.`title`, j.`words`, 0
FROM `songs` o
JOIN `songs` js ON LOWER(js.`name`) = 'jdi'
JOIN `lyrics` j ON j.`song_id` = js.`id`
WHERE LOWER(o.`name`) LIKE '%jdi%prototyp%outro%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = o.`id` AND l.`lang` = j.`lang`);
