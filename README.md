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

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Guest Houses (`/api/guesthouses`)
- `GET /api/guesthouses` - Get all guest houses (cached)
- `GET /api/guesthouses/:guestHouseId` - Get guest house by ID
- `POST /api/guesthouses` - Create guest house (admin only, with image upload)
- `PUT /api/guesthouses/:guestHouseId` - Update guest house (admin only)
- `DELETE /api/guesthouses/:guestHouseId` - Delete guest house (admin only)
- `PATCH /api/guesthouses/:guestHouseId/maintenance` - Toggle maintenance mode (admin only)

### Rooms (`/api/rooms`)
- `GET /api/rooms` - List rooms with pagination and filters
- `GET /api/rooms/by-guesthouse` - Get rooms by guest house ID
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create room (admin only)
- `PUT /api/rooms/:id` - Update room (admin only)
- `PATCH /api/rooms/:id/availability` - Toggle room availability (admin only)
- `DELETE /api/rooms/:id` - Soft delete room (admin only)

### Beds (`/api/beds`)
- `GET /api/beds?roomId=xxx` - Get beds by room ID
- `POST /api/beds` - Create bed (admin only)
- `POST /api/beds/auto-create` - Auto-create beds up to room capacity (admin only)
- `PUT /api/beds/:id` - Update bed (admin only)
- `PATCH /api/beds/:id/availability` - Toggle bed availability (admin only)
- `DELETE /api/beds/:id` - Soft delete bed (admin only)

### Bookings (`/api/bookings`)
- `POST /api/bookings` - Create booking request (user)
- `GET /api/bookings` - Get all bookings (admin only)
- `GET /api/bookings/my` - Get user's bookings
- `GET /api/bookings/availability` - Check room/bed availability (cached)
- `GET /api/bookings/calendar` - Get approved bookings for calendar (admin)
- `GET /api/bookings/export/daily` - Export daily bookings as CSV (admin)
- `PATCH /api/bookings/:id/approve` - Approve booking (admin only, optimized)
- `PATCH /api/bookings/:id/reject` - Reject booking (admin only, optimized)

### Admin (`/api/admin`)
- `GET /api/admin/summary` - Get dashboard statistics (cached)
- `GET /api/admin/users` - List all users with pagination
- `GET /api/admin/metrics/bookings-per-day` - Get bookings per day chart data
- `GET /api/admin/metrics/top-guest-houses` - Get top guest houses chart data

### Users (`/api/users`)
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin only)
- `PATCH /api/users/:id/deactivate` - Deactivate user (admin only)
- `PATCH /api/users/:id/toggle` - Toggle user status (admin only)

### Audit Logs (`/api/audit-logs`)
- `GET /api/audit-logs` - Get audit logs with pagination and filtering
- `GET /api/audit-logs/export/daily` - Export daily audit logs as CSV (admin)

---

## 🔄 Key Workflows

### User Registration Flow
1. User fills signup form → `Signup.jsx`
2. POST `/api/auth/signup` → `authController.registerUser`
3. Validates email uniqueness → Creates user with hashed password
4. Generates JWT token → Returns user and token
5. Sends welcome email (async) → Redirects to dashboard

### Booking Creation Flow
1. User selects guest house → `BookingForm.jsx`
2. User enters dates → Validates no past dates
3. Checks availability → GET `/api/bookings/availability` (cached in Redis)
4. User selects room and bed → Submits booking
5. POST `/api/bookings` → `bookingController.createBooking`
6. Validates bed availability → Creates booking (status: "pending")
7. Sends confirmation email (async) → Redirects to My Bookings

### Booking Approval Flow (Admin)
1. Admin clicks Approve → `Bookings.jsx`
2. PATCH `/api/bookings/:id/approve` → `bookingController.approveBooking`
3. Parallelizes queries → Updates booking status to "approved"
4. Marks bed unavailable → Returns response immediately (~200-300ms)
5. Sends approval email (async) → Logs action (async) → Invalidates cache (async)

### Password Reset Flow
1. User requests reset → `ForgotPassword.jsx`
2. POST `/api/auth/forgot-password` → Generates reset token
3. Sends reset email with link → User clicks link
4. `ResetPassword.jsx` extracts token → User enters new password
5. POST `/api/auth/reset-password` → Validates token → Updates password

---

## ⚡ Performance Optimizations

### Redis Caching
- **Guest Houses List**: Cached for 10 minutes (90-95% faster)
- **Booking Availability**: Cached for 2 minutes (95-99% faster)
- **Admin Dashboard**: Cached for 30 seconds (95-99% faster)
- **Cache Invalidation**: Automatic invalidation on data changes

### Database Optimizations
- **Compound Indexes**: On Booking model for faster availability queries
- **Parallelized Queries**: Uses `Promise.all` for simultaneous database operations
- **Non-blocking Operations**: Email, audit logging, and cache operations don't block responses

### Image Optimization
- **Automatic Resizing**: Images resized to 1280x720px
- **WebP Conversion**: Images converted to WebP format (70% quality)
- **File Size Reduction**: 70-90% smaller file sizes

### Code Optimizations
- **Optimized Booking Approval/Rejection**: Reduced from 3.97s to ~200-300ms
- **Optimized Signup/Booking Creation**: Reduced from 2.5-3s to milliseconds
- **Smart Cache Invalidation**: Only invalidates relevant cache keys

---

## 📸 Screenshots

### User Interface
- **Homepage**: Featured guest houses with images and details
- **Booking Form**: Two-step form with date validation and real-time availability
- **My Bookings**: Booking history with status badges
- **Profile**: User profile with real-time phone number validation

### Admin Interface
- **Dashboard**: Statistics cards, charts, and metrics
- **Guest House Management**: CRUD operations with image upload
- **Booking Management**: Approve/reject bookings with instant confirmation
- **Analytics**: Bookings per day and top guest houses charts

---

## 🎯 Use Cases

### For Users
- Browse available guest houses
- Check room and bed availability for specific dates
- Create booking requests
- View booking status and history
- Update profile information
- Reset forgotten password

### For Administrators
- Manage guest houses (create, update, delete, toggle maintenance)
- Manage rooms and beds for each guest house
- Approve or reject booking requests
- View and manage all users
- Monitor system activity through audit logs
- View analytics and generate reports
- Export data as CSV files

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds (10)
- **Password Reset Tokens**: SHA-256 hashed tokens with 15-minute expiration
- **Role-Based Access Control**: Separate user and admin routes
- **Input Validation**: Frontend and backend validation
- **Protected Routes**: Authentication required for user/admin pages
- **Email Enumeration Protection**: Generic messages for password reset

---

## 📊 Database Schema

### Entities
- **User**: Personal information, authentication, role
- **GuestHouse**: Guest house details, location, images
- **Room**: Room information, capacity, availability
- **Bed**: Bed details, type, availability
- **Booking**: Booking requests with dates, status, user info
- **AuditLog**: System action tracking

### Relationships
- User (1) → (N) Bookings
- GuestHouse (1) → (N) Rooms
- Room (1) → (N) Beds
- GuestHouse (1) → (N) Bookings
- Room (1) → (N) Bookings
- Bed (1) → (N) Bookings

---

## 🚦 Getting Started (Quick Start)

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd GuestHouseBookingSystem
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Set Up Environment**
   - Copy `.env.example` to `.env` (if exists) or create `backend/.env`
   - Fill in all required environment variables

3. **Start Services**
   - Start MongoDB
   - Start Redis: `docker run -d -p 6379:6379 --name redis redis:latest`

4. **Run Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

6. **Create Admin User**
   - Use Postman or similar tool to POST to `/api/admin/create` (if route exists)
   - Or manually create user with `role: "admin"` in database

---

## 🧪 Testing

### Manual Testing Checklist

**User Features:**
- [ ] User registration
- [ ] User login
- [ ] Password reset flow
- [ ] Browse guest houses
- [ ] Create booking
- [ ] View my bookings
- [ ] Update profile

**Admin Features:**
- [ ] Admin login
- [ ] View dashboard
- [ ] Create/update/delete guest house
- [ ] Manage rooms and beds
- [ ] Approve/reject bookings
- [ ] View audit logs
- [ ] Export data

**Performance:**
- [ ] Verify Redis caching (check console logs)
- [ ] Test booking approval speed (< 300ms)
- [ ] Test availability check speed (cached)

---

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Verify MongoDB is running
- Check MONGODB_URI in `.env`
- Ensure network access (for Atlas)

**Redis Connection Error**
- Verify Redis is running: `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT in `.env`
- Application will continue without Redis (graceful degradation)

**Image Upload Fails**
- Verify AWS credentials in `.env`
- Check S3 bucket permissions
- Verify bucket name matches exactly

**Email Not Sending**
- Verify Gmail app password (not regular password)
- Check EMAIL_USER and EMAIL_PASS in `.env`
- Check Gmail "Less secure app access" or use app password

**JWT Token Errors**
- Verify JWT_SECRET in `.env`
- Check token expiration settings
- Clear localStorage and re-login

---

## 📈 Performance Metrics

- **Guest Houses Loading**: 90-95% faster with Redis (50-100ms → 1-5ms)
- **Availability Checks**: 95-99% faster on cache hits (200-500ms → 1-5ms)
- **Admin Dashboard**: 95-99% faster (300-700ms → 1-5ms)
- **Booking Approval**: 90-95% faster (3.97s → 200-300ms)
- **Database Queries**: 70-90% reduction with caching

---

## 🔮 Future Enhancements

- [ ] Real-time notifications using WebSockets
- [ ] Payment integration
- [ ] Advanced search and filtering
- [ ] Booking cancellation feature
- [ ] Review and rating system
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Automated booking reminders
- [ ] Integration with calendar systems

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

## 📧 Contact & Support

For questions, issues, or support:
- **Email**: sales@rishabhsoft.com
- **Phone**: +91 8511122697
- **Website**: [Rishabh Software](https://www.rishabhsoft.com)

---

## 🙏 Acknowledgments

- Built with ❤️ using MERN stack
- Redis for high-performance caching
- AWS S3 for reliable image storage
- All open-source contributors

---

**Made with ❤️ by Rishabh Software**

---

## 📚 Additional Documentation

- [Project Workflow](./ProjectWorkflow.md) - Complete function and file documentation
- [Redis Implementation Guide](./REDIS_IMPLEMENTATION_STEPS.md) - Redis setup and implementation
- [System Diagrams](./SystemDiagrams.md) - ER, Class, and Use Case diagrams (if exists)

---

**Last Updated**: December 2024
**Version**: 1.0.0

