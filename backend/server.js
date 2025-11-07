import dotenv from 'dotenv';
import express from 'express';
import connectDb from './config/db.js';
import cors from 'cors';
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/createadmin.js'
import userRoutes from './routes/userRoute.js'
import guestHouseRoutes from './routes/guestHouseRoutes.js'
import roomRoutes from './routes/roomRoutes.js';
import bedRoutes from './routes/bedRoutes.js';
import auditLogRoutes  from './routes/auditLogRoutes.js';

// Load .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


app.use('/api/auth', authRoutes);

// Connect with database
connectDb();

//Homepage Route [PUBLIC]
app.get('/',  (req, res) => {
    res.send("Welcome to Homepage")
})

// Admin routes
app.use('/api/admin', adminRoutes);

// User Route for Update
app.use('/api', userRoutes);

// Guest House Routes (Admin only)
app.use('/api/guesthouses', guestHouseRoutes);

// Room Management API (Admin)
app.use('/api/rooms', roomRoutes);

// Bed Management API (Admin)
app.use('/api/beds', bedRoutes);

// For Audit Logs
app.use('/api/audit-logs', auditLogRoutes);

// Start Server
app.listen(process.env.PORT_NUMBER || 5000, () => {
    console.log(`Server is running on port: ${process.env.PORT_NUMBER}`);
});