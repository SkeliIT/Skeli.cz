-- Profil: písmo mota (brush = podpis písmem loga, modern = Bruno Ace, clean = Oswald kurzíva). Prázdné = podpis.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS motto_font VARCHAR(10) NULL;
