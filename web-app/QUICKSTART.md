# 🚀 DriveGuard Web App - Startup Guide

## Quick Start (One Command)

### Windows (PowerShell)
```powershell
.\start-webapp.ps1
```

### Windows (Command Prompt)
```cmd
start-webapp.bat
```

### Mac/Linux
```bash
chmod +x start-webapp.sh
./start-webapp.sh
```

---

## 📋 What Gets Started

| Service | Port | Type | Command |
|---------|------|------|---------|
| **Frontend** | 5173 | React (Vite) | `npm run dev` |
| **AI Service** | 8000 | Python (FastAPI) | `python app/main.py` |
| **Backend** | 5000 | Node.js (Optional) | `npm run dev` |

---

## Manual Startup (Separate Terminals)

### Terminal 1: Frontend
```bash
cd web-app/frontend
npm run dev
```
✅ Opens on http://localhost:5173

### Terminal 2: AI Service
```bash
cd web-app/ai-service
python app/main.py
```
✅ Available at http://localhost:8000

### Terminal 3: Backend (Optional)
```bash
cd Native/backend
npm run dev
```
✅ Available at http://localhost:5000

---

## 🔧 Prerequisites

Before starting:

### 1. MongoDB Running
```bash
# Windows
mongod

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 2. Backend Running (Optional)
```bash
cd Native/backend
npm start
```

### 3. All Dependencies Installed
```bash
# Frontend
cd web-app/frontend
npm install

# AI Service (already done)
cd web-app/ai-service
# pip install -r requirements.txt (already installed)
```

---

## 📍 Service Access

After startup, access these URLs:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main web application |
| **AI Service** | http://localhost:8000 | FastAPI backend |
| **API Docs** | http://localhost:8000/docs | Interactive Swagger UI |
| **ReDoc** | http://localhost:8000/redoc | Alternative API documentation |

---

## 📊 Frontend Features

The React frontend includes:
- Webcam streaming (video feed)
- Driver selection dropdown
- Safety statistics dashboard
- Real-time alerts
- Performance metrics
- Alert history

---

## 🤖 AI Service Features

The FastAPI microservice includes:
- **Face Recognition**: DeepFace integration for driver identification
- **Fatigue Detection**: Eye-Aspect-Ratio (EAR) based drowsiness detection
- **Rash Driving**: Acceleration/braking/gyroscope analysis
- **Real-time Processing**: Stream-based video analysis
- **WebSocket Integration**: Live communication with frontend
- **MongoDB Storage**: Alert history and metrics

---

## 🔗 Configuration

### Frontend (.env)
Located in `web-app/frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### AI Service (.env)
Located in `web-app/ai-service/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/driver_safety
BACKEND_URL=http://localhost:5000/api
```

---

## 🐛 Troubleshooting

### Issue: "Port already in use"
**Solution**: Kill the process using that port
```bash
# Windows - Find process using port
netstat -ano | findstr :5173

# Mac/Linux
lsof -i :5173
kill -9 <PID>
```

### Issue: "MongoDB connection refused"
**Solution**: Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB if not running
mongod
```

### Issue: "Python module not found"
**Solution**: Reinstall dependencies
```bash
cd web-app/ai-service
python -m pip install -r requirements.txt
```

### Issue: "Module 'app' not found"
**Solution**: Make sure working directory is correct
```bash
cd web-app/ai-service
python app/main.py  # Wrong! app is already in the path

# Correct:
python -m app.main
# or
python -c "from app.main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

---

## 📖 Project Structure

```
web-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── ai-service/
│   ├── app/
│   │   ├── main.py          ← FastAPI entry point
│   │   ├── routes.py         ← API endpoints
│   │   ├── config.py         ← Configuration
│   │   ├── db.py             ← MongoDB connection
│   │   ├── face_verify.py    ← Face recognition
│   │   ├── fatigue.py        ← Fatigue detection
│   │   ├── rash.py           ← Rash driving detection
│   │   ├── event_engine.py   ← Event processing
│   │   └── socket_client.py  ← WebSocket client
│   │
│   ├── requirements.txt      ← Python dependencies
│   ├── .env                  ← Environment variables
│   └── .env.example
│
├── start-webapp.bat          ← Windows batch starter
├── start-webapp.ps1          ← Windows PowerShell starter
├── start-webapp.sh           ← Mac/Linux starter
├── SETUP_GUIDE.md
└── README.md
```

---

## 🎯 Next Steps After Startup

1. **Open Frontend**: http://localhost:5173
2. **Check API Docs**: http://localhost:8000/docs
3. **Monitor Console**: Watch browser console and terminal for logs
4. **Test Features**:
   - Upload video file
   - Select driver from dropdown
   - Watch real-time analysis
   - Check safety alerts

---

## 💡 Tips

- **Keep terminals open**: Keep both service terminals open to see logs
- **Check firewall**: Make sure firewall allows ports 5173, 8000, 5000
- **MongoDB size**: Large video files might take time to process
- **Browser cache**: Clear browser cache if frontend doesn't update

---

## 🚨 Common Ports Used

Make sure these ports are not in use:
- **3000**: React dev server (if using Create React App)
- **5000**: Backend Node.js
- **5173**: Frontend Vite (our service)
- **8000**: AI Service (our service)
- **27017**: MongoDB

---

## 📞 Quick Reference

```bash
# Kill all Node and Python processes (Nuclear option)
# Windows CMD:
taskkill /IM node.exe /F
taskkill /IM python.exe /F

# Mac/Linux:
killall node
killall python

# Check running processes
# Windows:
netstat -ano | findstr LISTENING

# Mac/Linux:
lsof -i -P -n | grep LISTEN
```

---

## ✅ Health Check

After everything is running, test these endpoints:

```bash
# Frontend should load
curl http://localhost:5173

# AI Service health
curl http://localhost:8000/docs

# Backend health (if running)
curl http://localhost:5000/api/health
```

All showing responses = ✅ System working!

---

## 🆘 Still Having Issues?

1. Check console output in terminal windows
2. Verify MongoDB is running: `mongod --version`
3. Verify Node.js is installed: `node --version`
4. Verify Python is installed: `python --version`
5. Check `.env` files are set up correctly
6. Try restarting all services clean

Good luck! 🚀
