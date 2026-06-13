import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import exportRoutes from './src/routes/exportRoutes.js';

// Load environment configurations
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsers
app.use(cors());
app.use(express.json());

// Serve generated export files statically (fallback for local development downloads)
const publicExportsPath = path.join(__dirname, 'public', 'exports');
app.use('/exports', express.static(publicExportsPath));

// Bind report export routing
app.use('/api/export', exportRoutes);



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'InfraTrack Report Exporter' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Report Export Backend running on http://localhost:${PORT}`);
  console.log(`📂 Fallback download path configured at: ${publicExportsPath}`);
});
