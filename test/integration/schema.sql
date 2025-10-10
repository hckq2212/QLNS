-- Minimal schema for integration tests used by the contract concurrency test
CREATE TABLE IF NOT EXISTS "user" (
  id SERIAL PRIMARY KEY,
  role TEXT,
  name TEXT
);

CREATE TABLE IF NOT EXISTS opportunity (
  id SERIAL PRIMARY KEY,
  customer_id INT,
  customer_temp TEXT,
  expected_price NUMERIC,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by INT
);

CREATE TABLE IF NOT EXISTS contract (
  id SERIAL PRIMARY KEY,
  opportunity_id INT,
  customer_id INT,
  total_cost NUMERIC,
  total_revenue NUMERIC,
  status TEXT,
  code TEXT,
  code_year TEXT,
  code_month TEXT,
  code_seq INT,
  signed_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project (
  id SERIAL PRIMARY KEY,
  contract_id INT,
  name TEXT,
  status TEXT,
  lead_ack_at TIMESTAMP WITH TIME ZONE,
  lead_ack_by INT
);

CREATE TABLE IF NOT EXISTS debt (
  id SERIAL PRIMARY KEY,
  contract_id INT,
  amount NUMERIC,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS job (
  id SERIAL PRIMARY KEY,
  contract_id INT,
  project_id INT,
  name TEXT,
  base_cost NUMERIC,
  sale_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- A trigger to sync job cost to contract totals (simple implementation)
CREATE OR REPLACE FUNCTION trg_job_sync_contract_func() RETURNS TRIGGER AS $$
BEGIN
  -- sum job sale_price and base_cost for the contract
  UPDATE contract SET
    total_revenue = COALESCE((SELECT SUM(sale_price) FROM job WHERE contract_id = NEW.contract_id), 0),
    total_cost = COALESCE((SELECT SUM(base_cost) FROM job WHERE contract_id = NEW.contract_id), 0)
  WHERE id = NEW.contract_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_sync_contract ON job;
CREATE TRIGGER trg_job_sync_contract
AFTER INSERT OR UPDATE ON job
FOR EACH ROW EXECUTE PROCEDURE trg_job_sync_contract_func();
