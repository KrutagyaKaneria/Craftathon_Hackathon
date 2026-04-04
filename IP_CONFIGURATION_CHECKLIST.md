# IP Configuration Checklist - DriveGuard System

**Machine IP:** `10.145.246.155`  
**Date Configured:** $(date)  
**Status:** ✅ COMPLETE

---

## Configuration Files Updated ✅

- [x] **Backend .env** (`Native/backend/.env`)
  - ✅ Added 10.145.246.155:5173 to CORS_ORIGIN
  - ✅ Added 10.145.246.155:3000 to CORS_ORIGIN
  - Port: 5000

- [x] **Backend CORS Code** (`Native/backend/src/server.js`)
  - ✅ Added `origin.includes('10.')` check
  - ✅ Allows all 10.x.x.x network addresses
  - Development mode: enabled

- [x] **Web App Frontend .env** (`web-app/frontend/.env`) - CREATED
  - ✅ VITE_API_URL=http://10.145.246.155:5000/api
  - ✅ VITE_AI_SERVICE_URL=http://10.145.246.155:8000
  - ✅ Includes documentation for finding IP

- [x] **Web App Frontend API** (`web-app/frontend/src/services/api.js`)
  - ✅ Updated to use import.meta.env.VITE_API_URL
  - ✅ Updated to use import.meta.env.VITE_AI_SERVICE_URL
  - ✅ Includes fallback values

- [x] **Native App .env** (`Native/DriveGuard/.env`)
  - ✅ EXPO_PUBLIC_API_URL=http://10.145.246.155:5000
  - No changes needed (already set)

- [x] **AI Service .env** (`web-app/ai-service/.env`)
  - ✅ BACKEND_URL=http://10.145.246.155:5000/api
  - Changed from localhost:5000

---

## Service Endpoints

### Backend
- **URL:** http://10.145.246.155:5000
- **Health Check:** http://10.145.246.155:5000/api/health
- **CORS Allowed Origins:**
  - http://localhost:8081 ✅
  - http://localhost:3000 ✅
  - exp://localhost:8081 ✅
  - http://10.145.246.155:5173 ✅
  - http://10.145.246.155:3000 ✅
  - All 10.x.x.x addresses ✅

### AI Service
- **URL:** http://10.145.246.155:8000
- **Backend Integration:** http://10.145.246.155:5000/api

### Web App Frontend
- **Dev Server:** http://localhost:5173 or http://10.145.246.155:5173
- **API Endpoint:** http://10.145.246.155:5000/api

### Native App
- **Backend:** http://10.145.246.155:5000

---

## Pre-Start Verification

Before running services, verify:

- [ ] Machine IP is `10.145.246.155`
  ```powershell
  ipconfig | Select-String -Pattern "IPv4 Address"
  ```

- [ ] All .env files exist:
  ```powershell
  Test-Path "Native/backend/.env"
  Test-Path "web-app/frontend/.env"
  Test-Path "web-app/ai-service/.env"
  Test-Path "Native/DriveGuard/.env"
  ```

- [ ] MongoDB connection string is valid in `Native/backend/.env`
  ```powershell
  grep "MONGODB_URI" Native/backend/.env
  ```

- [ ] Backend can start without errors:
  ```powershell
  cd Native/backend
  npm start
  # Should show: "🚀 Server running on http://10.145.246.155:5000"
  ```

---

## Startup Sequence

### 1. Start Backend (Required for all other services)
```powershell
cd Native/backend
npm start
# Expected: Server running on port 5000, MongoDB connected ✅
```

### 2. Start AI Service (Optional if using ML features)
```powershell
cd web-app/ai-service
# Start according to service's instructions
# Expected: Service running on port 8000, backend connected ✅
```

### 3. Start Web App Frontend
```powershell
cd web-app/frontend
npm run dev
# Expected: Vite dev server running on 5173, API calls to 10.145.246.155:5000 ✅
```

### 4. Start Native App (Expo)
```powershell
cd Native/DriveGuard
npx expo start -p 8081
# Expected: Expo server running, API calls to 10.145.246.155:5000 ✅
```

---

## API Connectivity Tests

### Test 1: Backend Health Check
```powershell
# Verify backend is running and responding
curl -X GET "http://10.145.246.155:5000/api/health"

# Expected response:
# {"status":"Backend is running","timestamp":"2024-..."}
```

### Test 2: Web App Frontend Connection
```
1. Open http://10.145.246.155:3000 in browser
2. Press F12 to open DevTools
3. Go to Network tab
4. Load a page or trigger API call
5. Verify all requests use http://10.145.246.155:5000/api
6. No CORS errors should appear
```

### Test 3: Native App Connection
```
1. Open Expo console logs
2. Look for API calls to 10.145.246.155:5000
3. No connection errors should appear
4. Should see successful responses from backend
```

### Test 4: AI Service Backend Connection
```powershell
# Check AI service logs verify it connected to backend
# Expected: Connected to http://10.145.246.155:5000/api
```

---

## Environment Variable Reference

| Variable | Location | Value | Purpose |
|----------|----------|-------|---------|
| `VITE_API_URL` | web-app/frontend/.env | http://10.145.246.155:5000/api | Frontend → Backend |
| `VITE_AI_SERVICE_URL` | web-app/frontend/.env | http://10.145.246.155:8000 | Frontend → AI Service |
| `EXPO_PUBLIC_API_URL` | Native/DriveGuard/.env | http://10.145.246.155:5000 | Native → Backend |
| `BACKEND_URL` | web-app/ai-service/.env | http://10.145.246.155:5000/api | AI Service → Backend |
| `CORS_ORIGIN` | Native/backend/.env | Multiple origins | Backend CORS allowing |
| `PORT` | Native/backend/.env | 5000 | Backend HTTP Port |
| `NODE_ENV` | Native/backend/.env | development | Development mode |

---

## Troubleshooting Quick Reference

| Issue | Check | Fix |
|-------|-------|-----|
| "Could not connect to backend" | Machine IP = 10.145.246.155? | Run `ipconfig` and update .env files if IP changed |
| "CORS Error" | Backend CORS config includes 10.? | Verify `origin.includes('10.')` is in server.js |
| "localhost refused" | Frontend still using localhost? | Check api.js uses environment variables |
| "Network timeout" | Backend running? | Start backend with `npm start` in Native/backend |
| "No API response" | Health check works? | Test `http://10.145.246.155:5000/api/health` |
| "Wrong IP showing" | Machine network changed? | Update all .env files with new IP |

---

## Documentation Files

Created/Updated:
- ✅ **IP_CONFIGURATION_GUIDE.md** - Comprehensive guide with all endpoints and setup
- ✅ **IP_CONFIGURATION_CHECKLIST.md** - This file, verification checklist

Related Documentation:
- `STARTUP_GUIDE.md` - General startup guide
- `INTEGRATION_GUIDE.md` - Service integration details
- `ROUTE_DOCUMENTATION.md` - API route documentation

---

## Configuration Complete ✅

All services are now configured for cross-machine communication using IP `10.145.246.155`.

**To use in production with different machine IP:**
1. Update all .env files with new IP address
2. Update backend CORS configuration if needed
3. Restart all services

**No need to modify code** - all services use environment variables for configuration.

---

**Last Updated:** $(date)  
**Configuration Status:** ✅ READY FOR TESTING  
**Next Step:** Start services in order above and verify connectivity
