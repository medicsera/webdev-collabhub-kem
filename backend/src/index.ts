import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Импортируем подключение к БД (с расширением .js для NodeNext)
import { db } from './db/index.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', service: 'CollabHub Backend API' });
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});