-- Premiérové video (admin → píseň → Premiéra). Odkaz na neveřejné video z YouTube se do premiéry drží jen tady,
-- mimo tabulku videos: žádná veřejná část webu (stránka písně, Hudba, Diskografie, Novinky, hledání, mapa webu, API…)
-- o něm do té doby neví, takže ho nemůže prozradit. V okamžiku premiéry (songs.release_at) ho job/PremiereJob
-- jednou přesune do videos a nastaví premiere_video_done = 1. Systém je obecný pro všechny budoucí premiéry.
ALTER TABLE `songs`
  ADD COLUMN `premiere_video_id` VARCHAR(20) NULL,
  ADD COLUMN `premiere_video_done` TINYINT(1) NOT NULL DEFAULT 0;
