# JWT Authentication in Guest House Booking System

## What is JWT?

JWT stands for **JSON Web Token**. Think of it like a **temporary ID card** that proves who you are after you log in. Instead of typing your username and password every time, the server gives you this token, and you show it every time you want to do something that requires you to be logged in.

---

## How JWT Works in Our Project (Simple Explanation)

### The Big Picture

1. **User logs in** → Server checks if email/password is correct
2. **If correct** → Server creates a JWT token and gives it to the user
3. **User stores the token** → Saves it in browser's localStorage
4. **For every request** → User sends the token to prove who they are
5. **Server checks the token** → If valid, allows the request; if not, denies it

---

## Step-by-Step Flow

### 1. **User Registration / Sign Up**

When a new user signs up:

```
User fills signup form → Backend creates user account → Backend generates JWT token → 
Token is sent back to user → User saves token in browser
```

**Code Location:**
- Frontend: `frontend/src/users/pages/Signup.jsx`
- Backend: `backend/controller/authController.js` → `registerUser` function

**What happens:**
- User enters: First Name, Last Name, Email, Phone, Address, Password
- Backend saves the user (password is automatically hashed for security)
- Backend creates a JWT token using the user's ID, email, and role
- Token is sent back along with user data
- Frontend saves token in `localStorage` for future use

---

### 2. **User Login**

When an existing user logs in:

```
User enters email/password → Backend checks credentials → 
If correct, generates JWT token → Token sent to user → User saves token
```

**Code Location:**
- Frontend: `frontend/src/users/pages/Login.jsx`
- Backend: `backend/controller/authController.js` → `loginUser` function

**What happens:**
- User enters email and password
- Backend finds user by email
- Backend checks if user is active (not deactivated)
- Backend compares password (using bcrypt for security)
- If everything matches, backend creates a JWT token
- Token contains: User ID, Email, and Role (user/admin)
- Frontend receives token and saves it in `localStorage`

**Important:** The password is NEVER sent back or stored in the token - only user info!

---

### 3. **Token Generation (Backend)**

The backend creates the token using a secret key:

**Code Location:** `backend/utils/jwt.js`

```javascript
generateToken(user) {
  Creates token with:
    - User ID
    - User Email  
    - User Role (user/admin)
    - Secret Key (from .env file)
    - Expiration Time (from .env file)
}
```

**What's inside the token:**
- User's unique ID
- User's email address
- User's role (regular user or admin)
- Expiration time (when the token stops working)

**Security:**
- Only the server knows the secret key
- No one can fake a token without the secret key
- Token expires after a set time (prevents old tokens from being used forever)

---

### 4. **Token Storage (Frontend)**

After login, the token is stored in the browser:

**Code Location:** `frontend/src/users/pages/Login.jsx`

```javascript
localStorage.setItem("token", res.data.token);
localStorage.setItem("user", JSON.stringify(res.data.user));
```

**What is localStorage?**
- It's like a small storage box in your browser
- Data stays there even if you close the browser
- Each website has its own localStorage

**What gets stored:**
- **Token**: The JWT token (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- **User**: User information (name, email, role, etc.)

---

### 5. **Protected Routes (Frontend)**

Some pages require you to be logged in. The app checks for token:

**Code Location:**
- Regular users: `frontend/src/users/routes/ProtectedRoute.jsx`
- Admin users: `frontend/src/admin/routes/ProtectedAdminRoute.jsx`

**How it works:**
```javascript
Check localStorage for token
  → If token exists → Allow access to page
  → If no token → Redirect to login page
```

**For Admin pages:**
```javascript
Check localStorage for token AND user role
  → If token exists AND role is "admin" → Allow access
  → Otherwise → Redirect to home page
```

**Example:**
- User tries to visit `/dashboard`
- ProtectedRoute checks: "Do you have a token?"
- No token? → Redirects to `/signin`
- Has token? → Shows dashboard

---

### 6. **Using Token for API Requests**

When the user wants to do something (like view bookings, update profile, etc.):

**How it works:**
- Frontend gets the token from localStorage
- Frontend sends the token with every request
- Backend receives the token and verifies it
- If valid → Process the request
- If invalid/expired → Reject the request

**Currently in our project:**
- The frontend stores the token
- Each API request can include the token in headers (if needed)
- The backend can verify tokens using the `verifyToken` function

**Future Enhancement:**
- Add middleware to automatically attach token to all requests
- Add middleware on backend to verify token on protected routes

---

### 7. **Token Verification (Backend)**

The backend can verify if a token is valid:

**Code Location:** `backend/utils/jwt.js`

```javascript
verifyToken(token) {
  Uses secret key to check:
    - Is token properly signed? (not tampered with)
    - Is token expired?
    - Returns user info if valid
    - Throws error if invalid
}
```

**What happens:**
- Server receives a token from the frontend
- Server uses the secret key to "decode" the token
- If the signature matches → Token is valid
- If expired or invalid → Returns error

---

### 8. **Logout**

When user clicks logout:

**Code Location:** `frontend/src/components/Navbar.jsx`

```javascript
Remove token from localStorage
Remove user data from localStorage
Redirect to home page
```

**What happens:**
- Token is deleted from localStorage
- User data is deleted from localStorage
- User is redirected to home page
- User must log in again to access protected pages

---

## Token Structure

A JWT token has three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Part 1 (Header):** How the token is encrypted
**Part 2 (Payload):** User information (ID, email, role, expiration)
**Part 3 (Signature):** Proof that token is authentic (created by server)

**Note:** The payload can be decoded by anyone (it's not encrypted, just signed), but only the server can create a valid signature.

---

## Security Features

### 1. **Password Hashing**
- Passwords are NEVER stored as plain text
- They're hashed using bcrypt before saving
- Even if database is hacked, passwords can't be read

### 2. **Token Expiration**
- Tokens expire after a certain time (set in `.env` file)
- User must log in again after expiration
- Prevents old tokens from being used forever

### 3. **Secret Key**
- Only the server knows the secret key
- Without it, no one can create valid tokens
- Secret key is stored in `.env` file (never commit to git!)

### 4. **User Status Check**
- Even with a valid token, inactive users are blocked
- Admin can deactivate users, preventing login

---

## Environment Variables

These settings control JWT behavior (in `.env` file):

```env
JWT_SECRET=your-secret-key-here  # Secret key to sign tokens
JWT_EXPIRES_IN=7d                # How long token is valid (e.g., 7 days)
```

**Important:** 
- Change `JWT_SECRET` to something random and secret
- Never share or commit your secret key
- Different environments (dev/prod) should have different keys

---

## Current Implementation Status

### ✅ What's Working:
- Token generation on login/registration
- Token storage in localStorage
- Protected routes check for token
- Admin routes check for role
- Token verification function exists

### 🔄 Can Be Enhanced:
- Add middleware to automatically verify tokens on backend routes
- Add automatic token refresh before expiration
- Add token in Authorization header for all API requests
- Add logout endpoint on backend to invalidate tokens

---

## Real-World Analogy

Think of JWT like a **wristband at a festival**:

1. **Entry (Login):** You show your ID, they verify it, and give you a wristband
2. **Wristband (Token):** You wear it all day - it proves you're allowed to be there
3. **Access (Protected Pages):** Guards check your wristband before letting you into VIP areas
4. **Expiration:** The wristband expires at the end of the day - you need a new one tomorrow
5. **Exit (Logout):** You remove the wristband when you leave

In our app:
- **Entry = Login** (server verifies credentials)
- **Wristband = JWT Token** (proves you're authenticated)
- **Guards = Protected Routes** (check token before allowing access)
- **VIP Areas = Admin Pages** (check role in addition to token)

---

## Key Files Reference

### Backend:
- `backend/utils/jwt.js` - Token generation and verification
- `backend/controller/authController.js` - Login, signup, password reset
- `.env` - JWT_SECRET and JWT_EXPIRES_IN configuration

### Frontend:
- `frontend/src/users/pages/Login.jsx` - Login page (stores token)
- `frontend/src/users/pages/Signup.jsx` - Signup page (stores token)
- `frontend/src/users/routes/ProtectedRoute.jsx` - Regular user protection
- `frontend/src/admin/routes/ProtectedAdminRoute.jsx` - Admin protection
- `frontend/src/components/Navbar.jsx` - Logout functionality

---

## Summary

**JWT Authentication is like having a temporary pass:**

1. ✅ You prove who you are once (login)
2. ✅ You get a token (temporary pass)
3. ✅ You show the token when needed (accessing pages)
4. ✅ Server checks if token is valid (gatekeeper)
5. ✅ Token expires after some time (security)
6. ✅ You can get a new token by logging in again

This way, you don't need to enter your password every single time, but you're still secure because the token can expire and can't be easily faked!

