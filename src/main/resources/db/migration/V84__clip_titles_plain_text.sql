-- Clip titles stored HTML-escaped by the YouTube sync ("Skeli &amp; Babar") showed as "&amp;amp;" once the pages escaped
-- them again; titles are plain text now (the sync unescapes too, VideoTitles.unescape).
UPDATE `videos` SET `title` = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(`title`,
    '&quot;', '"'), '&#39;', ''''), '&#039;', ''''), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE `title` LIKE '%&%;%';
UPDATE `shorts` SET `title` = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(`title`,
    '&quot;', '"'), '&#39;', ''''), '&#039;', ''''), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE `title` LIKE '%&%;%';
