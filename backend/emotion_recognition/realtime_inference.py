import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp
from .utils import setup_logging, EMOTIONS

logger = setup_logging("Inference")

class EmotionDetector:
    def __init__(self, model_path, class_names=None):
        logger.info(f"Loading model from {model_path}...")
        self.model = tf.keras.models.load_model(model_path)
        self.class_names = class_names or [e.capitalize() for e in EMOTIONS]
        
        # Initialize Face Detection with fallback
        self.face_detection = None
        self.use_mediapipe = False
        
        try:
            import mediapipe as mp
            self.mp_face_detection = mp.solutions.face_detection
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=0, min_detection_confidence=0.5
            )
            self.use_mediapipe = True
            logger.info("Using MediaPipe for face detection.")
        except (AttributeError, ImportError) as e:
            logger.warning(f"MediaPipe initialization failed: {e}. Falling back to Haar Cascades.")
            # Load path for OpenCV Haar Cascade
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            if self.face_cascade.empty():
                logger.error("Failed to load Haar Cascade. Face detection will be disabled.")
            self.use_mediapipe = False
        
    def preprocess_face(self, face_img):
        """Preprocesses face for MobileNetV2."""
        face_img = cv2.resize(face_img, (224, 224))
        face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
        face_img = np.expand_dims(face_img, axis=0)
        face_img = tf.keras.applications.mobilenet_v2.preprocess_input(face_img)
        return face_img

    def run_inference(self):
        """Runs real-time emotion recognition using webcam."""
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            logger.error("Could not open webcam.")
            return

        logger.info("Starting real-time inference. Press 'q' to quit.")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            faces_to_process = []

            if self.use_mediapipe:
                # MediaPipe detection logic
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.face_detection.process(rgb_frame)
                if results.detections:
                    for detection in results.detections:
                        bbox = detection.location_data.relative_bounding_box
                        ih, iw, _ = frame.shape
                        x, y, w, h = int(bbox.xmin * iw), int(bbox.ymin * ih), \
                                     int(bbox.width * iw), int(bbox.height * ih)
                        faces_to_process.append((x, y, w, h))
            else:
                # Haar Cascade detection logic
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
                for (x, y, w, h) in faces:
                    faces_to_process.append((x, y, w, h))

            # Process detected faces
            for (x, y, w, h) in faces_to_process:
                # Basic bounds check
                ih, iw, _ = frame.shape
                x, y = max(0, x), max(0, y)
                w, h = min(w, iw - x), min(h, ih - y)
                
                if w > 0 and h > 0:
                    face_roi = frame[y:y+h, x:x+w]
                    
                    # Get prediction
                    processed_face = self.preprocess_face(face_roi)
                    preds = self.model.predict(processed_face, verbose=0)
                    emotion_idx = np.argmax(preds)
                    emotion = self.class_names[emotion_idx]
                    confidence = preds[0][emotion_idx]
                    
                    # Draw results
                    color = (0, 255, 0) # Green box
                    cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                    label = f"{emotion}: {confidence:.2f}"
                    cv2.putText(frame, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

            cv2.imshow('Real-time Emotion Recognition', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Real-time Emotion Recognition")
    parser.add_argument("--model", type=str, default="backend/ai_models/emotion_model_final.h5", help="Path to trained model")
    args = parser.parse_args()
    
    detector = EmotionDetector(args.model)
    detector.run_inference()
