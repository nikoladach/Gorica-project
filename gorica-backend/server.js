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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ --- FIXED CORS CONFIGURATION ---
const allowedOrigins = [
  'https://gorica-project.onrender.com', // frontend (Render)
  'http://localhost:5173',               // dev
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// ✅ Apply CORS before everything else
app.use(cors(corsOptions));

// ✅ Explicitly handle preflight requests
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health check (kept above frontend serving)
app.get('/health', async (req, res) => {
  try {
    await query('SELECT NOW()');
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// ✅ API routes (make sure these exist)
app.use('/api/auth', authRouter);
app.use('/api/patients', authenticateToken, patientsRouter);
app.use('/api/appointments', authenticateToken, appointmentsRouter);
app.use('/api/reports', authenticateToken, reportsRouter);

// ✅ Serve frontend AFTER APIs
const frontendPath = path.join(__dirname, '../gorica-calendar/dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
