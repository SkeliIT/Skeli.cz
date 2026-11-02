-- CatSmash: anonymní denní počítadla her pro vyváženost obtížností (admin → Statistiky → CatSmash).
-- Jen součty za den podle obtížnosti a délky zápasu – bez lidí, bez IP. Počítají se i nepřihlášení a prohry
-- (pong_results / pong_scores mají jen výhry přihlášených). Roboti a admini se nepočítají.
CREATE TABLE IF NOT EXISTS pong_daily (
    day        DATE     NOT NULL,
    difficulty TINYINT  NOT NULL,
    match_len  TINYINT  NOT NULL,
    starts     INT      NOT NULL DEFAULT 0,   -- rozehrané zápasy (první podání)
    finished   INT      NOT NULL DEFAULT 0,   -- dohrané (někdo dal poslední gól)
    wins       INT      NOT NULL DEFAULT 0,   -- z toho výhry hráče
    ms_sum     BIGINT   NOT NULL DEFAULT 0,   -- součet délek dohraných zápasů
    you_sum    INT      NOT NULL DEFAULT 0,   -- součet gólů hráče v dohraných
    kevin_sum  INT      NOT NULL DEFAULT 0,   -- součet Kevinových gólů v dohraných
    PRIMARY KEY (day, difficulty, match_len)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
