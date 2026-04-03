import cv2
import numpy as np
import mediapipe as mp
from app.config import settings

import os
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Initialize MediaPipe Face Landmarker
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'face_landmarker.task')
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5
)
face_landmarker = vision.FaceLandmarker.create_from_options(options)

# In-Memory Cache for consecutive frame smoothing (naive solution for stateless API)
# Key: session_id, Value: number of consecutive drowsy frames
session_history = {}

# Right Eye Indices
# P1: 33, P2: 159, P3: 158, P4: 133, P5: 153, P6: 145
RIGHT_EYE = [33, 159, 158, 133, 153, 145]
# Left Eye Indices
# P1: 362, P2: 385, P3: 386, P4: 263, P5: 374, P6: 380
LEFT_EYE = [362, 385, 386, 263, 374, 380]

# Inner lips
MOUTH_TOP = 13
MOUTH_BOTTOM = 14
MOUTH_LEFT = 78
MOUTH_RIGHT = 308

def dist(p1, p2):
    return np.linalg.norm(np.array([p1.x, p1.y]) - np.array([p2.x, p2.y]))

def calculate_ear(landmarks, eye_indices):
    p1 = landmarks[eye_indices[0]] # Left corner
    p2 = landmarks[eye_indices[1]] # Top left
    p3 = landmarks[eye_indices[2]] # Top right
    p4 = landmarks[eye_indices[3]] # Right corner
    p5 = landmarks[eye_indices[4]] # Bottom right
    p6 = landmarks[eye_indices[5]] # Bottom left

    vertical_1 = dist(p2, p6)
    vertical_2 = dist(p3, p5)
    horizontal = dist(p1, p4)

    if horizontal == 0:
        return 0.0

    ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
    return ear

def calculate_mar(landmarks):
    top = landmarks[MOUTH_TOP]
    bottom = landmarks[MOUTH_BOTTOM]
    left = landmarks[MOUTH_LEFT]
    right = landmarks[MOUTH_RIGHT]

    vertical = dist(top, bottom)
    horizontal = dist(left, right)

    if horizontal == 0:
         return 0.0

    return vertical / horizontal

def detect_fatigue(image: np.ndarray, session_id: str) -> dict:
    """
    Detects fatigue from a numpy BGR image.
    Calculates EAR and MAR to deduce 'yawning', 'eye_closure', or 'head_tilt'.
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    results = face_landmarker.detect(mp_image)
    
    if not results.face_landmarks:
        return {
            "fatigue_score": 0.0,
            "status": "no_face",
            "event": None,
            "metrics": {"ear": 0.0, "mar": 0.0}
        }
        
    landmarks = results.face_landmarks[0]
    
    # Calculate EAR
    right_ear = calculate_ear(landmarks, RIGHT_EYE)
    left_ear = calculate_ear(landmarks, LEFT_EYE)
    ear = (right_ear + left_ear) / 2.0
    
    # Calculate MAR
    mar = calculate_mar(landmarks)
    
    # Logic Processing
    drowsy_frames = session_history.get(session_id, 0)
    
    event = None
    fatigue_score = 0.0
    status = "alert"
    
    is_eyes_closed = ear < settings.FATIGUE_EAR_THRESHOLD
    is_yawning = mar > settings.FATIGUE_MAR_THRESHOLD
    
    if is_eyes_closed:
        drowsy_frames += 1
        # Fatigue score scales linearly with consecutive closed frames to max 1.0
        fatigue_score = min(drowsy_frames / settings.FATIGUE_SMOOTHING_FRAMES * 0.5 + 0.5, 1.0)
    else:
        drowsy_frames = max(0, drowsy_frames - 1) # Reduce drowsy frames softly
        
    if drowsy_frames >= settings.FATIGUE_SMOOTHING_FRAMES:
        status = "drowsy"
        event = "eye_closure"
        
    if is_yawning:
        event = "yawning"
        status = "drowsy"
        fatigue_score = max(fatigue_score, 0.6) # Base fatigue for yawning
        
    session_history[session_id] = drowsy_frames
    
    return {
        "fatigue_score": round(fatigue_score, 2),
        "status": status,
        "event": event,
        "metrics": {"ear": round(ear, 3), "mar": round(mar, 3)}
    }
