import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import patientsRouter from './routes/patients.js';
import appointmentsRouter from './routes/appointments.js';
import authRouter from './routes/auth.js';
import reportsRouter from './routes/reports.js';
import { query } from './database/db.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Setup paths for static frontend ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, '../gorica-calendar/dist');

// --- Serve static frontend FIRST ---
app.use(express.static(frontendPath));

// --- CORS configuration ---
const corsOptions = {
  origin: function (origin, callback) {
    // Allow same-origin and requests without origin (e.g. curl)
    if (!origin || origin === 'https://gorica-project.onrender.com') {
      return callback(null, true);
    }

    // Allow localhost during development
    if (process.env.NODE_ENV !== 'production') {
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://localhost:') ||
        origin.startsWith('https://127.0.0.1:')
      ) {
        return callback(null, true);
      }
    }

    // Allow explicit FRONTEND_URLs from env var
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : [];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health check endpoint ---
app.get('/health', async (req, res) => {
  try {
    await query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// --- API Routes ---
app.use('/api/auth', authRouter);
app.use('/api/patients', authenticateToken, patientsRouter);
app.use('/api/appointments', authenticateToken, appointmentsRouter);
app.use('/api/reports', authenticateToken, reportsRouter);

// --- Fallback for SPA routing ---
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- 404 handler (for APIs only) ---
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({ error: 'Route not found' });
  } else {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Patients API: http://localhost:${PORT}/api/patients (protected)`);
  console.log(`📅 Appointments API: http://localhost:${PORT}/api/appointments (protected)`);
  console.log(`📋 Reports API: http://localhost:${PORT}/api/reports (protected)`);
  console.log(`🖥️ Serving frontend from: ${frontendPath}`);
});
