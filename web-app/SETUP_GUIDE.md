# Web App Setup Guide - Frontend + AI Service

## Prerequisites Check

- ✅ Node.js (for frontend)
- ✅ Python 3.8+ (for AI service)
- ✅ MongoDB running locally (for AI service)
- ✅ Backend running on port 5000 (for API communication)

---

## 📋 Setup Steps

### 1. Install Frontend Dependencies
```bash
cd web-app/frontend
npm install
```

### 2. Install AI Service Dependencies
```bash
cd web-app/ai-service
pip install -r requirements.txt
```

### 3. Set Up Environment Variables

**Frontend** (.env if needed):
```
VITE_API_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://localhost:8000/api/v1
```

**AI Service** (.env):
```
MONGODB_URI=mongodb://localhost:27017/driver_safety
BACKEND_URL=http://localhost:5000/api
```

Create `.env` file in `web-app/ai-service/` from `.env.example`:
```bash
cd web-app/ai-service
cp .env.example .env
```

---

## 🚀 Running Both Services

### Option 1: Run in Separate Terminals (Recommended for Development)

**Terminal 1 - Frontend:**
```bash
cd web-app/frontend
npm run dev
```
Frontend will be available at: `http://localhost:5173`

**Terminal 2 - AI Service:**
```bash
cd web-app/ai-service
python app/main.py
```
AI Service will be available at: `http://localhost:8000`

**Terminal 3 - Backend (if not running):**
```bash
cd Native/backend
npm run dev
```
Backend will be available at: `http://localhost:5000`

---

### Option 2: Run With Single Command (Using concurrently)

**Install concurrently:**
```bash
npm install -g concurrently
```

**Create startup script** - Save as `start-webapp.sh` in web-app folder:
```bash
#!/bin/bash
concurrently \
  "cd frontend && npm run dev" \
  "cd ai-service && python app/main.py"
```

**Run:**
```bash
chmod +x start-webapp.sh
./start-webapp.sh
```

---

## 🔗 Service URLs

| Service | URL | Port | Status |
|---------|-----|------|--------|
| Frontend | http://localhost:5173 | 5173 | React Vite dev server |
| AI Service | http://localhost:8000 | 8000 | FastAPI with Uvicorn |
| Backend | http://localhost:5000 | 5000 | Node.js Express (if running) |
| MongoDB | mongodb://localhost:27017 | 27017 | Database |

---

## 📝 File Structure

```
web-app/
├── frontend/
│   ├── package.json (npm run dev)
│   ├── src/
│   └── vite.config.js
└── ai-service/
    ├── app/
    │   ├── main.py (python entry point)
    │   ├── routes.py
    │   └── config.py
    └── requirements.txt
```

---

## ⚠️ Troubleshooting

### AI Service Shows Import Errors
**Solution**: Make sure requirements are installed
```bash
cd web-app/ai-service
pip install -r requirements.txt
```

### Port Already in Use
- Frontend (5173): Another process using it - kill and restart
- AI Service (8000): Another process using it - kill and restart
- Backend (5000): Another process using it - kill and restart

### MongoDB Connection Error
**Make sure MongoDB is running:**
```bash
# Windows
mongod

# Mac/Linux
brew services start mongodb-community
```

### .env Not Found
**Create it from example:**
```bash
cp web-app/ai-service/.env.example web-app/ai-service/.env
```

---

## ✅ After Starting - Test URLs

Frontend: http://localhost:5173
- Should show your React app

AI Service: http://localhost:8000/docs
- FastAPI interactive documentation

Backend API: http://localhost:5000/api/health
- Should return: `{"status":"Backend is running","timestamp":"..."}`

---

## 🎯 Next Steps

1. Start Backend: `npm run dev` in Native/backend
2. Start Frontend: `npm run dev` in web-app/frontend  
3. Start AI Service: `python app/main.py` in web-app/ai-service
4. Open http://localhost:5173 in browser
5. Test the full stack!

---

## 📞 Quick Commands

```bash
# From project root

# Frontend only
cd web-app/frontend && npm run dev

# AI Service only
cd web-app/ai-service && python app/main.py

# Backend only
cd Native/backend && npm run dev

# All three (if using concurrently)
concurrently "cd web-app/frontend && npm run dev" "cd web-app/ai-service && python app/main.py" "cd Native/backend && npm run dev"
```
