# 🚀 DriveGuard Web App Startup - Complete Guide

## ⚡ Fastest Way (Recommended for First Time)

Just run this command from the `web-app` folder:

**Windows (PowerShell):**
```powershell
.\start-webapp.ps1
```

**Windows (Command Prompt):**
```cmd
start-webapp.bat
```

**Mac/Linux:**
```bash
chmod +x start-webapp.sh
./start-webapp.sh
```

This will automatically start both services in separate windows! 🎉

---

## 📖 Step-by-Step Setup

### 1️⃣ Install Dependencies (One-Time Only)

**Frontend:**
```bash
cd web-app/frontend
npm install
```

**AI Service:**
```bash
cd web-app/ai-service
# Dependencies already installed! ✅
```

---

### 2️⃣ Create Environment Files

**AI Service Config** (Already created at `web-app/ai-service/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/driver_safety
BACKEND_URL=http://localhost:5000/api
```

---

### 3️⃣ Make Sure Prerequisites Are Running

**MongoDB:**
```bash
# Windows - Download from mongodb.com
mongod

# Mac
brew services start mongodb-community

# Linux  
sudo systemctl start mongod
```

**Backend (Optional but recommended):**
```bash
cd Native/backend
npm run dev
```

---

## 🎯 Starting Services

### Option A: Auto Start (Recommended)

**Windows PowerShell:**
```powershell
cd web-app
.\start-webapp.ps1
```

This opens 2 new windows:
- Window 1: Frontend (http://localhost:5173)
- Window 2: AI Service (http://localhost:8000)

### Option B: Manual Start (Separate Terminals)

**Terminal 1 - Frontend:**
```bash
cd web-app/frontend
npm run dev
```
✅ Frontend runs at: http://localhost:5173

**Terminal 2 - AI Service:**
```bash
cd web-app/ai-service
python app/main.py
```
✅ AI Service runs at: http://localhost:8000

### Option C: One Terminal (Sequential)

```bash
# Start frontend in background (macOS/Linux)
cd web-app/frontend && npm run dev &

# Start AI service (will run after frontend)
cd ../ai-service && python app/main.py
```

---

## 📍 After Startup - Access These URLs

| Service | URL | What It Is |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Your main web app (React) |
| **AI Service** | http://localhost:8000 | FastAPI backend |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Alternative Docs** | http://localhost:8000/redoc | ReDoc API documentation |

---

## ✅ Quick Verification Checklist

After starting, verify everything is working:

- [ ] Frontend loads at http://localhost:5173 (no errors in console)
- [ ] Can see the webcam interface
- [ ] AI Service UI docs load at http://localhost:8000/docs
- [ ] MongoDB shows no connection errors
- [ ] Backend running on 5000 if you started it

---

## 🔥 All 3 Services (Complete Stack)

If you want to run **Frontend + AI Service + Backend** all together:

**Windows PowerShell** (from project root):
```powershell
# Terminal 1: Frontend
cd web-app/frontend; npm run dev

# Terminal 2: AI Service  
cd web-app/ai-service; python app/main.py

# Terminal 3: Backend
cd Native/backend; npm run dev
```

**All 3 URLs will be available:**
- Frontend: http://localhost:5173
- AI Service: http://localhost:8000  
- Backend: http://localhost:5000

---

## 🛠️ Troubleshooting

### "Port 5173 already in use"
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5173
kill -9 <PID>
```

### "MongoDB connection refused"
```bash
# Start MongoDB
mongod

# Or if not installed
# - Download from mongodb.com
# - Install and keep running
```

### "Module not found" (Python)
```bash
# Reinstall Python packages
cd web-app/ai-service
python -m pip install -r requirements.txt
```

### "Module 'app' not found"
```bash
# Correct way to start AI service:
cd web-app/ai-service
python app/main.py
```

---

## 📊 Frontend Features

Your web app includes:
- 📹 **Webcam Integration**: Live video streaming
- 👤 **Driver Selection**: Dropdown to choose driver
- 🚗 **Vehicle Dashboard**: Real-time vehicle stats
- ⚠️ **Safety Alerts**: Fatigue & rash driving detection
- 📈 **Analytics**: Historical data and trends
- 🎯 **Performance Metrics**: Safety scores

---

## 🤖 AI Service Capabilities

The FastAPI microservice provides:
- **Face Recognition**: Identify drivers from webcam
- **Drowsiness Detection**: EAR-based eye tracking
- **Rash Driving Detection**: Acceleration/gyro analysis
- **Real-time Events**: Stream-based processing
- **WebSocket Integration**: Live communication
- **Alert Management**: Store and retrieve alerts

---

## 💾 Configuration Files

Edit these to customize behavior:

**Frontend Settings:**
- Location: `web-app/frontend/src/config/`
- Main config: `vite.config.js`

**AI Service Settings:**
- Location: `web-app/ai-service/.env`
- Thresholds: Fatigue/Rash detection sensitivity
- Database: MongoDB connection string
- Backend: Node.js backend URL

---

## 📚 Project Structure

```
web-app/
├── frontend/                 ← React app
│   ├── src/components/      ← UI components
│   ├── src/pages/           ← Page components
│   ├── src/store/           ← State management
│   └── package.json
│
├── ai-service/              ← Python FastAPI
│   ├── app/main.py         ← Entry point
│   ├── app/routes.py       ← API endpoints
│   ├── app/fatigue.py      ← Drowsiness logic
│   ├── app/rash.py         ← Rash driving logic
│   └── .env                ← Configuration
│
├── start-webapp.ps1        ← PowerShell launcher
├── start-webapp.bat        ← Windows launcher
├── QUICKSTART.md           ← Detailed guide
└── README.md               ← This file
```

---

## 🎯 Next Steps

1. **Start Services**: Use Option A (auto-start) for easiest setup
2. **Open Frontend**: Go to http://localhost:5173
3. **Test Features**: Try uploading video or enabling webcam
4. **Monitor Logs**: Watch console for any errors
5. **Explore API**: Check http://localhost:8000/docs

---

## 🆘 Need Help?

**Check these first:**
1. Both terminals running without errors
2. MongoDB process is active
3. Ports 5173 and 8000 are not blocked
4. No firewall issues
5. .env file exists and has correct values

Still stuck? Check `QUICKSTART.md` for more detailed troubleshooting!

---

**Your Web App is Ready! 🚀**

Run `.\start-webapp.ps1` (Windows) or `./start-webapp.sh` (Mac/Linux) to begin!
