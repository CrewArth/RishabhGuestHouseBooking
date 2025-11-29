# 🏨 Guest House Booking System

A comprehensive web application for managing guest house bookings, rooms, and beds with separate interfaces for users and administrators. Built with MERN stack (MongoDB, Express.js, React, Node.js) with Redis caching for optimal performance.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Key Workflows](#-key-workflows)
- [Performance Optimizations](#-performance-optimizations)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### User Features
- 🔐 **User Authentication** - Secure registration and login with JWT tokens
- 🔑 **Password Reset** - Token-based password reset via email
- 🏠 **Browse Guest Houses** - View all available guest houses with images and details
- 📅 **Book Rooms/Beds** - Select guest house, dates, room, and bed for booking
- ✅ **Real-time Availability** - Check room and bed availability for selected dates
- 📋 **My Bookings** - View booking history with status (pending/approved/rejected)
- 👤 **Profile Management** - Update personal information with real-time validation
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

### Admin Features
- 🎛️ **Admin Dashboard** - Overview with statistics, charts, and metrics
- 🏢 **Guest House Management** - Full CRUD operations with image upload to AWS S3
- 🛏️ **Room Management** - Create, update, delete rooms with capacity management
- 🛌 **Bed Management** - Manage beds per room with auto-create feature
- 📊 **Booking Management** - Approve/reject bookings with instant confirmation
- 👥 **User Management** - View, edit, activate/deactivate, and delete users
- 📈 **Analytics & Reports** - Bookings per day chart, top guest houses chart
- 📝 **Audit Logs** - Complete audit trail of all system actions with filtering
- 📅 **Calendar View** - Visual calendar showing approved bookings
- 📥 **Data Export** - Export bookings and audit logs as CSV files

### System Features
- ⚡ **Redis Caching** - 90-95% faster response times with intelligent cache invalidation
- 🖼️ **Image Optimization** - Automatic image resizing and WebP conversion before S3 upload
- 📧 **Email Notifications** - Automated emails for booking confirmations and status updates
- 🔒 **Protected Routes** - Role-based access control for user and admin routes
- 🚀 **Performance Optimized** - Parallelized queries and non-blocking operations
- 📊 **Database Indexing** - Optimized database queries with compound indexes

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **React Toastify** - Toast notifications
- **Chart.js / React-Chartjs-2** - Data visualization
- **Vite** - Build tool and dev server
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js 5** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Redis** - Caching layer
- **Sharp** - Image processing
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **AWS SDK S3** - Cloud storage

### Infrastructure
- **MongoDB Atlas / Local** - Database
- **Redis** - Cache server
- **AWS S3** - Image storage
- **Gmail SMTP** - Email service

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas account)
- **Redis** (for caching - optional but recommended)
- **AWS Account** (for S3 image storage)
- **Gmail Account** (for email service)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GuestHouseBookingSystem
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Set Up MongoDB

**Option A: Local MongoDB**
- Install MongoDB locally
- Start MongoDB service

**Option B: MongoDB Atlas**
- Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster and get connection string

### 5. Set Up Redis (Optional but Recommended)

**Option A: Docker (Easiest)**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

**Option B: Local Installation**
- Install Redis based on your OS
- Start Redis service

**Verify Redis:**
```bash
redis-cli ping
# Should return: PONG
```

### 6. Set Up AWS S3

1. Create AWS account
2. Create S3 bucket
3. Create IAM user with S3 permissions
4. Get Access Key ID and Secret Access Key

### 7. Configure Environment Variables

Create `backend/.env` file:

```env
# Server Configuration
PORT_NUMBER=5000

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:5173
```

### 8. Start the Application

**Start Backend:**
```bash
cd backend
npm start
```

**Start Frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

### 9. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: See [API Endpoints](#-api-endpoints) section

---

## 📁 Project Structure

```
GuestHouseBookingSystem/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── deleteDb.js           # Database utilities
│   ├── controller/
│   │   ├── adminController.js    # Admin dashboard & analytics
│   │   ├── auditLogController.js # Audit log management
│   │   ├── authController.js     # Authentication (login, signup, password reset)
│   │   ├── bedController.js      # Bed CRUD operations
│   │   ├── bookingController.js  # Booking management
│   │   ├── guestHouseController.js # Guest house CRUD operations
│   │   ├── roomController.js     # Room CRUD operations
│   │   └── userController.js     # User management
│   ├── middlewares/
│   │   └── imageUpload.js        # Image upload & optimization middleware
│   ├── models/
│   │   ├── AuditLog.js           # Audit log schema
│   │   ├── Bed.js                # Bed schema
│   │   ├── Booking.js             # Booking schema
│   │   ├── GuestHouse.js          # Guest house schema
│   │   ├── Room.js                # Room schema
│   │   └── User.js                # User schema
│   ├── routes/
│   │   ├── adminRoutes.js        # Admin API routes
│   │   ├── auditLogRoutes.js     # Audit log routes
│   │   ├── auth.js                # Authentication routes
│   │   ├── bedRoutes.js           # Bed API routes
│   │   ├── bookingRoutes.js      # Booking API routes
│   │   ├── guestHouseRoutes.js   # Guest house API routes
│   │   ├── roomRoutes.js         # Room API routes
│   │   └── userRoute.js           # User API routes
│   ├── utils/
│   │   ├── auditLogger.js        # Audit logging utility
│   │   ├── emailService.js       # Email sending service
│   │   ├── emailTemplates/       # Email HTML templates
│   │   ├── jwt.js                 # JWT token generation/verification
│   │   ├── redisClient.js         # Redis client & cache helpers
│   │   └── s3Client.js            # AWS S3 client
│   ├── validators/
│   │   └── room.schema.js         # Joi validation schemas
│   ├── server.js                  # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── admin/
│   │   │   ├── components/        # Admin-specific components
│   │   │   ├── pages/             # Admin pages
│   │   │   ├── routes/            # Admin route protection
│   │   │   └── styles/            # Admin CSS files
│   │   ├── commonPages/           # About, Contact, Terms, FAQ
│   │   ├── components/            # Shared components (Navbar, Footer)
│   │   ├── users/
│   │   │   ├── components/        # User-specific components
│   │   │   ├── pages/             # User pages
│   │   │   ├── routes/            # User route protection
│   │   │   └── styles/            # User CSS files
│   │   ├── redux/                 # Redux store and slices
│   │   ├── utils/                 # Utility functions
│   │   ├── App.jsx                # Main app component with routes
│   │   └── main.jsx               # React entry point
│   └── package.json
│
└── README.md
```

---

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

--- 

**Made with ❤️ by Arth Vala**

---

## 📚 Additional Documentation

- [Project Workflow](./ProjectWorkflow.md) - Complete function and file documentation
- [Redis Implementation Guide](./REDIS_IMPLEMENTATION_STEPS.md) - Redis setup and implementation
- [System Diagrams](./SystemDiagrams.md) - ER, Class, and Use Case diagrams (if exists)

---

**Last Updated**: December 2024
**Version**: 1.0.0

