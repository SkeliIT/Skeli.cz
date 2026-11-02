-- CatSmash: nové bodování (bonus za čas = 2000 × normální čas ÷ můj čas) a délky zápasu 10 / 20 / 30 gólů.
-- Do tabulky skóre se nově počítají jen výhry. Staré skóre (jiné bodování, i prohry, délky 15 a 20) se vynuluje.
-- Výhry v pong_results zůstávají (tabulka času, odznaky).
DELETE FROM pong_scores;
