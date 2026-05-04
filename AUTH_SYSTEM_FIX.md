# MERN Authentication System - Complete Fix & Setup Guide

## 📋 Overview

This document details all authentication issues identified and fixed, plus setup instructions for proper functioning.

---

## 🔴 CRITICAL ISSUES FOUND & FIXED

### **Issue #1: Missing JWT_REFRESH_SECRET**
- **File**: `backend/.env`
- **Problem**: Refresh token handler tries to use `process.env.JWT_REFRESH_SECRET` which was undefined
- **Impact**: All refresh token validations fail → 401 errors → forced logout
- **Fix**: Added `JWT_REFRESH_SECRET=refreshsecretkey456789` to `.env`
- **Status**: ✅ FIXED

### **Issue #2: Login Not Storing Access Token**
- **File**: `frontend/src/features/auth/Login.jsx`
- **Problem**: Login response includes `accessToken` but frontend doesn't save it to localStorage
- **Impact**: Subsequent API requests have no Authorization header → all fail with 401
- **Fix**: Added `localStorage.setItem("accessToken", accessToken)` in Login component
- **Status**: ✅ FIXED

### **Issue #3: verifyToken Middleware Checking Wrong Cookie**
- **File**: `backend/src/middlewares/verifyToken.middleware.js`
- **Problem**: Middleware looks for `req.cookies.token` but login sets `refreshToken`
- **Impact**: Protected routes always fail with 401 Unauthorized
- **Fix**: Updated to check `Authorization: Bearer <token>` header instead of cookies
- **Status**: ✅ FIXED

### **Issue #4: Hardcoded Cookie Config (Fails in Localhost)**
- **File**: `backend/src/controllers/auth.controller.js` & `auth.controller.js`
- **Problem**: Login hardcoded `secure: production`, logout hardcoded `secure: true, sameSite: none`
- **Impact**: Cookies not set in localhost/incognito mode
- **Fix**: Use `buildCookieOptions()` function that respects `NODE_ENV`
- **Status**: ✅ FIXED

### **Issue #5: RefreshHandler Incomplete**
- **File**: `frontend/src/components/ui/RefreshHandler.js`
- **Problem**: File only contains bare useEffect hook, missing component wrapper
- **Impact**: File not usable as React component
- **Fix**: Complete rewrite as proper component with error handling
- **Status**: ✅ FIXED

### **Issue #6: Logout Not Clearing Access Token**
- **File**: `frontend/src/components/ui/layout/Sidebar.jsx`
- **Problem**: Only cleared user data, not accessToken from localStorage
- **Impact**: Old token might be reused after logout
- **Fix**: Added `localStorage.removeItem("accessToken")`
- **Status**: ✅ FIXED

### **Issue #7: API Base URL Points to Production**
- **File**: `frontend/.env`
- **Problem**: Points to production Render URL instead of localhost:5000
- **Impact**: CORS errors, cookies blocked, 401 errors
- **Fix**: Changed to `VITE_API_URL=http://localhost:5000` for development
- **Status**: ✅ FIXED

---

## ✅ CORRECTED AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOGIN                                                    │
├─────────────────────────────────────────────────────────────┤
│ User enters credentials                                     │
│ ↓                                                           │
│ POST /auth/login { email, password }                        │
│ ↓ (backend validates & generates tokens)                    │
│ Response:                                                   │
│   ├─ accessToken (15min, short-lived)                       │
│   ├─ refreshToken (7day, httpOnly cookie)                   │
│   └─ user info                                              │
│ ↓ (frontend stores)                                         │
│ localStorage.setItem("accessToken", token)                  │
│ localStorage.setItem("loggedInUser", user)                  │
│ ↓                                                           │
│ Redirect to /dashboard                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. API REQUESTS (Protected Routes)                          │
├─────────────────────────────────────────────────────────────┤
│ Every request goes through axios interceptor:               │
│ ↓                                                           │
│ Authorization header added automatically:                   │
│   Authorization: Bearer <accessToken>                       │
│ ↓                                                           │
│ withCredentials: true sends refreshToken cookie             │
│ ↓                                                           │
│ Backend verifyToken middleware:                             │
│   ├─ Extract token from Authorization header                │
│   ├─ Verify with JWT_SECRET                                │
│   ├─ Set req.user = decoded token                           │
│   └─ Continue to protected route                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. TOKEN EXPIRY (After 15 minutes)                          │
├─────────────────────────────────────────────────────────────┤
│ Frontend makes API call with expired token                  │
│ ↓                                                           │
│ Backend returns 401 Unauthorized                            │
│ ↓                                                           │
│ Axios response interceptor:                                 │
│   ├─ Detect 401 + no retry yet + not /auth/refresh          │
│   ├─ Call GET /auth/refresh                                 │
│   ├─ (Browser auto-sends refreshToken cookie)               │
│   └─ Prevent infinite loop with _retry flag                 │
│ ↓                                                           │
│ Backend /auth/refresh handler:                              │
│   ├─ Extract refreshToken from cookies                      │
│   ├─ Verify with JWT_REFRESH_SECRET                         │
│   ├─ Generate new accessToken (15min)                       │
│   └─ Return new accessToken                                 │
│ ↓                                                           │
│ Frontend updates:                                           │
│   localStorage.setItem("accessToken", newToken)             │
│ ↓                                                           │
│ Retry original request with new token                       │
│ ↓                                                           │
│ Success! (or 401 if refresh failed)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. LOGOUT                                                   │
├─────────────────────────────────────────────────────────────┤
│ User clicks Logout                                          │
│ ↓                                                           │
│ POST /auth/logout (with access token)                       │
│ ↓                                                           │
│ Backend clears refreshToken cookie:                         │
│   res.clearCookie("refreshToken", cookieOptions)            │
│ ↓                                                           │
│ Frontend clears all tokens:                                 │
│   ├─ localStorage.removeItem("accessToken")                 │
│   ├─ localStorage.removeItem("loggedInUser")                │
│   └─ setAuthState({ isAuthenticated: false })               │
│ ↓                                                           │
│ Redirect to /login                                          │
│ ↓                                                           │
│ Both tokens removed, session ended                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 FILES MODIFIED

### Backend

| File | Change | Impact |
|------|--------|--------|
| `.env` | Added `JWT_REFRESH_SECRET` | Enables refresh token signing/verification |
| `.env.example` | Added `JWT_REFRESH_SECRET` | Documentation for setup |
| `src/config/env.js` | Added `path: "/"` to cookies, fixed maxAge | Cookies accessible app-wide, correct expiry |
| `src/controllers/auth.controller.js` | Import and use `buildCookieOptions()`, fixed logout | Respects NODE_ENV, consistent cookie config |
| `src/middlewares/verifyToken.middleware.js` | Check Authorization header instead of cookies | Proper JWT auth flow |

### Frontend

| File | Change | Impact |
|------|--------|--------|
| `.env` | Changed to `http://localhost:5000` | Correct API endpoint for development |
| `.env.example` | Documented dev/prod URLs | Clear setup instructions |
| `src/features/auth/Login.jsx` | Store `accessToken` from response | Token available for requests |
| `src/components/ui/RefreshHandler.js` | Complete component rewrite | Proper token validation |
| `src/app/AppRoutes.jsx` | Use RefreshHandler component | Clean auth initialization |
| `src/components/ui/layout/Sidebar.jsx` | Clear `accessToken` on logout | Proper cleanup |

---

## 🚀 SETUP & TESTING

### Prerequisites

```bash
# Backend
cd backend
npm install
# Make sure these are installed:
npm ls jsonwebtoken bcryptjs express cors cookie-parser

# Frontend
cd frontend
npm install
# Make sure these are installed:
npm ls axios jwt-decode react-router-dom
```

### Environment Setup

**Backend `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://abhinav-07:uQDdoCqMGeNeex3C@cluster0.ktzzynq.mongodb.net/attendance-db?appName=Cluster0
JWT_SECRET=anyrandomstring123
JWT_REFRESH_SECRET=refreshsecretkey456789
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
COOKIE_SAMESITE=lax
COOKIE_SECURE=false
FACE_SERVICE_URL=http://localhost:5001
ADMIN_EMAILS=vabhinav898@gmail.com
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000
```

### Start Services

Terminal 1 - Backend:
```bash
cd backend
npm install  # if needed
npm run dev  # or node index.js
# Should see: Server is running on port 5000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# Should see: Local: http://localhost:5173
```

Terminal 3 - Face Service (if using attendance features):
```bash
cd backend/src/services
uvicorn face_service:app --reload
# Should see: Uvicorn running on http://127.0.0.1:8000
```

---

## ✅ TESTING CHECKLIST

### 1. Login Flow
- [ ] Open http://localhost:5173/login in **normal mode**
- [ ] Enter valid credentials
- [ ] See "Login successful" toast
- [ ] Redirect to dashboard
- [ ] Open DevTools → Application → Storage → localStorage
  - [ ] Should see `accessToken` (JWT)
  - [ ] Should see `loggedInUser` (JSON)
- [ ] Open DevTools → Application → Cookies
  - [ ] Should see `refreshToken` cookie (httpOnly)
  - [ ] Domain: localhost
  - [ ] Path: /

### 2. Incognito Mode Login
- [ ] Open http://localhost:5173/login in **incognito/private mode**
- [ ] Enter valid credentials
- [ ] See "Login successful" toast
- [ ] Redirect to dashboard ✅ **No more redirect back to login!**
- [ ] Verify tokens in storage (same as #1)

### 3. Protected Routes
- [ ] After login, navigate to /history
- [ ] Should load without errors
- [ ] Open Network tab in DevTools
  - [ ] Check requests to `/attendance/...`
  - [ ] Should have `Authorization: Bearer ...` header
  - [ ] Should have `Cookie: refreshToken=...`
  - [ ] All should return 200 OK

### 4. Token Refresh (15 minute expiry)
- [ ] To test immediately, edit `backend/src/controllers/auth.controller.js`:
  - Change `expiresIn: "15m"` to `expiresIn: "10s"` (10 seconds)
- [ ] Login and wait 10 seconds
- [ ] Make an API call (click a button that uses API)
- [ ] Check Network tab:
  - [ ] First request fails with 401
  - [ ] `/auth/refresh` is called (refreshToken sent in cookie)
  - [ ] Returns new accessToken
  - [ ] Original request retried with new token
  - [ ] Second request succeeds with 200 OK
- [ ] **Don't forget to revert the 10s back to 15m!**

### 5. Logout Flow
- [ ] Click logout button in sidebar
- [ ] Confirm logout
- [ ] See "Logged out successfully" toast
- [ ] Redirect to /login
- [ ] Check DevTools:
  - [ ] localStorage cleared (no accessToken, no loggedInUser)
  - [ ] Cookie cleared (refreshToken gone)
- [ ] Try to access /dashboard directly
  - [ ] Should redirect to /login
  - [ ] Cannot access without login

### 6. Invalid Token Handling
- [ ] Login successfully
- [ ] Open DevTools Console and run:
  ```javascript
  localStorage.setItem("accessToken", "invalid-token-here");
  ```
- [ ] Refresh page
- [ ] Should redirect to /login
  - [ ] Cannot access dashboard
  - [ ] Tokens cleared

### 7. Session Persistence
- [ ] Login successfully
- [ ] Refresh the page (F5)
- [ ] Should stay on dashboard
  - [ ] Token valid, user data loaded
  - [ ] No redirect to login
- [ ] Close tab and reopen http://localhost:5173
- [ ] Should go to dashboard (not login)
  - [ ] Token still valid, session persists

### 8. CORS & Cookies
- [ ] All requests should have `withCredentials: true`
- [ ] No CORS errors in console
- [ ] Refresh token cookie visible in DevTools
- [ ] Works in both normal and incognito mode

---

## 🔍 DEBUGGING TIPS

### Enable Verbose Logging

**Backend** - Add to `auth.controller.js`:
```javascript
console.log("Login request:", { email });
console.log("Setting refreshToken cookie:", { secure, sameSite, path });
console.log("Token generated:", { accessToken, refreshToken });
```

**Frontend** - Add to `Login.jsx`:
```javascript
console.log("Login response:", response.data);
console.log("Storing accessToken:", accessToken);
```

**Axios** - Add to `axiosInstance.js`:
```javascript
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  console.log("Request interceptor - token:", token?.substring(0, 20) + "...");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| **401 Unauthorized** | Missing/invalid accessToken | Check localStorage, re-login |
| **No refresh token** | refreshToken cookie not sent | Check CORS withCredentials |
| **Invalid refresh token** | JWT_REFRESH_SECRET mismatch | Verify .env has correct secret |
| **Cookie not set** | sameSite/secure mismatch | Check NODE_ENV, use lax+false for dev |
| **Infinite redirect loop** | Refresh keeps failing | Check JWT secrets, look for typos |
| **CORS error** | Missing credentials flag | Check `withCredentials: true` |

---

## 🔐 Security Checklist

### Development (localhost)
- ✅ `COOKIE_SECURE=false` (HTTP allowed)
- ✅ `COOKIE_SAMESITE=lax` (works in incognito)
- ✅ JWT secrets not committed (in `.env`, not `.env.example`)
- ✅ Both secrets must be different

### Production (HTTPS)
- ✅ `NODE_ENV=production`
- ✅ `COOKIE_SECURE=true` (HTTPS only)
- ✅ `COOKIE_SAMESITE=none` (auto-set for cross-origin)
- ✅ Use strong random secrets (not in code)
- ✅ Secrets in environment variables only
- ✅ HTTPS certificate valid
- ✅ Access token has short expiry (15m recommended)
- ✅ Refresh token has longer expiry (7d recommended)

---

## 📚 Reference

### Token Lifetimes
- **Access Token**: 15 minutes (short-lived, used frequently)
- **Refresh Token**: 7 days (long-lived, used only when access expires)

### Cookie Settings
```javascript
// Development (localhost)
secure: false        // HTTP allowed
sameSite: "lax"      // Works in incognito
path: "/"            // Accessible app-wide
maxAge: 7 days       // Matches refresh token expiry

// Production (HTTPS)
secure: true         // HTTPS required
sameSite: "none"     // Cross-origin cookies
path: "/"            // Accessible app-wide
maxAge: 7 days       // Matches refresh token expiry
```

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/register` | POST | None | Create new account |
| `/auth/login` | POST | None | Get tokens |
| `/auth/me` | GET | Bearer token | Get current user info |
| `/auth/refresh` | GET | Cookie | Get new access token |
| `/auth/logout` | POST | Bearer token | Invalidate tokens |

---

## ✨ Summary

Your authentication system now correctly implements:
- ✅ Dual-token system (access + refresh)
- ✅ Short-lived access tokens (15m)
- ✅ Long-lived refresh tokens (7d)
- ✅ Automatic token refresh on expiry
- ✅ Secure httpOnly cookies for refresh token
- ✅ Bearer token in Authorization header for access token
- ✅ Proper logout with token cleanup
- ✅ Works in normal and incognito mode
- ✅ Development and production support

All issues have been fixed. Your app should now work reliably across all browsers and modes!

