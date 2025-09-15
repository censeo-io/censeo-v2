-- Initialize Censeo development database
-- This script runs when the PostgreSQL container starts for the first time

-- Ensure the database exists
CREATE DATABASE censeo_dev;

-- Switch to the censeo_dev database
\c censeo_dev;

-- Create extensions we might need
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant all privileges on database to censeo_user
GRANT ALL PRIVILEGES ON DATABASE censeo_dev TO censeo_user;

-- Grant usage on schema public
GRANT USAGE ON SCHEMA public TO censeo_user;
GRANT CREATE ON SCHEMA public TO censeo_user;

-- Log completion
\echo 'Database initialization completed successfully'