# Password Reset & Forgot Password Functionality - Complete Process Documentation

## Overview
This document explains the complete step-by-step process of how the Forgot Password and Reset Password functionality works in the Guest House Booking System.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Forgot Password Process](#forgot-password-process)
4. [Reset Password Process](#reset-password-process)
5. [Security Features](#security-features)
6. [File Structure](#file-structure)
7. [API Endpoints](#api-endpoints)
8. [Frontend Routes](#frontend-routes)
9. [Complete Flow Diagram](#complete-flow-diagram)

---

## Architecture Overview

The password reset functionality uses a **token-based system** with the following components:
- **Frontend**: React pages for user interaction
- **Backend**: Express.js API endpoints
- **Database**: MongoDB to store reset tokens
- **Email Service**: Nodemailer for sending reset links
- **Security**: Crypto library for secure token generation

---

## Database Schema

### User Model Fields (Relevant to Password Reset)
```javascript
passwordResetToken: {
    type: String,
    select: false  // Not included in queries by default for security
}
passwordResetExpires: {
    type: Date,
    select: false  // Not included in queries by default for security
}
```

**Key Points:**
- `passwordResetToken`: Stores SHA-256 hashed token (not plain token)
- `passwordResetExpires`: Stores expiration timestamp (15 minutes from generation)
- Both fields are excluded from default queries (`select: false`) for security

---

## Forgot Password Process

### Step 1: User Initiates Password Reset
**Location**: `frontend/src/users/pages/ForgotPassword.jsx`

1. User navigates to `/forgot-password` route
2. User enters their email address in the form
3. User clicks "Send Reset Link" button

**Frontend Code Flow:**
```javascript
handleSubmit() → 
  Validates email → 
  POST request to /api/auth/forgot-password → 
  Shows success/error message
```

### Step 2: Backend Receives Request
**Location**: `backend/controller/authController.js` - `forgotPassword` function

**Process:**
1. **Extract Email** (Line 92)
   - Gets `email` from request body
   - Validates that email is provided

2. **Find User** (Line 98)
   - Queries database: `User.findOne({ email })`
   - **Security Feature**: If user doesn't exist, still returns success message
   - This prevents email enumeration attacks

3. **Generate Reset Token** (Lines 105-106)
   ```javascript
   const resetToken = crypto.randomBytes(32).toString('hex');
   const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
   ```
   - Generates 32-byte random token (64 hex characters)
   - Hashes token using SHA-256 before storing
   - **Plain token** is sent in email, **hashed token** is stored in DB

4. **Store Token in Database** (Lines 108-110)
   ```javascript
   user.passwordResetToken = hashedToken;
   user.passwordResetExpires = Date.now() + (15 * 60 * 1000); // 15 minutes
   await user.save({ validateBeforeSave: false });
   ```
   - Sets hashed token on user document
   - Sets expiration to 15 minutes from now
   - Saves without validation (to avoid password validation errors)

5. **Generate Reset Link** (Lines 112-113)
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
   const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
   ```
   - Creates URL with plain token and email as query parameters
   - Uses environment variable for frontend URL or defaults to localhost

6. **Send Email** (Lines 115-120)
   - Calls `sendEmail()` function with:
     - Recipient: User's email
     - Subject: "Password Reset Instructions"
     - HTML: Generated email template with reset link
   - **Error Handling**: If email fails, token is cleared from database

7. **Return Response** (Line 129)
   - Always returns success message (for security)
   - Message: "If an account exists, password reset instructions were sent"

### Step 3: User Receives Email
**Location**: `backend/utils/emailTemplates/passwordReset.js`

**Email Content:**
- Personalized greeting with user's first name
- Explanation of password reset request
- Clickable "Reset Password" button with reset link
- Expiration notice (15 minutes)
- Security notice if they didn't request it

**Reset Link Format:**
```
http://localhost:5173/reset-password?token=abc123...&email=user@example.com
```

---

## Reset Password Process

### Step 1: User Clicks Reset Link
**Location**: `frontend/src/users/pages/ResetPassword.jsx`

1. User clicks link from email
2. Browser navigates to `/reset-password?token=...&email=...`
3. React Router extracts query parameters

**Code:**
```javascript
const { search } = useLocation();
const params = new URLSearchParams(search);
const tokenFromUrl = params.get("token");
const emailFromUrl = params.get("email");
```

### Step 2: Frontend Validates URL Parameters
**Location**: `frontend/src/users/pages/ResetPassword.jsx` (Line 27)

- Checks if both `token` and `email` are present
- If missing, shows error message and "Request New Link" button
- If present, shows password reset form

### Step 3: User Enters New Password
**Location**: `frontend/src/users/pages/ResetPassword.jsx`

1. User enters new password (minimum 6 characters)
2. User confirms password
3. Frontend validates passwords match
4. User clicks "Reset Password" button

**Validation:**
- Passwords must match
- Minimum 6 characters required
- Token and email must be present in URL

### Step 4: Backend Validates and Resets Password
**Location**: `backend/controller/authController.js` - `resetPassword` function

**Process:**

1. **Extract Data** (Line 140)
   ```javascript
   const { token, email, password } = req.body;
   ```
   - Gets token, email, and new password from request

2. **Validate Input** (Lines 142-144)
   - Checks all three fields are provided
   - Returns 400 error if any missing

3. **Hash Token for Comparison** (Line 146)
   ```javascript
   const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
   ```
   - Hashes the plain token from request
   - This will be compared with stored hashed token

4. **Find User with Valid Token** (Lines 148-152)
   ```javascript
   const user = await User.findOne({
       email,
       passwordResetToken: hashedToken,
       passwordResetExpires: { $gt: Date.now() }
   });
   ```
   - Searches for user with:
     - Matching email
     - Matching hashed token
     - Token not expired (expiration > current time)
   - **Note**: MongoDB can query by fields even if they have `select: false`
   - The fields are excluded from results by default, but querying still works
   - When clearing fields (setting to undefined), Mongoose handles it correctly

5. **Validate Token** (Lines 154-156)
   - If user not found: Token is invalid or expired
   - Returns 400 error: "Invalid or expired token"

6. **Update Password** (Lines 158-161)
   ```javascript
   user.password = password;
   user.passwordResetToken = undefined;
   user.passwordResetExpires = undefined;
   await user.save();
   ```
   - Sets new password (will be hashed by pre-save hook)
   - Clears reset token and expiration
   - Saves user document
   - **Password Hashing**: User model's `pre('save')` hook automatically hashes password using bcrypt

7. **Return Success** (Line 163)
   - Returns 200 status with success message

### Step 5: User Redirected to Login
**Location**: `frontend/src/users/pages/ResetPassword.jsx` (Line 48)

- After successful reset, user is redirected to `/signin`
- Success toast message is displayed

---

## Security Features

### 1. Token Hashing
- **Plain token** is sent in email (user-friendly)
- **Hashed token** is stored in database (secure)
- Uses SHA-256 hashing algorithm
- Even if database is compromised, tokens cannot be used directly

### 2. Token Expiration
- Tokens expire after **15 minutes**
- Prevents long-term token reuse
- Expired tokens are automatically rejected

### 3. One-Time Use
- Token is cleared after successful password reset
- Prevents token reuse even if not expired

### 4. Email Enumeration Protection
- Always returns success message regardless of email existence
- Prevents attackers from discovering registered emails
- Message: "If an account exists, password reset instructions were sent"

### 5. Secure Token Generation
- Uses `crypto.randomBytes(32)` for cryptographically secure random tokens
- 32 bytes = 64 hex characters = very high entropy
- Extremely difficult to guess or brute force

### 6. Password Validation
- Minimum 6 characters required
- Password is automatically hashed using bcrypt before storage
- Uses salt rounds (10) for additional security

### 7. Database Field Exclusion
- Reset token fields are excluded from default queries (`select: false`)
- Prevents accidental exposure in API responses
- Must explicitly select these fields when needed

---

## File Structure

### Backend Files
```
backend/
├── controller/
│   └── authController.js          # forgotPassword & resetPassword functions
├── routes/
│   └── auth.js                    # Route definitions
├── models/
│   └── User.js                    # User schema with reset token fields
└── utils/
    ├── emailService.js            # Email sending functionality
    └── emailTemplates/
        └── passwordReset.js       # Email template for reset link
```

### Frontend Files
```
frontend/src/
├── users/
│   └── pages/
│       ├── ForgotPassword.jsx     # Forgot password form
│       └── ResetPassword.jsx      # Reset password form
└── App.jsx                        # Route definitions
```

---

## API Endpoints

### 1. Forgot Password
**Endpoint**: `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "message": "If an account exists, password reset instructions were sent"
}
```

**Response (Error):**
```json
{
  "message": "Email is required"
}
```
or
```json
{
  "message": "Unable to send reset email right now"
}
```

### 2. Reset Password
**Endpoint**: `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "abc123...",
  "email": "user@example.com",
  "password": "newPassword123"
}
```

**Response (Success):**
```json
{
  "message": "Password reset successful"
}
```

**Response (Error):**
```json
{
  "message": "Token, email and password are required"
}
```
or
```json
{
  "message": "Invalid or expired token"
}
```

---

## Frontend Routes

### Route Definitions (App.jsx)
```javascript
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

### Route Access
- Both routes are **public** (no authentication required)
- Accessible to anyone with the reset link

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORGOT PASSWORD FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. User visits /forgot-password
   ↓
2. User enters email and submits
   ↓
3. Frontend: POST /api/auth/forgot-password
   ↓
4. Backend: Find user by email
   ↓
5. Backend: Generate 32-byte random token
   ↓
6. Backend: Hash token with SHA-256
   ↓
7. Backend: Store hashed token + expiration (15 min) in DB
   ↓
8. Backend: Generate reset link with plain token
   ↓
9. Backend: Send email with reset link
   ↓
10. User receives email with reset link
    ↓
11. User clicks reset link
    ↓
12. Browser navigates to /reset-password?token=...&email=...
    ↓
13. Frontend: Extract token and email from URL
    ↓
14. Frontend: Show password reset form
    ↓
15. User enters new password and confirms
    ↓
16. Frontend: Validate passwords match
    ↓
17. Frontend: POST /api/auth/reset-password
    ↓
18. Backend: Hash token from request
    ↓
19. Backend: Find user with matching email + hashed token + valid expiration
    ↓
20. Backend: Validate token is valid and not expired
    ↓
21. Backend: Update password (auto-hashed by pre-save hook)
    ↓
22. Backend: Clear reset token and expiration
    ↓
23. Backend: Return success
    ↓
24. Frontend: Show success message
    ↓
25. Frontend: Redirect to /signin
    ↓
26. User can now login with new password
```

---

## Step-by-Step Detailed Process

### Phase 1: Forgot Password Request

**Step 1.1: User Action**
- User clicks "Forgot Password" link on login page
- Navigates to `/forgot-password` route

**Step 1.2: Frontend Form Submission**
- User enters email address
- Clicks "Send Reset Link" button
- Frontend validates email format
- Sends POST request to backend

**Step 1.3: Backend Processing**
1. Validates email is provided
2. Searches for user in database
3. **Security**: Returns success even if user doesn't exist
4. If user exists:
   - Generates cryptographically secure random token (32 bytes)
   - Hashes token using SHA-256
   - Stores hashed token in `user.passwordResetToken`
   - Sets expiration: `Date.now() + (15 * 60 * 1000)` (15 minutes)
   - Saves user document
   - Generates reset URL with plain token
   - Sends email with reset link
   - Returns success message

**Step 1.4: Email Delivery**
- Email service (Nodemailer) sends email
- Email contains personalized message and reset button
- Reset link format: `/reset-password?token={plainToken}&email={email}`

### Phase 2: Password Reset

**Step 2.1: User Clicks Email Link**
- User clicks "Reset Password" button in email
- Browser navigates to reset password page with query parameters

**Step 2.2: Frontend URL Parsing**
- React Router extracts `token` and `email` from URL query string
- Validates both parameters are present
- If missing: Shows error and "Request New Link" option
- If present: Shows password reset form

**Step 2.3: User Enters New Password**
- User enters new password (min 6 characters)
- User confirms password
- Frontend validates:
  - Passwords match
  - Minimum length requirement
  - Token and email are present

**Step 2.4: Backend Validation**
1. Receives token, email, and new password
2. Validates all fields are provided
3. Hashes the plain token from request
4. Queries database for user with:
   - Matching email
   - Matching hashed token
   - Token expiration > current time
5. If user found:
   - Updates password field
   - Clears `passwordResetToken`
   - Clears `passwordResetExpires`
   - Saves user (password auto-hashed by pre-save hook)
   - Returns success
6. If user not found:
   - Returns error: "Invalid or expired token"

**Step 2.5: Password Hashing**
- User model's `pre('save')` hook intercepts save operation
- Checks if password field was modified
- If modified:
  - Generates bcrypt salt (10 rounds)
  - Hashes password with bcrypt
  - Stores hashed password in database

**Step 2.6: User Redirect**
- Frontend receives success response
- Shows success toast message
- Redirects user to `/signin` page
- User can now login with new password

---

## Important Notes

### Token Security
- **Never store plain tokens in database** - Always hash them
- **Plain token** is only sent in email and URL
- **Hashed token** is stored in database for comparison
- Tokens are single-use and time-limited

### Error Handling
- Email sending failures: Token is cleared from database
- Invalid tokens: User sees clear error message
- Expired tokens: User must request new reset link
- Missing parameters: Frontend validates before submission

### Password Hashing
- Passwords are **never** stored in plain text
- Bcrypt is used with 10 salt rounds
- Hashing happens automatically via Mongoose pre-save hook
- Original password cannot be recovered (one-way hash)

### Environment Variables
- `FRONTEND_URL`: Used to generate reset links (defaults to localhost:5173)
- `EMAIL_USER`: Gmail account for sending emails
- `EMAIL_PASS`: Gmail app password for authentication

---

## Testing the Flow

### Test Scenario 1: Valid Reset
1. Go to `/forgot-password`
2. Enter registered email
3. Check email inbox
4. Click reset link
5. Enter new password
6. Confirm password
7. Submit form
8. Should redirect to login page

### Test Scenario 2: Invalid Email
1. Go to `/forgot-password`
2. Enter non-existent email
3. Should still show success message (security feature)
4. No email will be sent

### Test Scenario 3: Expired Token
1. Request password reset
2. Wait 16+ minutes
3. Click reset link
4. Should show "Invalid or expired token" error

### Test Scenario 4: Invalid Token
1. Request password reset
2. Modify token in URL
3. Try to reset password
4. Should show "Invalid or expired token" error

---

## Troubleshooting

### Issue: Email not received
- Check spam folder
- Verify email service credentials (EMAIL_USER, EMAIL_PASS)
- Check server logs for email errors
- Verify frontend URL is correct in environment variables

### Issue: Token always invalid
- Check if token expiration is set correctly
- Verify token hashing matches (SHA-256)
- Ensure database query includes reset token fields
- Check server time is synchronized

### Issue: Password not updating
- Verify pre-save hook is working
- Check password validation rules
- Ensure user document is being saved
- Check for database connection issues

---

## Security Best Practices Implemented

✅ **Token Hashing**: SHA-256 hashing before storage
✅ **Token Expiration**: 15-minute time limit
✅ **One-Time Use**: Token cleared after use
✅ **Email Enumeration Protection**: Generic success messages
✅ **Secure Token Generation**: Crypto.randomBytes()
✅ **Password Hashing**: Bcrypt with salt
✅ **Field Exclusion**: Sensitive fields not in default queries
✅ **Input Validation**: All inputs validated
✅ **Error Handling**: Secure error messages
✅ **HTTPS Recommended**: For production (not enforced in code)

---

## Conclusion

The password reset functionality is a secure, token-based system that:
- Protects user accounts with time-limited, single-use tokens
- Prevents email enumeration attacks
- Uses industry-standard security practices
- Provides a smooth user experience
- Handles errors gracefully

The system follows security best practices and is production-ready with proper environment configuration.

---

**Last Updated**: {Current Date}
**Version**: 1.0
**Author**: System Documentation

