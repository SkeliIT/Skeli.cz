-- Videa, která mají místo názvu jen svůj kód z YouTube (např. „GrWcsBFv2jU“): YouTube u naplánované premiéry název
-- neprozradí a Přidat track pak uložil kód. Na webu (Novinky, Hudba…) se ukazoval jako název.
-- Video čekající na premiéru dostane název své písně, video spojené s písní taky.

UPDATE videos v
JOIN songs s ON s.premiere_video_id = v.youtube_id
SET v.title = s.name
WHERE v.title IS NULL OR v.title = '' OR v.title = v.youtube_id;

UPDATE videos v
JOIN songs s ON s.id = v.song_id
SET v.title = s.name
WHERE v.title = v.youtube_id;
