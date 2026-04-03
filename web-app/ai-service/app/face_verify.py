from deepface import DeepFace
import cv2
import numpy as np
import base64
from app.utils import decode_image_base64, logger

def verify_face(stored_image_base64: str, captured_image_base64: str) -> dict:
    """
    Compares two face images using DeepFace.
    Returns a dictionary with 'verified' (bool) and 'distance' / 'threshold'.
    """
    try:
        # Convert base64 to OpenCV images
        img1 = decode_image_base64(stored_image_base64)
        if img1 is None:
            return {"verified": False, "message": "Invalid stored image"}
            
        img2 = decode_image_base64(captured_image_base64)
        if img2 is None:
            return {"verified": False, "message": "Invalid captured image"}

        # DeepFace verification using VGG-Face (default)
        # Note: Model loading might take a while on first run
        result = DeepFace.verify(
            img1_path=img1, 
            img2_path=img2, 
            enforce_detection=True, 
            detector_backend='opencv', # opencv is fast, retinaface is more robust
            model_name='VGG-Face'
        )

        logger.info(f"Face verification result: {result['verified']} (distance: {result['distance']:.4f})")
        
        return {
            "verified": result["verified"],
            "distance": result["distance"],
            "threshold": result["threshold"]
        }

    except Exception as e:
        logger.error(f"DeepFace verification error: {str(e)}")
        # If no face is detected, DeepFace might throw an error
        if "Face could not be detected" in str(e):
            return {"verified": False, "message": "No face detected in one of the images"}
            
        return {"verified": False, "message": f"Verification error: {str(e)}"}
