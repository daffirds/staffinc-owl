import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import setupController from './controllers/setup.controller';
import uploadController from './controllers/upload.controller';
import metricsController from './controllers/metrics.controller';

const app = express();
const PORT = process.env.PORT || 8000;

// Configure CORS
const origins = [
    'http://localhost:5173', // Vite default
    'http://localhost:3000',
];

app.use(
    cors({
        origin: origins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (_req, res) => {
    res.json({ message: 'Welcome to Staffinc Owl API' });
});

// Mount routers
app.use('/api', setupController);
app.use('/api', uploadController);
app.use('/api', metricsController);

// Start server
app.listen(PORT, () => {
    console.log(`🦉 Staffinc Owl API running on http://localhost:${PORT}`);
});

export default app;
