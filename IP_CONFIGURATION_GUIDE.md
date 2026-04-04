# IP Configuration Guide for DriveGuard System

## Current Network Configuration

**Machine IP Address:** `10.145.246.155`

### Service Configuration Map

| Service | URL | Port | Role |
|---------|-----|------|------|
| **Backend API** | `10.145.246.155` | 5000 | Express server with all routes |
| **AI Service** | `10.145.246.155` | 8000 | Python ML service for alert detection |
| **Web App Frontend** | Any IP | 5173 | Vite dev server (connects to backend) |
| **Native App** | Any device/simulator | N/A | React Native (connects to backend) |

---

## Files Updated in This Configuration

### 1. **Backend - .env File**
**Location:** `Native/backend/.env`

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,http://localhost:3000,exp://localhost:8081,http://10.145.246.155:5173,http://10.145.246.155:3000
```

**Changes:**
- Added `http://10.145.246.155:5173` (Vite web app dev server)
- Added `http://10.145.246.155:3000` (alternative dev ports)

### 2. **Backend - server.js (CORS)**
**Location:** `Native/backend/src/server.js`

```javascript
// Updated CORS configuration to allow network IPs
const isLocal = origin.includes('localhost') || 
                origin.includes('127.0.0.1') || 
                origin.includes('192.168.') ||
                origin.includes('10.');  // ✅ Added network IP range
```

**Changes:**
- Added check for `10.` prefix to allow all 10.x.x.x network addresses
- Maintains backward compatibility with localhost and 192.168.x.x

### 3. **Web App Frontend - .env**
**Location:** `web-app/frontend/.env` (Created)

```env
# Backend API Configuration
VITE_API_URL=http://10.145.246.155:5000/api
VITE_AI_SERVICE_URL=http://10.145.246.155:8000

# How to find your IP on different systems:
# Windows: Run 'ipconfig' in PowerShell, look for IPv4 Address
# Mac/Linux: Run 'ifconfig' or 'ip addr', look for inet address in the network range 10.x or 192.168.x
```

### 4. **Web App Frontend - api.js**
**Location:** `web-app/frontend/src/services/api.js`

```javascript
// Now uses environment variables with fallback
const BACKEND_IP = import.meta.env.VITE_API_URL || '10.145.246.155:5000/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://10.145.246.155:8000';

const backendApi = axios.create({
  baseURL: BACKEND_IP,
});

const aiApi = axios.create({
  baseURL: AI_SERVICE_URL,
});
```

### 5. **Native App - .env**
**Location:** `Native/DriveGuard/.env`

```env
EXPO_PUBLIC_API_URL=http://10.145.246.155:5000
```

### 6. **AI Service - .env**
**Location:** `web-app/ai-service/.env`

```env
# Backend Integration
BACKEND_URL=http://10.145.246.155:5000/api
```

**Changes:**
- Updated from `localhost:5000` to `10.145.246.155:5000`

---

## How to Verify Configuration

### 1. **Check Backend is Running**
```powershell
# From Native/backend directory
npm start

# Expected output:
# 🚀 Server running on http://10.145.246.155:5000
# ✅ MongoDB connected
```

### 2. **Test Health Check Endpoint**
```bash
# From any terminal/browser
curl http://10.145.246.155:5000/api/health

# Expected response:
# {"status": "Backend is running", "timestamp": "2024-..."}
```

### 3. **Check Web App Frontend Connection**
- Start web app: `npm run dev` in `web-app/frontend/`
- Open browser DevTools (F12)
- Go to Network tab
- Perform any API call (login, fetch drivers, etc.)
- Verify requests go to `http://10.145.246.155:5000/api`
- No CORS errors or "localhost refused" errors

### 4. **Check Native App Connection**
- Look at Expo console output during startup
- API calls should show requests to `10.145.246.155:5000`
- No network timeout or connection refused errors

### 5. **Test API Endpoints**
```powershell
# Get all owners
$headers = @{Authorization="Bearer YOUR_JWT_TOKEN"}
Invoke-WebRequest -Uri "http://10.145.246.155:5000/api/owners" -Headers $headers

# Get drivers
Invoke-WebRequest -Uri "http://10.145.246.155:5000/api/drivers" -Headers $headers -Method GET
```

---

## How to Change IP Address

**If you need to change the IP (e.g., network reconnection, different machine):**

1. **Find your new IP:**
   ```powershell
   ipconfig | Select-String -Pattern "IPv4 Address"
   ```

2. **Update all configuration files:**
   - `Native/backend/.env` - Update `CORS_ORIGIN`
   - `web-app/frontend/.env` - Update `VITE_API_URL` and `VITE_AI_SERVICE_URL`
   - `web-app/ai-service/.env` - Update `BACKEND_URL`
   - `Native/DriveGuard/.env` - Update `EXPO_PUBLIC_API_URL`

3. **Restart all services:**
   - Restart backend
   - Refresh web app (`npm run dev`)
   - Restart native app (rebuild in Expo)

---

## Common Issues & Solutions

### Issue 1: "Failed to fetch from http://localhost:5000"
**Cause:** Hardcoded `localhost` is still being used  
**Solution:** Verify `.env` files are in correct location and saving properly  
**Action:**
```powershell
# Check frontend .env
cat web-app/frontend/.env

# Verify it contains:
# VITE_API_URL=http://10.145.246.155:5000/api
```

### Issue 2: "CORS Error - Origin not allowed"
**Cause:** API calls from unexpected IP  
**Solution:** Add origin to backend `.env` CORS_ORIGIN or check `10.` is in server.js  
**Action:**
```powershell
# Verify backend server.js has 10. check
grep "origin.includes('10.')" Native/backend/src/server.js
```

### Issue 3: "Connection refused 10.145.246.155:5000"
**Cause:** Backend not running or IP has changed  
**Solution:** Check backend is running and IP is current  
**Action:**
```powershell
ipconfig | Select-String -Pattern "IPv4 Address"  # Check current IP
npm start                                          # Start backend if not running
```

### Issue 4: "AI Service can't connect to backend"
**Cause:** AI service still using `localhost`  
**Solution:** Update `web-app/ai-service/.env`  
**Action:**
```powershell
cat web-app/ai-service/.env | grep BACKEND_URL
# Should show: BACKEND_URL=http://10.145.246.155:5000/api
```

---

## Environment Variables Summary

### Frontend Environment Variables

**Location:** `web-app/frontend/.env`

```env
# Primary configuration
VITE_API_URL=http://10.145.246.155:5000/api
VITE_AI_SERVICE_URL=http://10.145.246.155:8000
```

**How they're used:**
```javascript
// In api.js
const BACKEND_IP = import.meta.env.VITE_API_URL || '10.145.246.155:5000/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://10.145.246.155:8000';
```

### Backend Environment Variables

**Location:** `Native/backend/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CORS_ORIGIN=http://localhost:8081,http://localhost:3000,exp://localhost:8081,http://10.145.246.155:5173,http://10.145.246.155:3000
```

### Native App Environment Variables

**Location:** `Native/DriveGuard/.env`

```env
EXPO_PUBLIC_API_URL=http://10.145.246.155:5000
```

### AI Service Environment Variables

**Location:** `web-app/ai-service/.env`

```env
BACKEND_URL=http://10.145.246.155:5000/api
MONGODB_URI=mongodb://localhost:27017/driver_safety
```

---

## Quick Reference: Services & Ports

```
┌─────────────────────────────────────────────────────┐
│ DriveGuard System Services Configuration            │
├─────────────────────────────────────────────────────┤
│ Backend API        │ 10.145.246.155:5000            │
│ AI Service         │ 10.145.246.155:8000            │
│ MongoDB            │ Cloud (Atlas)                  │
│                    │                                │
│ Web App Frontend   │ localhost:5173 (dev)           │
│ Native App         │ Expo (any device)              │
│ Browser            │ http://10.145.246.155:3000     │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Verify backend starts successfully
2. ✅ Test health endpoint responds
3. ✅ Start web app frontend and check Network tab
4. ✅ Start native app and verify connection
5. ✅ Run test API calls with curl or Postman
6. ✅ Seed test data (vehicles, alerts, drivers)

---

## Support

**All configuration is now centralized and environment-aware:**
- ✅ Environment variables used (`.env` files)
- ✅ Fallback values provided (for when .env not found)
- ✅ CORS properly configured for network access
- ✅ Cross-machine communication enabled

If issues persist, check console logs for detailed error messages.
