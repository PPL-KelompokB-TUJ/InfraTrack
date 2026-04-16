CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Administrator', 'Operator', 'Viewer')),
  profile_photo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
