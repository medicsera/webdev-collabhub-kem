-- Включение расширений для базы данных CollabHubKem
-- pgvector — хранение и поиск эмбеддингов (students.embedding, projects.embedding)
CREATE EXTENSION IF NOT EXISTS vector;
-- uuid-ossp — генерация UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgcrypto — gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
