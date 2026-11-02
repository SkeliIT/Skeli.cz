-- Upozornění „někdo tě předběhl v CatSmash“: nový druh bez komentáře, info = tabulka a nové místo
-- (např. score|2|10|4 = Skóre, Normální, 10 gólů, teď 4. místo).
ALTER TABLE notifications MODIFY type ENUM('reply', 'heart', 'passed') NOT NULL;
ALTER TABLE notifications MODIFY comment_kind ENUM('lyric', 'video') NULL;
ALTER TABLE notifications MODIFY comment_id INT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS info VARCHAR(40) NULL;
