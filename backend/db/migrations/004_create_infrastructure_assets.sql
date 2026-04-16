CREATE TABLE IF NOT EXISTS infrastructure_assets (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id BIGINT NOT NULL REFERENCES asset_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  latitude NUMERIC(10, 6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(10, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude::DOUBLE PRECISION, latitude::DOUBLE PRECISION), 4326)
  ) STORED,
  condition VARCHAR(100) NOT NULL,
  year_built INTEGER NOT NULL CHECK (year_built BETWEEN 1800 AND EXTRACT(YEAR FROM NOW())::INT + 1),
  description TEXT,
  photo_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_category_id
  ON infrastructure_assets(category_id);

CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_location
  ON infrastructure_assets
  USING GIST (location);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_infrastructure_assets_updated_at ON infrastructure_assets;

CREATE TRIGGER trg_infrastructure_assets_updated_at
BEFORE UPDATE ON infrastructure_assets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
