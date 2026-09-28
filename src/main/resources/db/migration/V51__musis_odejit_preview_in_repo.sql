-- The preview photo of "Musíš odejít" was uploaded through the admin on test.skeli.cz, so the
-- file (uploads/song-previews/8.jpg) existed only in the test checkout and www showed a broken
-- image. The photo now ships with the site (img/previews/musis-odejit.webp); only rows that
-- still point to the lost upload are changed.
UPDATE `songs`
SET `preview_image_url` = '/img/previews/musis-odejit.webp'
WHERE `preview_image_url` LIKE '/uploads/song-previews/8.jpg%';
