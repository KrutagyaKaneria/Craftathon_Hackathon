# Bus Driver Safety Monitoring System - AI Microservice

This is a real-time AI microservice that detects driver fatigue (via computer vision) and rash driving (via telemetry) in a stateless setup. This backend is intended to be used by a dashboard or a primary analytics orchestrator.

## Overview

The AI service provides intelligent monitoring for:
- **Fatigue Detection**: Real-time facial analysis using MediaPipe to detect driver drowsiness
- **Rash Driving Detection**: Telemetry-based monitoring of aggressive driving patterns
- **Event Management**: Async event processing with MongoDB storage

## Technologies Used
- **FastAPI** - Modern web framework for building APIs
- **MediaPipe** - Face detection and mesh for facial landmarks
- **OpenCV** - Computer vision library for image processing
- **Motor** - Async MongoDB driver
- **Uvicorn** - ASGI server

---

## Prerequisites

Before starting, ensure you have:
- **Python 3.10 or higher** installed on your system
- **MongoDB** running locally (or accessible)
- **pip** (Python package manager)
- **Virtual environment support** (usually included with Python 3.10+)

### Check Python Version
```bash
python --version
```

---

## Step-by-Step Setup Guide

### Step 1: Navigate to the AI Service Directory

```bash
cd Craftathon_Hackathon/web-app/ai-service
```

### Step 2: Create a Virtual Environment

Virtual environments isolate Python dependencies for this project.

**On Windows (PowerShell/CMD):**
```bash
python -m venv venv
```

**On macOS/Linux:**
```bash
python3 -m venv venv
```

### Step 3: Activate the Virtual Environment

**On Windows (PowerShell):**
```bash
.\venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt):**
```bash
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
source venv/bin/activate
```

Once activated, you should see `(venv)` prefix in your terminal.

### Step 4: Install All Dependencies

```bash
pip install -r requirements.txt
```

This installs all required packages:
- FastAPI
- Uvicorn (ASGI server)
- Motor (async MongoDB driver)
- OpenCV (Computer vision)
- MediaPipe (Face detection)
- Python-dotenv (Environment variables)
- Face-recognition library
- And other dependencies

### Step 5: Configure Environment Variables

Copy the example environment file to create your `.env` file:

**On Windows (PowerShell/CMD):**
```bash
copy .env.example .env
```

**On macOS/Linux:**
```bash
cp .env.example .env
```

### Step 6: Update Configuration (Optional)

Edit the `.env` file with your settings. Key configurations include:

```env
# Database Connection
MONGODB_URI=mongodb://localhost:27017/driver_safety

# Backend Integration
BACKEND_URL=http://localhost:8000/api/v1/events

# Fatigue Detection Thresholds (values between 0-1)
FATIGUE_EAR_THRESHOLD=0.25          # Eye Aspect Ratio threshold
FATIGUE_MAR_THRESHOLD=0.7           # Mouth Aspect Ratio threshold

# Rash Driving Thresholds (acceleration/gyro values)
RASH_ACCEL_THRESHOLD=3.4            # Acceleration threshold (m/s²)
RASH_BRAKE_THRESHOLD=-4.4           # Braking threshold (m/s²)
RASH_GYRO_THRESHOLD=2.2             # Gyroscope threshold (rad/s)

# Alert Sensitivity
FATIGUE_ALERT_MIN_CONSECUTIVE=2     # Consecutive fatigue detections
RASH_ALERT_MIN_CONSECUTIVE=3        # Consecutive rash driving detections
```

---

## Running the Service

### Start MongoDB (if not already running)

Ensure MongoDB is accessible at the `MONGODB_URI` specified in `.env`.

### Run the AI Service

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Parameters explained:**
- `app.main:app` - Runs the FastAPI app from `app/main.py`
- `--host 0.0.0.0` - Makes server accessible from any network interface
- `--port 8000` - Runs on port 8000
- `--reload` - Auto-restarts on code changes (development only)

### Expected Output

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

The API will be available at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

---

## Project Structure

```
ai-service/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── db.py                # MongoDB connection & setup
│   ├── routes.py            # API endpoints
│   ├── models/              # Data models
│   ├── fatigue.py           # Fatigue detection logic
│   ├── rash.py              # Rash driving detection logic
│   ├── face_verify.py       # Facial verification utilities
│   ├── event_engine.py      # Event processing engine
│   ├── socket_client.py     # WebSocket client
│   └── utils.py             # Utility functions
├── .env                     # Environment variables (create from .env.example)
├── .env.example             # Example configuration
├── requirements.txt         # Python dependencies
└── test-startup.py          # Startup test script

```

---

## Verification Steps

### Test 1: Check If Service is Running

```bash
curl http://localhost:8000/docs
```

Should return Swagger UI HTML.

### Test 2: Run Startup Test

```bash
python test-startup.py
```

This verifies all dependencies are installed correctly.

### Test 3: Check Logs

Monitor the terminal where uvicorn is running for any errors or warnings.

---

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'fastapi'`
**Solution**: Ensure virtual environment is activated and dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: `MongoDB connection refused`
**Solution**: Ensure MongoDB is running and accessible at the URI in `.env`

### Issue: `Port 8000 already in use`
**Solution**: Use a different port:
```bash
uvicorn app.main:app --port 8001
```

### Issue: `Virtual environment not activating`
**Solution**: Try running PowerShell as administrator on Windows, or check Python installation.

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `pip install -r requirements.txt` | Install dependencies |
| `pip list` | Show installed packages |
| `deactivate` | Exit virtual environment |
| `uvicorn app.main:app --reload` | Start development server |
| `python test-startup.py` | Run startup tests |

---

## API Usage Reference

Visit `http://localhost:8000/docs` for interactive API documentation.

## Support

For issues or questions, check:
1. MongoDB connection status
2. All environment variables in `.env`
3. Python version compatibility (3.10+)
4. Virtual environment activation

---

**Last Updated**: April 2026

### Test Base64 (Example python script if you need a quick image generation payload):
```python
import base64
with open("driver_frame.jpg", "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode()
    print(encoded_string)
```

### 1. Healthcheck

```bash
curl -X 'GET' \
  'http://localhost:8000/health' \
  -H 'accept: application/json'
```

### 2. Fatigue Check (`POST /fatigue`)

```bash
curl -X 'POST' \
  'http://localhost:8000/fatigue' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "image": "base64_string_here_starting_with_data_or_raw",
  "driver_id": "DRV_101",
  "session_id": "SESS_1"
}'
```

### 3. Rash Driving Analysis (`POST /rash`)

```bash
curl -X 'POST' \
  'http://localhost:8000/rash' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "acceleration": 4.5,
  "brake": -1.2,
  "gyro": 3.1,
  "driver_id": "DRV_101",
  "session_id": "SESS_1"
}'
```

### 4. Combined Processing (`POST /analyze`)

If a client device submits metrics concurrently on intervals:

```bash
curl -X 'POST' \
  'http://localhost:8000/analyze' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "image": "base64_string_here...",
  "acceleration": 2.1,
  "brake": -5.1,
  "gyro": 0.4,
  "driver_id": "DRV_101",
  "session_id": "SESS_1"
}'
```
