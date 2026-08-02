import dotenv from 'dotenv';
import express from 'express';
import connectDb from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import indexRoutes from './routes/index.js';

// Load .env file
dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

// CORS — allow the frontend origin (set FRONTEND_URL in env for production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.join(__dirname, 'images')));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Guest House Booking API' });
});

app.use('/api', indexRoutes);

// Connect to DB on first invocation (works for both persistent server and serverless)
connectDb().catch((err) => console.error('Initial DB connect failed:', err));

// Start persistent server when running locally / on Railway / Render etc.
// Vercel invokes the exported app directly — app.listen() is a no-op in that env.
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT_NUMBER || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
}

export default app;