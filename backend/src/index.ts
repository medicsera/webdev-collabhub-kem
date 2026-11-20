import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import applicationRoutes from './controllers/application.routes.js';
import authRoutes from './controllers/auth.routes.js';
import studentsRoutes from './controllers/students.routes.js';
import organizationsRoutes from './controllers/organizations.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/organizations', organizationsRoutes);
app.use('/api/application', applicationRoutes);
// Алиасы на случай старых путей
app.use('/api/auth', authRoutes);

/**
 * Health: процесс + БД + pgvector (НФР-01/02)
 * 200 — всё ок, 503 — деградация
 */
app.get('/api/v1/health', async (req, res) => {
    const checks = {
        service: 'ok',
        database: 'ok',
        pgvector: 'ok',
    };
    let healthy = true;

    try {
        await db.execute(sql`SELECT 1`);
    } catch (error) {
        healthy = false;
        checks.database = 'error';
        console.error('Health: DB check failed', error);
    }

    try {
        const rows = await db.execute(sql`
            SELECT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'vector'
            ) AS available
        `);
        const available = (rows as unknown as { rows: { available: boolean }[] }).rows?.[0]?.available;
        if (!available) {
            healthy = false;
            checks.pgvector = 'extension_missing';
        }
    } catch (error) {
        healthy = false;
        checks.pgvector = 'error';
        console.error('Health: pgvector check failed', error);
    }

    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        service: 'CollabHub Backend API',
        checks,
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}
To check health press: http://localhost:5000/api/v1/health`);
});
