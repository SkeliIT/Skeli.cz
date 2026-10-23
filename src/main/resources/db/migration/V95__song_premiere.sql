-- Premiéra písně nebo klipu s odpočtem (admin → píseň → Základ → Premiéra).
-- release_at = okamžik premiéry v milisekundách od roku 1970 (UTC; zobrazuje se v pražském čase),
-- release_kind = 'clip' (nový klip) nebo 'song' (nová píseň). Prázdné = žádná premiéra.
ALTER TABLE `songs`
  ADD COLUMN `release_at` BIGINT NULL,
  ADD COLUMN `release_kind` VARCHAR(8) NULL;
