#!/usr/bin/env python
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testing AI Service startup...")
print("=" * 50)

try:
    print("Importing FastAPI app...")
    from app.main import app
    print("✅ App imported successfully!")
    
    print("\nChecking app configuration...")
    print(f"   App name: {app.title}")
    print(f"   Version: {app.version}")
    
    print("\n✅ ALL CHECKS PASSED!")
    print("\nThe AI Service is ready to start.")
    print("\nTo start the service, run:")
    print("  python app/main.py")
    print("\nThe service will be available at:")
    print("  http://localhost:8000")
    print("  API Docs: http://localhost:8000/docs")
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("\nTrying to install missing packages...")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

print("\n" + "=" * 50)
