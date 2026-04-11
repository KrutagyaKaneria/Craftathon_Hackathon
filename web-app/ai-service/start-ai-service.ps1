# 1. Activate Environment
& "C:\ARJUN DIVRANIYA\Coding Gita\Craftathon\Craftathon_Hackathon\web-app\ai-service\.venv\Scripts\Activate.ps1"

# 2. Set Path to include the models in this environment
$env:PYTHONPATH = "C:\ARJUN DIVRANIYA\Coding Gita\Craftathon\Craftathon_Hackathon\web-app\ai-service\.venv\Lib\site-packages"

# 3. Start Service
cd "C:\ARJUN DIVRANIYA\Coding Gita\Craftathon\Craftathon_Hackathon\web-app\ai-service"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload