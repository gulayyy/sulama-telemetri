CREATE TABLE sensors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  type VARCHAR(30) DEFAULT 'soil',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE readings (
  id BIGSERIAL PRIMARY KEY,
  sensor_id INT REFERENCES sensors(id),
  soil_moisture NUMERIC(5,2) NOT NULL,
  temperature NUMERIC(5,2) NOT NULL,
  air_humidity NUMERIC(5,2),
  battery NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_readings_sensor_time
  ON readings (sensor_id, recorded_at DESC);

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  sensor_id INT REFERENCES sensors(id),
  alert_type VARCHAR(30) DEFAULT 'IRRIGATION_NEEDED',
  message TEXT,
  value NUMERIC(5,2),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO sensors (name, location) VALUES
  ('Sera-1 Kuzey',  'Parsel A / 38.42N 27.14E'),
  ('Sera-1 Güney',  'Parsel A / 38.41N 27.14E'),
  ('Açık Tarla-1',  'Parsel B / 38.43N 27.15E'),
  ('Açık Tarla-2',  'Parsel B / 38.43N 27.16E'),
  ('Fide Alanı',    'Parsel C / 38.42N 27.13E');