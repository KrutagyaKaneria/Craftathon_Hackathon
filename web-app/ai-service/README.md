# Bus Driver Safety Monitoring System - AI Microservice

This is a real-time AI microservice that detects driver fatigue (via computer vision) and rash driving (via telemetry) in a stateless setup. This backend is intended to be used by a dashboard or a primary analytics orchestrator.

## Technologies Used
- FastAPI
- MediaPipe Face Mesh
- OpenCV
- MongoDB (Motor async driver)

## Quickstart

### 1. Requirements

Ensure you have Python 3.10+ installed.

```bash
# Clone the repository
cd ai-service

# Setup virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate # Unix

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

Copy the sample environment file to `.env` to define thresholds and config constants:

```bash
cp .env.example .env
```

Ensure MongoDB is running locally at `mongodb://localhost:27017` or change the `MONGODB_URI` string in `.env`.

### 3. Running Locally

Run the Fastapi server via Uvicorn. The `app.main` wrapper launches everything cleanly including startup events for the `motor` engine.

```bash
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Usage Reference

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
