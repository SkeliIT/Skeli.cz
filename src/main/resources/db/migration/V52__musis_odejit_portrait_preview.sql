-- "Musíš odejít" uses the black-and-white portrait (the dark-theme photo from the about page,
-- cropped to 16:9) as its preview instead of the uploaded photo from V51. Matched by name
-- (with or without the "Skeli - " prefix the pages hide) and by the previous preview URLs.
UPDATE `songs`
SET `preview_image_url` = '/img/previews/musis-odejit-portrait.webp'
WHERE `name` IN ('Musíš odejít', 'Skeli - Musíš odejít')
   OR `preview_image_url` LIKE '/img/previews/musis-odejit.webp%'
   OR `preview_image_url` LIKE '/uploads/song-previews/8.jpg%';
