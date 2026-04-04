# Activate the virtual environment and start the AI service
& 'c:\ARJUN DIVRANIYA\Coding Gita\Craftathon\venv\Scripts\Activate.ps1'
cd 'c:\ARJUN DIVRANIYA\Coding Gita\Craftathon\Craftathon_Hackathon\web-app\ai-service'
python -m uvicorn app.main:app --reload
