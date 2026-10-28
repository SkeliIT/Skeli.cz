-- CatSmash: skóre zápasu (místo samotného času). Tabulky rekordů jsou podle délky zápasu (10 / 15 / 20 gólů),
-- obtížnost je v násobiči skóre. Zapisují se výhry i prohry; v tabulce se počítá nejlepší skóre hráče.
CREATE TABLE IF NOT EXISTS pong_scores (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    match_len   TINYINT NOT NULL,
    difficulty  TINYINT NOT NULL,
    score       INT NOT NULL,
    you         TINYINT NOT NULL,
    kevin       TINYINT NOT NULL,
    duration_ms INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_pong_scores_len (match_len, score),
    KEY idx_pong_scores_user (user_id),
    CONSTRAINT fk_pong_scores_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- výhry si pamatují délku zápasu; časy a odznaky z času / výsledku (10:0, 10:9, pod 75 s) jen ze zápasů do 10
ALTER TABLE pong_results ADD COLUMN IF NOT EXISTS match_len TINYINT NOT NULL DEFAULT 10;
