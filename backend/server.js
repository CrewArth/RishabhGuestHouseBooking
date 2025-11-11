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
import adminSummary from './routes/adminRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

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

// Guest House Routes (Admin only)
app.use('/api/guesthouses', guestHouseRoutes);

// Room Management API (Admin)
app.use('/api/rooms', roomRoutes);

// Bed Management API (Admin)
app.use('/api/beds', bedRoutes);

// For Audit Logs
app.use('/api/audit-logs', auditLogRoutes);

// For Admin Dashboard
app.use('/api/admin', adminSummary);

// User Route for Update and Delete
app.use('/api/users', userRoutes);

// For Booking Route [ADMIN + USER]
app.use('/api/bookings', bookingRoutes);

// Start Server
app.listen(process.env.PORT_NUMBER || 5000, () => {
    console.log(`Server is running on port: ${process.env.PORT_NUMBER}`);
});