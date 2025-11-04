Guest House Booking Project

check user role accessing admin panel

# Phase 1
- Complete all database schemas. ✅
- Set up the Node.js + Express server. ✅
- Implement Login and Register routes and pages. ✅
- Ensure the server is running successfully. ✅

# Phase 2
- Create the Admin Panel. ✅
- The Admin account will be created manually using Postman. ✅
- After login, the User Dashboard (or booking form) should be accessible. ✅
- The User Dashboard must include
    - Sidebar
    - Navbar✅
    - Footer✅
- Main Content Area

# Phase 3
- Once a user books a guest house, the admin should have options to Approve or Reject the booking.
- In the Admin Panel, implement the following modules with full CRUD functionality:
    - Bed Master
    - Room Master
    - Guest House Master

# Important Notes
- Implement Protected Routes so that unauthorized users cannot access restricted areas. ✅
- Both User Login Page and Admin Login Page must be developed. ✅
- Start development in this order:
    - Bed
    - Room
    - Guest House


# Suggested Routes for this WebApp
## PUBLIC ROUTES
/ - Homepage / Landing Page (overview, CTA, about section)
/about - Information about the guest house or service
/contact - Contact form or inquiry page
/faq - Frequently Asked Questions
/signin - User login page
/signup - User registration page
/terms - Terms & Conditions page
/privacy - Privacy Policy page
/forgotpassword - Forgot/reset password workflow

## USER ROUTES
/dashboard - User dashboard (after login)
/book - Booking form page (select guest house, dates, rooms, beds)
/bookings - User booking list/history (pending, approved, rejected)
/booking/:id - View specific booking details
/profile - View/update user profile info
/logout - route to trigger logout redirect
/notification - Display booking updates/alerts for users

## ADMIN ROUTES
/admin/dashboard - Admin home (summary cards, stats, recent bookings)
/admin/guesthouse - Manage guest house master (CRUD)
/admin/rooms - Manage room master (CRUD)
/admin/beds - Manage bed master (CRUD)
/admin/bookings - View all bookings (approve/reject options)
/admin/booking/:id - View single booking details
/admin/users - Manage users (view, block, or delete)
/admin/user/:id - View specific User Profile