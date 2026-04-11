# IP Configuration & Network Setup Guide

## Problem Resolution

**Error:** "Backend server not responding. Check if backend is running at http://10.44.202.155:5000"

This error occurs when the mobile app cannot connect to the backend server. This guide helps you set everything up correctly.

---

## Quick Start (Recommended)

### Step 1: Find Your Machine's IP Address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" (usually starts with 192.168.x.x or 10.x.x.x)
```

**Mac/Linux:**
```bash
ifconfig
# or
hostname -I
```

### Step 2: Update Backend .env

Edit `backend/.env`:
```env
# Replace 10.44.202.155 with YOUR machine IP
PORT=5000
NODE_ENV=development
ALLOWED_IPS=<YOUR_IP_HERE>,192.168.1.100
BACKEND_URL=http://<YOUR_IP_HERE>:5000
```

**Example:**
```env
ALLOWED_IPS=192.168.1.55,192.168.1.100
BACKEND_URL=http://192.168.1.55:5000
```

### Step 3: Update Frontend .env

Edit `DriveGuard/.env`:
```env
# Use the SAME IP as above
EXPO_PUBLIC_API_URL=http://<YOUR_IP_HERE>:5000
```

**Example:**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.55:5000
```

### Step 4: Restart Everything

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Should show: 🚀 Server is running on http://0.0.0.0:5000
```

**Terminal 2 - Frontend:**
```bash
cd DriveGuard
npx expo start
```

### Step 5: Test Health Endpoint

Visit in your browser:
```
http://<YOUR_IP>:5000/api/health
```

You should see:
```json
{"status":"Backend is running","timestamp":"2026-04-11..."}
```

---

## IP Configuration System (Advanced)

### Backend: IP Whitelist Configuration

The backend now uses a flexible IP whitelist system in `config/ipWhitelist.js`:

#### 1. Environment Variables

```env
# Option 1: Specific IPs (comma-separated)
ALLOWED_IPS=10.44.202.155,192.168.1.100,172.16.0.50

# Option 2: Specific URLs  
ALLOWED_URLS=http://localhost:3000,https://myapp.com

# Option 3: IP Patterns (default: 192.168., 10., 172.16., 169.254.)
IP_PATTERNS=192.168.,10.,172.16.

# Option 4: Frontend URL (production)
FRONTEND_URL=https://production-app.com
```

#### 2. How IP Whitelist Works

**Development Mode (default):**
- Allows ALL requests with no origin (curl, native apps)
- Allows ALL localhost URLs
- Allows ANY IP matching the patterns (192.168.*, 10.*, etc.)
- This is flexible for development

**Production Mode:**
```env
NODE_ENV=production
```
- Only allows explicitly configured IPs and URLs
- Must set ALLOWED_IPS or FRONTEND_URL
- More restrictive for security

#### 3. Default Allowed Ports

The system automatically allows these ports with all configured IPs:
- `3000` - React dev
- `5173` - Vite dev
- `8081` - Expo web
- `19000` - Expo dev
- `19001` - Expo dev
- `8000` - Django/FastAPI
- `5000` - Flask/Backend
- `3001` - Next.js
- `8080` - Webpack dev

---

## Frontend: API Configuration Manager

### API Configuration File: `utils/apiConfigManager.ts`

Provides automatic configuration, health checks, and troubleshooting:

```typescript
import { apiConfigManager } from '../utils/apiConfigManager';

// Get current configuration
const config = apiConfigManager.getConfig();
console.log(config.baseURL); // http://10.44.202.155:5000

// Change backend URL at runtime
apiConfigManager.updateBaseURL('http://192.168.1.55:5000');

// Check if backend is running
const isHealthy = await apiConfigManager.checkHealthStatus();

// Get troubleshooting information
const info = await apiConfigManager.getTroubleshootingInfo();
console.log(info.suggestions);
```

### What api.ts Does

1. Uses `apiConfigManager` for configuration
2. Provides detailed error messages with troubleshooting steps
3. Caches health check results for 5 seconds
4. Logs all API requests and failures

---

## Troubleshooting Checklist

### Error: "Backend server not responding"

**✓ Check 1: Backend is Running**
```bash
cd backend
npm run dev
# Should show: 🚀 Server is running on http://0.0.0.0:5000
```

**✓ Check 2: Database Connected**
- Look for: "✅ MongoDB connected" in backend logs
- If not: Check MongoDB Atlas connection string in .env

**✓ Check 3: Correct IP Address**
```bash
# Get your machine IP
ipconfig      # Windows
ifconfig      # Mac/Linux

# Compare with:
cat backend/.env | grep ALLOWED_IPS
cat DriveGuard/.env | grep EXPO_PUBLIC_API_URL
```

**✓ Check 4: Network Connectivity**
```bash
# Test from your machine
ping 10.44.202.155    # (replace with your IP)

# Visit in browser
http://10.44.202.155:5000/api/health
```

**✓ Check 5: Port 5000 is Open**
```bash
# Check if port is in use
netstat -ano | findstr :5000    # Windows
lsof -i :5000                   # Mac/Linux
```

**✓ Check 6: CORS Configuration**
- Check backend logs for: `CORS blocked origin`
- Update `ALLOWED_IPS` in backend/.env
- Restart backend: `npm run dev`

### Error: "Connection Timeout"

- Backend is too slow to respond
- Increase timeout in api.ts: `timeout: 60000` (60 seconds)
- Or increase `timeout` in apiConfigManager

### Error: "Network Error" or "No Internet"

- Backend is not accessible
- Check firewall settings: `netsh advfirewall show allprofiles`
- Try accessing from another device on same network
- Restart backend server

---

## Network Architecture Overview

```
Your Machine (Backend running here)
├── IP: 192.168.1.55 (or whatever you have)
├── Port: 5000
└── Node.js Server
    ├── ✅ Accepts requests from client apps
    ├── ✅ Validates using IP whitelist
    └── ✅ Response to /api/health

Mobile/Web Client (Frontend app)
├── IP: 192.168.1.100 (or any device on same network)
├── Configured to connect to: http://192.168.1.55:5000
└── On signup:
    ├── 1. Check backend health
    ├── 2. Send signup request to /api/auth/signup
    ├── 3. Receive JWT token
    └── 4. Store token & proceed to dashboard
```

---

## Configuration Options Summary

| Aspect | File | Variable | Example |
|--------|------|----------|---------|
| Backend Port | `backend/.env` | `PORT` | `5000` |
| Backend Allow IPs | `backend/.env` | `ALLOWED_IPS` | `10.44.202.155,192.168.1.100` |
| Backend URL | `backend/.env` | `BACKEND_URL` | `http://10.44.202.155:5000` |
| Frontend API URL | `DriveGuard/.env` | `EXPO_PUBLIC_API_URL` | `http://10.44.202.155:5000` |
| Dev vs Prod | `backend/.env` | `NODE_ENV` | `development` |

---

## Common IP Address Ranges

**Private Networks (your local network):**
- `192.168.0.0` - `192.168.255.255`
- `10.0.0.0` - `10.255.255.255`
- `172.16.0.0` - `172.31.255.255`

**Loopback (same machine):**
- `127.0.0.1` (localhost)

**Link-local (auto-assigned if no DHCP):**
- `169.254.x.x`

---

## Advanced: Custom IP Pattern

If your network uses unusual subnets:

**backend/.env:**
```env
# Allow only 172.22.x.x network
IP_PATTERNS=172.22.
```

---

## Testing Commands

```bash
# Test backend health
curl http://10.44.202.155:5000/api/health

# Test with headers (CORS check)
curl -H "Origin: http://192.168.1.100:19000" http://10.44.202.155:5000/api/health

# Test signup (with valid email/password)
curl -X POST http://10.44.202.155:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

---

## Next Steps

1. ✅ Find your machine IP
2. ✅ Update backend/.env with your IP
3. ✅ Update DriveGuard/.env with your IP
4. ✅ Restart backend and frontend
5. ✅ Test /api/health endpoint
6. ✅ Try signup in the app

**Need help?** Check the console logs in both backend and frontend apps for detailed error messages.
