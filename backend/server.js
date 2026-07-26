import dotenv from 'dotenv';
import express from 'express';
import connectDb from './config/db.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import indexRoutes from './routes/index.js'

// Load .env file
dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.join(__dirname, 'images')));

//Homepage Route [PUBLIC]
app.get('/',  (req, res) => {
    res.send("Welcome to Homepage")
})

app.use('/api', indexRoutes)

// Start Server
app.listen(process.env.PORT_NUMBER || 5000, () => {
    // Connect with database
    connectDb();
    console.log(`Server is running on port: ${process.env.PORT_NUMBER}`);
});