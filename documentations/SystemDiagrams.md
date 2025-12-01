# Guest House Booking System - System Diagrams Documentation

This document contains detailed specifications for ER Diagram, Class Diagram, and Use Case Diagram in text format. Use this information to generate visual diagrams using tools like Draw.io, Lucidchart, PlantUML, or any UML diagramming tool.

---

## Table of Contents
1. [ER Diagram (Entity Relationship Diagram)](#er-diagram-entity-relationship-diagram)
2. [Class Diagram](#class-diagram)
3. [Use Case Diagram](#use-case-diagram)

---

## ER Diagram (Entity Relationship Diagram)

### Entities and Attributes

#### 1. User Entity
```
Entity: User
Primary Key: _id (ObjectId)
Attributes:
  - _id: ObjectId (PK)
  - firstName: String (required, minlength: 2)
  - lastName: String (required)
  - email: String (required, unique, indexed)
  - phone: Number (required, unique, indexed)
  - address: String (optional)
  - role: String (enum: ["user", "admin"], default: "user")
  - password: String (required, minlength: 6, hashed with bcrypt)
  - isActive: Boolean (default: true)
  - passwordResetToken: String (optional, select: false)
  - passwordResetExpires: Date (optional, select: false)
  - createdAt: Date (timestamp)
  - updatedAt: Date (timestamp)
```

#### 2. GuestHouse Entity
```
Entity: GuestHouse
Primary Key: _id (ObjectId)
Alternate Key: guestHouseId (Number, unique, auto-increment)
Attributes:
  - _id: ObjectId (PK)
  - guestHouseId: Number (unique, auto-increment, format: GH0001)
  - guestHouseName: String (required, unique)
  - location: Object
    - city: String (required)
    - state: String (required)
  - image: String (optional, S3 URL)
  - description: String (optional)
  - maintenance: Boolean (default: false)
  - createdAt: Date (timestamp)
  - updatedAt: Date (timestamp)
```

#### 3. Room Entity
```
Entity: Room
Primary Key: _id (ObjectId)
Attributes:
  - _id: ObjectId (PK)
  - guestHouseId: Number (FK to GuestHouse.guestHouseId, required, indexed)
  - roomNumber: Number (required)
  - roomType: String (enum: ["single", "double", "family"], required)
  - isAvailable: Boolean (default: true)
  - roomCapacity: Number (required)
  - isActive: Boolean (default: true, soft delete flag)
  - createdAt: Date (timestamp)
  - updatedAt: Date (timestamp)
  
Unique Constraint: (guestHouseId, roomNumber) - composite unique index
```

#### 4. Bed Entity
```
Entity: Bed
Primary Key: _id (ObjectId)
Attributes:
  - _id: ObjectId (PK)
  - roomId: ObjectId (FK to Room._id, required, indexed)
  - bedNumber: Number (required)
  - bedType: String (enum: ["single", "double", "suite"], required)
  - isAvailable: Boolean (default: true)
  - isActive: Boolean (default: true, soft delete flag)
  - createdAt: Date (timestamp)
  - updatedAt: Date (timestamp)
  
Unique Constraint: (roomId, bedNumber) - composite unique index
```

#### 5. Booking Entity
```
Entity: Booking
Primary Key: _id (ObjectId)
Attributes:
  - _id: ObjectId (PK)
  - userId: ObjectId (FK to User._id, required, indexed)
  - guestHouseId: ObjectId (FK to GuestHouse._id, required, indexed)
  - roomId: ObjectId (FK to Room._id, required)
  - bedId: ObjectId (FK to Bed._id, required, indexed)
  - checkIn: Date (required)
  - checkOut: Date (required)
  - status: String (enum: ["pending", "approved", "rejected"], default: "pending")
  - fullName: String (optional)
  - phone: String (optional)
  - address: String (optional)
  - specialRequests: String (optional)
  - createdAt: Date (timestamp)
  - updatedAt: Date (timestamp)
  
Indexes:
  - Compound: (bedId, status, checkIn, checkOut) - for overlap checking
  - (userId, createdAt) - for user bookings lookup
  - (guestHouseId, createdAt) - for guest house bookings
```

#### 6. AuditLog Entity
```
Entity: AuditLog
Primary Key: _id (ObjectId)
Attributes:
  - _id: ObjectId (PK)
  - action: String (required, enum: [
      'GUESTHOUSE_CREATED', 'GUESTHOUSE_UPDATED', 'GUESTHOUSE_DELETED',
      'MAINTENANCE_TOGGLED',
      'ROOM_CREATED', 'ROOM_UPDATED', 'ROOM_DELETED', 'ROOM_AVAILABILITY_TOGGLED',
      'BED_CREATED', 'BED_UPDATED', 'BED_DELETED', 'BED_AVAILABILITY_TOGGLED',
      'BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED',
      'USER_REGISTERED', 'USER_UPDATED', 'USER_DELETED',
      'USER_DEACTIVATED', 'USER_ACTIVATED'
    ])
  - entityType: String (required, enum: ['Booking', 'GuestHouse', 'Room', 'Bed', 'User'])
  - entityId: Mixed (ObjectId or Number, required)
  - performedBy: String (default: 'System')
  - details: Mixed (JSON object, optional)
  - createdAt: Date (timestamp)
  - updatedAt: Date (timestamp)
```

#### 7. Notification Entity
```
Entity: Notification
Primary Key: _id (ObjectId)
Attributes:
  - _id: ObjectId (PK)
  - userId: ObjectId (FK to User._id, required)
  - bookingId: ObjectId (FK to Booking._id, required)
  - createdAt: Date (timestamp)
  - updatedAt: Date (timestamp)
```

### Relationships

```
1. User (1) ────────< (N) Booking
   Relationship: One-to-Many
   Description: A user can have multiple bookings
   Foreign Key: Booking.userId → User._id

2. GuestHouse (1) ────────< (N) Room
   Relationship: One-to-Many
   Description: A guest house can have multiple rooms
   Foreign Key: Room.guestHouseId → GuestHouse.guestHouseId (Number reference)

3. Room (1) ────────< (N) Bed
   Relationship: One-to-Many
   Description: A room can have multiple beds
   Foreign Key: Bed.roomId → Room._id

4. GuestHouse (1) ────────< (N) Booking
   Relationship: One-to-Many
   Description: A guest house can have multiple bookings
   Foreign Key: Booking.guestHouseId → GuestHouse._id

5. Room (1) ────────< (N) Booking
   Relationship: One-to-Many
   Description: A room can have multiple bookings
   Foreign Key: Booking.roomId → Room._id

6. Bed (1) ────────< (N) Booking
   Relationship: One-to-Many
   Description: A bed can have multiple bookings (different time periods)
   Foreign Key: Booking.bedId → Bed._id

7. User (1) ────────< (N) Notification
   Relationship: One-to-Many
   Description: A user can have multiple notifications
   Foreign Key: Notification.userId → User._id

8. Booking (1) ────────< (N) Notification
   Relationship: One-to-Many
   Description: A booking can generate multiple notifications
   Foreign Key: Notification.bookingId → Booking._id

9. AuditLog (Independent)
   Relationship: Logs actions on all entities
   Description: Tracks all system actions with entity references
   Note: entityId can reference any entity (User, GuestHouse, Room, Bed, Booking)
```

### ER Diagram Summary
```
┌─────────────┐
│    User     │
│  (PK: _id)  │
└──────┬──────┘
       │
       │ 1:N
       │
       ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Booking    │─────▶│ GuestHouse │◀─────│    Room     │
│  (PK: _id)  │ N:1  │(PK: _id)   │ 1:N  │  (PK: _id)  │
└──────┬──────┘      └─────────────┘      └──────┬──────┘
       │                                         │
       │ N:1                                     │ 1:N
       │                                         │
       ▼                                         ▼
┌─────────────┐                          ┌─────────────┐
│    Bed      │                          │ AuditLog    │
│  (PK: _id)  │                          │  (PK: _id)  │
└─────────────┘                          └─────────────┘
       ▲
       │ N:1
       │
┌─────────────┐
│  Booking    │
└─────────────┘
```

---

## Class Diagram

### Controllers

#### AuthController
```
Methods:
  + registerUser
  + loginUser
  + forgotPassword
  + resetPassword
```

#### UserController
```
Methods:
  + updateUser
  + deleteUser
  + deactivateUser
  + toggleUserStatus
```

#### GuestHouseController
```
Methods:
  + createGuestHouse
  + getGuestHouses
  + getGuestHouseById
  + updateGuestHouse
  + deleteGuestHouse
  + toggleMaintenanceMode
```

#### RoomController
```
Methods:
  + createRoom
  + listRooms
  + getRoomById
  + updateRoom
  + setAvailability
  + softDeleteRoom
  + getRoomsByGuestHouse
```

#### BedController
```
Methods:
  + createBed
  + listBedsByRoom
  + updateBed
  + toggleAvailability
  + softDeleteBed
  + autoCreateBeds
```

#### BookingController
```
Methods:
  + createBooking
  + getAllBookings
  + getMyBookings
  + approveBooking
  + rejectBooking
  + checkAvailability
  + getApprovedBookingsForCalendar
  + exportDailyBookings
```

#### AdminController
```
Methods:
  + getAdminSummary
  + getBookingsPerDay
  + getTopGuestHouses
  + listUsers
```

#### AuditLogController
```
Methods:
  + getAuditLogs
  + exportDailyAuditLogs
```

### Utility Classes

#### AuditLogger
```
Methods:
  + logAction
```

#### EmailService
```
Methods:
  + sendEmail
```

### Models

#### User
```
Attributes:
  + firstName: String
  + lastName: String
  + email: String
  + phone: Number
  + address: String
  + role: String
  + password: String
  + isActive: Boolean
  + passwordResetToken: String
  + passwordResetExpires: Date

Methods:
  + save()
```

#### GuestHouse
```
Attributes:
  + guestHouseId: Number
  + guestHouseName: String
  + location: Object
  + image: String
  + description: String
  + maintenance: Boolean
```

#### Room
```
Attributes:
  + guestHouseId: Number
  + roomNumber: Number
  + roomType: String
  + isAvailable: Boolean
  + roomCapacity: Number
  + isActive: Boolean
```

#### Bed
```
Attributes:
  + roomId: ObjectId
  + bedNumber: Number
  + bedType: String
  + isAvailable: Boolean
  + isActive: Boolean
```

#### Booking
```
Attributes:
  + userId: ObjectId
  + guestHouseId: ObjectId
  + roomId: ObjectId
  + bedId: ObjectId
  + checkIn: Date
  + checkOut: Date
  + status: String
  + fullName: String
  + phone: String
  + address: String
  + specialRequests: String
```

#### AuditLog
```
Attributes:
  + action: String
  + entityType: String
  + entityId: Mixed
  + performedBy: String
  + details: Mixed
```

---

## Use Case Diagram

### Actors

1. **Guest (Unauthenticated User)**
   - Can browse public pages
   - Can register account
   - Can login

2. **User (Authenticated Regular User)**
   - Can manage profile
   - Can view guest houses
   - Can create bookings
   - Can view own bookings
   - Can reset password

3. **Admin (Authenticated Administrator)**
   - All User capabilities
   - Can manage guest houses
   - Can manage rooms
   - Can manage beds
   - Can manage bookings
   - Can manage users
   - Can view audit logs
   - Can view analytics

### Use Cases

#### Authentication & User Management Use Cases

```
UC-01: Register Account
Actor: Guest
Description: Create a new user account
Preconditions: User not logged in
Main Flow:
  1. Guest navigates to signup page
  2. Guest enters personal information (firstName, lastName, email, phone, address, password)
  3. System validates input
  4. System creates user account
  5. System sends welcome email
  6. System logs USER_REGISTERED action
  7. System redirects to dashboard
Postconditions: User account created, user logged in

UC-02: Login
Actor: Guest, User, Admin
Description: Authenticate and login to system
Preconditions: User has account
Main Flow:
  1. User navigates to login page
  2. User enters email and password
  3. System validates credentials
  4. System checks if user is active
  5. System generates JWT token
  6. System redirects based on role (user/admin)
Postconditions: User logged in, session established

UC-03: Forgot Password
Actor: Guest, User
Description: Request password reset link
Preconditions: User has account
Main Flow:
  1. User navigates to forgot password page
  2. User enters email
  3. System generates reset token
  4. System sends reset link via email
  5. System displays success message
Postconditions: Reset token generated, email sent

UC-04: Reset Password
Actor: Guest, User
Description: Reset password using token
Preconditions: User has valid reset token
Main Flow:
  1. User clicks reset link from email
  2. User enters new password
  3. System validates token and expiration
  4. System updates password
  5. System clears reset token
  6. System redirects to login
Postconditions: Password updated, user can login

UC-05: Update Profile
Actor: User
Description: Update user profile information
Preconditions: User logged in
Main Flow:
  1. User navigates to profile page
  2. User edits information (name, email, phone, address)
  3. System validates input
  4. System updates user record
  5. System logs USER_UPDATED action
  6. System displays success message
Postconditions: User profile updated
```

#### Guest House Management Use Cases (Admin Only)

```
UC-06: Create Guest House
Actor: Admin
Description: Add a new guest house to the system
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Guest House Management
  2. Admin clicks "Add Guest House"
  3. Admin enters guest house details (name, location, description, image)
  4. System uploads image to S3
  5. System creates guest house record
  6. System logs GUESTHOUSE_CREATED action
  7. System displays success message
Postconditions: Guest house created

UC-07: Update Guest House
Actor: Admin
Description: Modify guest house information
Preconditions: Admin logged in, guest house exists
Main Flow:
  1. Admin selects guest house to edit
  2. Admin modifies details
  3. System validates input
  4. System updates guest house record
  5. System logs GUESTHOUSE_UPDATED action
  6. System displays success message
Postconditions: Guest house updated

UC-08: Delete Guest House
Actor: Admin
Description: Remove guest house and all associated data
Preconditions: Admin logged in, guest house exists
Main Flow:
  1. Admin selects guest house to delete
  2. System deletes image from S3
  3. System deletes all rooms under guest house
  4. System deletes all beds under those rooms
  5. System deletes guest house record
  6. System logs GUESTHOUSE_DELETED action
  7. System displays success message
Postconditions: Guest house and all related data deleted

UC-09: Toggle Maintenance Mode
Actor: Admin
Description: Enable/disable maintenance mode for guest house
Preconditions: Admin logged in, guest house exists
Main Flow:
  1. Admin toggles maintenance button
  2. System updates maintenance flag
  3. System logs MAINTENANCE_TOGGLED action
  4. System displays status message
Postconditions: Maintenance mode toggled
```

#### Room Management Use Cases (Admin Only)

```
UC-10: Create Room
Actor: Admin
Description: Add a new room to a guest house
Preconditions: Admin logged in, guest house exists
Main Flow:
  1. Admin navigates to Room Management
  2. Admin selects guest house
  3. Admin clicks "Add Room"
  4. Admin enters room details (roomNumber, roomType, roomCapacity)
  5. System validates input
  6. System creates room record
  7. System logs ROOM_CREATED action
  8. System displays success message
Postconditions: Room created

UC-11: Update Room
Actor: Admin
Description: Modify room information
Preconditions: Admin logged in, room exists
Main Flow:
  1. Admin selects room to edit
  2. Admin modifies details
  3. System validates input
  4. System updates room record
  5. System logs ROOM_UPDATED action
  6. System displays success message
Postconditions: Room updated

UC-12: Delete Room (Soft Delete)
Actor: Admin
Description: Soft delete a room
Preconditions: Admin logged in, room exists
Main Flow:
  1. Admin selects room to delete
  2. System sets isActive to false
  3. System logs ROOM_DELETED action
  4. System displays success message
Postconditions: Room soft deleted (archived)

UC-13: Toggle Room Availability
Actor: Admin
Description: Enable/disable room availability
Preconditions: Admin logged in, room exists
Main Flow:
  1. Admin toggles availability button
  2. System updates isAvailable flag
  3. System logs ROOM_AVAILABILITY_TOGGLED action
  4. System displays status message
Postconditions: Room availability toggled
```

#### Bed Management Use Cases (Admin Only)

```
UC-14: Create Bed
Actor: Admin
Description: Add a new bed to a room
Preconditions: Admin logged in, room exists, room not at capacity
Main Flow:
  1. Admin navigates to Bed Management
  2. Admin selects room
  3. Admin clicks "Add Bed"
  4. Admin enters bed details (bedNumber, bedType)
  5. System validates room capacity
  6. System creates bed record
  7. System logs BED_CREATED action
  8. System displays success message
Postconditions: Bed created

UC-15: Auto-Create Beds
Actor: Admin
Description: Automatically create beds based on room capacity
Preconditions: Admin logged in, room exists
Main Flow:
  1. Admin selects room
  2. Admin clicks "Auto-Create Beds"
  3. System calculates beds needed
  4. System creates all beds
  5. System logs BED_CREATED for each bed
  6. System displays success message
Postconditions: All beds created up to room capacity

UC-16: Update Bed
Actor: Admin
Description: Modify bed information
Preconditions: Admin logged in, bed exists
Main Flow:
  1. Admin selects bed to edit
  2. Admin modifies details
  3. System validates input
  4. System updates bed record
  5. System logs BED_UPDATED action
  6. System displays success message
Postconditions: Bed updated

UC-17: Delete Bed (Soft Delete)
Actor: Admin
Description: Soft delete a bed
Preconditions: Admin logged in, bed exists
Main Flow:
  1. Admin selects bed to delete
  2. System sets isActive to false
  3. System logs BED_DELETED action
  4. System displays success message
Postconditions: Bed soft deleted (archived)

UC-18: Toggle Bed Availability
Actor: Admin
Description: Enable/disable bed availability
Preconditions: Admin logged in, bed exists
Main Flow:
  1. Admin toggles availability button
  2. System updates isAvailable flag
  3. System logs BED_AVAILABILITY_TOGGLED action
  4. System displays status message
Postconditions: Bed availability toggled
```

#### Booking Management Use Cases

```
UC-19: View Guest Houses
Actor: User, Admin
Description: Browse available guest houses
Preconditions: User logged in
Main Flow:
  1. User navigates to homepage or dashboard
  2. System fetches all active guest houses
  3. System displays guest house cards
Postconditions: Guest houses displayed

UC-20: Check Availability
Actor: User
Description: Check room and bed availability for dates
Preconditions: User logged in, guest house selected
Main Flow:
  1. User selects guest house
  2. User enters check-in and check-out dates
  3. System queries overlapping approved bookings
  4. System calculates unavailable rooms and beds
  5. System returns availability data
Postconditions: Availability information displayed

UC-21: Create Booking Request
Actor: User
Description: Submit a booking request
Preconditions: User logged in, bed available for dates
Main Flow:
  1. User selects guest house, room, bed, and dates
  2. User enters booking details (fullName, phone, address, specialRequests)
  3. System validates bed availability
  4. System creates booking with status "pending"
  5. System sends booking confirmation email
  6. System logs BOOKING_CREATED action
  7. System redirects to My Bookings
Postconditions: Booking request created

UC-22: View My Bookings
Actor: User
Description: View all own booking requests
Preconditions: User logged in
Main Flow:
  1. User navigates to My Bookings page
  2. System fetches user's bookings
  3. System displays bookings with status
Postconditions: User bookings displayed

UC-23: Approve Booking
Actor: Admin
Description: Approve a pending booking request
Preconditions: Admin logged in, booking exists with status "pending"
Main Flow:
  1. Admin navigates to Bookings page
  2. Admin selects booking to approve
  3. Admin clicks "Approve"
  4. System updates booking status to "approved"
  5. System marks bed as unavailable
  6. System sends approval email to user
  7. System logs BOOKING_APPROVED action
  8. System displays success message
Postconditions: Booking approved, bed marked unavailable

UC-24: Reject Booking
Actor: Admin
Description: Reject a pending booking request
Preconditions: Admin logged in, booking exists with status "pending"
Main Flow:
  1. Admin navigates to Bookings page
  2. Admin selects booking to reject
  3. Admin clicks "Reject"
  4. System updates booking status to "rejected"
  5. System sends rejection email to user
  6. System logs BOOKING_REJECTED action
  7. System displays success message
Postconditions: Booking rejected

UC-25: View All Bookings
Actor: Admin
Description: View all booking requests in system
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Bookings page
  2. System fetches all bookings
  3. System displays bookings with user and guest house details
Postconditions: All bookings displayed
```

#### User Management Use Cases (Admin Only)

```
UC-26: View All Users
Actor: Admin
Description: View paginated list of all users
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Users List page
  2. System fetches paginated users
  3. System displays user list
Postconditions: Users list displayed

UC-27: Deactivate User
Actor: Admin
Description: Deactivate a user account
Preconditions: Admin logged in, user exists
Main Flow:
  1. Admin selects user to deactivate
  2. Admin clicks "Deactivate"
  3. System sets isActive to false
  4. System logs USER_DEACTIVATED action
  5. System displays success message
Postconditions: User deactivated

UC-28: Activate User
Actor: Admin
Description: Activate a deactivated user account
Preconditions: Admin logged in, user exists
Main Flow:
  1. Admin selects user to activate
  2. Admin clicks "Activate"
  3. System sets isActive to true
  4. System logs USER_ACTIVATED action
  5. System displays success message
Postconditions: User activated

UC-29: Delete User
Actor: Admin
Description: Permanently delete a user account
Preconditions: Admin logged in, user exists
Main Flow:
  1. Admin selects user to delete
  2. Admin confirms deletion
  3. System deletes user record
  4. System logs USER_DELETED action
  5. System displays success message
Postconditions: User deleted
```

#### Analytics & Reporting Use Cases (Admin Only)

```
UC-30: View Dashboard Summary
Actor: Admin
Description: View system statistics and metrics
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Dashboard
  2. System fetches statistics (users, guest houses, bookings, occupancy rate)
  3. System displays summary cards
Postconditions: Dashboard statistics displayed

UC-31: View Bookings Per Day Chart
Actor: Admin
Description: View booking trends over time
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Dashboard
  2. Admin selects date range
  3. System fetches booking data per day
  4. System displays chart
Postconditions: Bookings chart displayed

UC-32: View Top Guest Houses Chart
Actor: Admin
Description: View most popular guest houses
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Dashboard
  2. Admin selects date range
  3. System fetches top guest houses by booking count
  4. System displays chart
Postconditions: Top guest houses chart displayed

UC-33: View Calendar View
Actor: Admin
Description: View approved bookings in calendar format
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Calendar page
  2. System fetches approved bookings
  3. System displays bookings on calendar
Postconditions: Calendar view displayed
```

#### Audit & Logging Use Cases (Admin Only)

```
UC-34: View Audit Logs
Actor: Admin
Description: View system activity logs
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Audit Logs page
  2. Admin optionally filters by entity type
  3. System fetches paginated audit logs
  4. System displays logs with details
Postconditions: Audit logs displayed

UC-35: Export Audit Logs
Actor: Admin
Description: Export audit logs for a date as CSV
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Audit Logs page
  2. Admin selects date
  3. Admin clicks "Export"
  4. System generates CSV file
  5. System downloads file
Postconditions: CSV file downloaded

UC-36: Export Daily Bookings
Actor: Admin
Description: Export bookings for a date as CSV
Preconditions: Admin logged in
Main Flow:
  1. Admin navigates to Bookings page
  2. Admin selects date
  3. Admin clicks "Export"
  4. System generates CSV file
  5. System downloads file
Postconditions: CSV file downloaded
```

### Use Case Relationships

```
<<include>> Relationships:
  - UC-21 includes UC-20 (Check Availability before Create Booking)
  - UC-23 includes UC-20 (Check Availability before Approve Booking)

<<extend>> Relationships:
  - UC-03 extends UC-02 (Forgot Password extends Login)
  - UC-04 extends UC-03 (Reset Password extends Forgot Password)

Generalization:
  - Admin inherits all User use cases
  - User inherits all Guest use cases (except Register/Login)
```

### Use Case Diagram Summary

```
┌─────────────────────────────────────────────────────────────┐
│                        ACTORS                                │
├─────────────────────────────────────────────────────────────┤
│ Guest (Unauthenticated)                                      │
│ User (Authenticated Regular User)                           │
│ Admin (Authenticated Administrator)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    USE CASE GROUPS                          │
├─────────────────────────────────────────────────────────────┤
│ Authentication & User Management (UC-01 to UC-05)           │
│ Guest House Management (UC-06 to UC-09) - Admin Only        │
│ Room Management (UC-10 to UC-13) - Admin Only                │
│ Bed Management (UC-14 to UC-18) - Admin Only                 │
│ Booking Management (UC-19 to UC-25)                         │
│ User Management (UC-26 to UC-29) - Admin Only               │
│ Analytics & Reporting (UC-30 to UC-33) - Admin Only          │
│ Audit & Logging (UC-34 to UC-36) - Admin Only              │
└─────────────────────────────────────────────────────────────┘
```

---

## Diagram Generation Instructions

### For ER Diagram:
1. Use entities listed above
2. Draw rectangles for each entity
3. List attributes inside each rectangle
4. Use diamond shapes for relationships
5. Label relationships with cardinality (1:N, N:1, etc.)
6. Use lines to connect entities to relationships
7. Mark primary keys (PK) and foreign keys (FK)

### For Class Diagram:
1. Use classes listed above
2. Draw rectangles for each class
3. List methods with visibility (+ for public)
4. Show method parameters and return types
5. Use arrows to show dependencies/imports
6. Group related classes (Controllers, Models, Utilities)

### For Use Case Diagram:
1. Draw stick figures for actors (Guest, User, Admin)
2. Draw ovals for use cases
3. Group use cases by functionality
4. Use lines to connect actors to use cases
5. Use <<include>> and <<extend>> for relationships
6. Use generalization arrows (Admin → User → Guest)

### Recommended Tools:
- **Draw.io / diagrams.net**: Free, web-based, supports all diagram types
- **Lucidchart**: Professional, cloud-based
- **PlantUML**: Text-based UML, good for version control
- **Visual Paradigm**: Professional UML tool
- **StarUML**: Free desktop UML tool

---

**Last Updated**: {Current Date}
**Version**: 1.0
**Author**: System Documentation

