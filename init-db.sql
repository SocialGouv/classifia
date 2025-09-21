-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
\echo 'Database initialization completed successfully!'
\echo 'pgvector extension enabled for vector similarity search'
