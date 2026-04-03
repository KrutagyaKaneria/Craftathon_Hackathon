import base64
import numpy as np
import cv2
import logging
from typing import Optional

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai-service")

def decode_image_base64(base64_str: str) -> Optional[np.ndarray]:
    """
    Decodes a base64 string to an OpenCV image (numpy array, BGR format).
    Returns None if decoding fails.
    """
    try:
        # Check if the string has the data URL scheme (e.g., "data:image/jpeg;base64,")
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]

        image_bytes = base64.b64decode(base64_str)
        image_np = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error(f"Error decoding base64 image: {e}")
        return None
