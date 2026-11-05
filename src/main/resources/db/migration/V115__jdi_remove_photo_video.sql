-- Jdi má na webu jen jedno video, 8y60i79nVJc (natočený klip). 5B9C5bFtvhE je stejná skladba jen s fotkou (přání Skeliho):
-- zmizí z webu i s prázdnou položkou „6: Skeli - Jdi (Prototyp outro)“ a text, který jí dala V114, jde s ní.
-- Na YouTube zůstává, seznam video_blocklist hlídá, aby ho synchronizace nevrátila. Kde položka není, nestane se nic.
INSERT IGNORE INTO `video_blocklist` (`youtube_id`) VALUES ('5B9C5bFtvhE');
DELETE FROM `video_comment_votes` WHERE `comment_id` IN (SELECT `id` FROM `video_comments` WHERE `youtube_id` = '5B9C5bFtvhE');
DELETE FROM `video_comments` WHERE `youtube_id` = '5B9C5bFtvhE' AND `parent_id` IS NOT NULL;
DELETE FROM `video_comments` WHERE `youtube_id` = '5B9C5bFtvhE';
DELETE FROM `karaoke_timings` WHERE `youtube_id` = '5B9C5bFtvhE';
DELETE FROM `videos` WHERE `youtube_id` = '5B9C5bFtvhE';
DELETE FROM `lyrics` WHERE `song_id` IN (SELECT `id` FROM `songs` WHERE LOWER(`name`) LIKE '%jdi%prototyp%outro%');
DELETE FROM `songs` WHERE LOWER(`name`) LIKE '%jdi%prototyp%outro%';
