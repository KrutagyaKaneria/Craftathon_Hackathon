import face_recognition
import cv2
import numpy as np
import base64
from app.utils import decode_image_base64, logger

def verify_face(stored_image_base64: str, captured_image_base64: str) -> dict:
    """
    Compares two face images using face_recognition.
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

        # Convert BGR to RGB for face_recognition
        img1_rgb = cv2.cvtColor(img1, cv2.COLOR_BGR2RGB)
        img2_rgb = cv2.cvtColor(img2, cv2.COLOR_BGR2RGB)
        
        # Get face encodings
        face1_encodings = face_recognition.face_encodings(img1_rgb)
        face2_encodings = face_recognition.face_encodings(img2_rgb)
        
        if not face1_encodings:
            return {"verified": False, "message": "No face detected in stored image"}
        if not face2_encodings:
            return {"verified": False, "message": "No face detected in captured image"}
        
        # Compare faces using face_recognition
        distance = face_recognition.face_distance([face1_encodings[0]], face2_encodings[0])[0]
        threshold = 0.6  # face_recognition default
        verified = distance < threshold
        
        result = {
            "verified": bool(verified),
            "distance": float(distance),
            "threshold": threshold
        }

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
