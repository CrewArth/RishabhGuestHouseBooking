Guest House Booking Project

check user role accessing admin panel
major tasks completed on user side, now work on admin panel
try working on crud op in admin side 5/11

things to do:
1 make responsive navbar

proper exit to dashboard from booking form
guest hosue should be visible when clicked one

Audit Logs has some errors.

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
- Main Content Area✅

# Phase 3
- Once a user books a guest house, the admin should have options to Approve or Reject the booking.
- In the Admin Panel, implement the following modules with full CRUD functionality:
    - Bed Master✅
    - Room Master✅
    - Guest House Master✅

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



### Prompt 1

Let me explain you what we are planning to do today.
Today, We'll be working on booking, where when user submits form, we will receive the request in admin panel under (http://localhost:5173/admin/bookings).


Let me explain you more precisely how the work flow will be happenning,
1. User Opens Guest House
2. User fills details for guest house
3. User clicks request booking button, that will display the booking application status under (http://localhost:5173/my-bookings) where we will display the guesthouse name, checkin , checkout date, booking status [pending, approved, rejected]
4. The same request will be received in admin panel under (http://localhost:5173/admin/bookings) where admin will have access to accept or reject the booking application.
5. If Admin accepts the request, we will update the status and reflect back to user. the same if we reject the request.
6. Once the Beds are booked, we will 

Note:
1. If the dates for that guest house, room, and bed are already booked then we will reject.
2. We are doing the same thing using nodemailer. we will send a booking request to admin as well as to the user's email. In Admin Email, We will display the request details and will have 2 buttons, to accept or reject.
3. Once beds are booked (accpedted), we will remove them from user side. so that other user cannot see the booked bed.
4. Once all beds from same room are booked(accepted) we will display room as "Room Full"

This is what we are planning to do today slowly and perfectly. nodemailer one we do later on but first we will be doing with the UI one.

Based on this, tell me which files do i need to share?


## Prompt 2
Alright, now lets work on Nodemailer. We have no files created yet for this mail purpose.
let me explain you what we will be doing in nodemailer.
    1. When user register's new account, we will send them a email of "Thank you for joining".
    2. Admin receives email for every new booking request.
    3. User receives email for every new booking request sent.
    4. When status changes from admin side, user will also receive mail regarding the latest status.

    --

## Issues to fix
1. GH image not getting deleted from S3✅
2. Not able to delete room and bed from admin panel✅
3. fix minor ui bugs
4. try adding auto refresh every 30 seconds in admin dashboard✅
5. Fix Audit Logs Panel UI✅
6. Add Pagination to Audit logs and users list in admin panel. ✅
7. add loading effect when booking button is clicked from user side✅

Todo for 14:
1. Fix CSS for GuestHouse, Room n Bed Management page.✅
2. In BookingMgmt, View Details does not display details.✅
3. Not able to delete (soft del) user from usersList✅
4. Look Console Error when opening Audit Log page✅
5. Error while creating Bed.✅

suggestion: Add Server message as toast message✅

14 late date
add standardiztion image during upload✅
add toast to all.✅
display server errors on ui, currently visible on console only.