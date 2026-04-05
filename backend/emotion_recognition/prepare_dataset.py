import os
import cv2
import shutil
import numpy as np
import logging
from tqdm import tqdm
from mtcnn import MTCNN
from sklearn.model_selection import train_test_split

# --- CONFIGURATION ---
MAPPING = {
    '1': 'surprise',
    '2': 'fear',
    '3': 'disgust',
    '4': 'happy',
    '5': 'sad',
    '6': 'angry',
    '7': 'neutral'
}

EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
TARGET_SIZE = (224, 224)

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("RAF-DB_Prep")

def setup_directories(base_dir):
    """Creates the train/val/test directory structure."""
    splits = ['train', 'val', 'test']
    for split in splits:
        for emotion in EMOTIONS:
            path = os.path.join(base_dir, split, emotion)
            os.makedirs(path, exist_ok=True)
    logger.info(f"✅ Directory structure created at: {base_dir}")

def align_face(img, landmarks):
    """Aligns the face based on eye positions. Ensures types for OpenCV."""
    left_eye = landmarks['left_eye']
    right_eye = landmarks['right_eye']
    
    # Calculate angle between eyes
    dy = float(right_eye[1] - left_eye[1])
    dx = float(right_eye[0] - left_eye[0])
    angle = float(np.degrees(np.arctan2(dy, dx)))
    
    # Rotate around center of eyes
    # OpenCV's getRotationMatrix2D on Windows requires native python floats/ints
    center_x = float((left_eye[0] + right_eye[0]) / 2)
    center_y = float((left_eye[1] + right_eye[1]) / 2)
    eye_center = (center_x, center_y)
    
    M = cv2.getRotationMatrix2D(eye_center, angle, 1.0)
    
    # Apply rotation
    aligned_img = cv2.warpAffine(img, M, (img.shape[1], img.shape[0]), flags=cv2.INTER_CUBIC)
    return aligned_img

def process_image(img_path, detector):
    """Detects, aligns, and crops the face. Handles non-ASCII paths and small images."""
    try:
        if not os.path.exists(img_path):
            return None
            
        # Robust loading for Windows
        img_array = np.fromfile(img_path, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
            
        # MTCNN expects RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # FIX: To avoid 'Conv2D empty output' error, ensure image is at least 160x160
        # This prevents MTCNN from creating empty tensors on very small RAF-DB aligned images
        h, w = img_rgb.shape[:2]
        if h < 160 or w < 160:
            scale = 160 / min(h, w)
            img_detect = cv2.resize(img_rgb, (int(w * scale), int(h * scale)))
        else:
            img_detect = img_rgb

        # Detection with suppressed noise
        try:
            results = detector.detect_faces(img_detect)
        except Exception:
            return None
        
        if not results:
            return None
            
        # Get result and adjust bbox if we scaled
        result = max(results, key=lambda x: x['confidence'])
        bbox = result['box']
        landmarks = result['keypoints']
        
        # If we scaled for detection, we use the original for high-quality alignment
        # MTCNN results on scaled image need to be scaled back
        if h < 160 or w < 160:
            scale = 160 / min(h, w)
            # Re-detect on original is safer for landmarks if we can, but let's just scale landmarks
            for key in landmarks:
                landmarks[key] = (landmarks[key][0] / scale, landmarks[key][1] / scale)
            bbox = [b / scale for b in bbox]

        # Align based on original high-res eye positions
        aligned_img = align_face(img_rgb, landmarks)
        
        # Crop
        x, y, w, h = [int(b) for b in bbox]
        margin_x = int(w * 0.1)
        margin_y = int(h * 0.1)
        
        start_x = max(0, x - margin_x)
        start_y = max(0, y - margin_y)
        end_x = min(aligned_img.shape[1], x + w + margin_x)
        end_y = min(aligned_img.shape[0], y + h + margin_y)
        
        face_crop = aligned_img[start_y:end_y, start_x:end_x]
        
        if face_crop.size == 0:
            return None
            
        return cv2.resize(face_crop, TARGET_SIZE)
        
    except Exception:
        return None

def prepare_raf_db(input_root, output_root):
    """Main pipeline for RAF-DB preparation."""
    logger.info("Initializing MTCNN (this may take a moment)...")
    try:
        detector = MTCNN()
    except Exception as e:
        logger.error(f"Could not initialize MTCNN: {e}")
        logger.info("Please ensure 'pip install mtcnn tensorflow' is correct.")
        return
    
    all_data = [] 
    stats = {emotion: 0 for emotion in EMOTIONS}
    skipped = 0
    total_found = 0
    
    subfolders = ['train', 'test']
    
    logger.info(f"🚀 Scanning RAF-DB in: {input_root}")
    
    for sub in subfolders:
        sub_path = os.path.join(input_root, sub)
        if not os.path.exists(sub_path):
            logger.warning(f"Subfolder not found: {sub_path}")
            continue
            
        for num_folder in MAPPING.keys():
            emotion = MAPPING[num_folder]
            class_path = os.path.join(sub_path, num_folder)
            
            if not os.path.exists(class_path):
                continue
                
            files = [f for f in os.listdir(class_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            total_found += len(files)
            
            pbar = tqdm(files, desc=f"Processing {sub}/{emotion}", leave=False)
            for f in pbar:
                img_path = os.path.join(class_path, f)
                processed = process_image(img_path, detector)
                
                if processed is not None:
                    all_data.append((processed, emotion, f))
                    stats[emotion] += 1
                else:
                    skipped += 1
                
                # Update pbar with current stats
                if len(all_data) > 0:
                    pbar.set_postfix({"Faces": len(all_data), "Skipped": skipped})

    if total_found == 0:
        logger.error(f"No images found in {input_root}. Please check the folder structure.")
        return

    logger.info(f"📊 Finished scanning {total_found} images.")
    logger.info(f"✅ Successfully processed {len(all_data)} faces. Skipped {skipped}.")
    for emo, count in stats.items():
        logger.info(f"  - {emo}: {count}")

    # Split: 70% Train, 15% Val, 15% Test
    train_val, test = train_test_split(all_data, test_size=0.15, stratify=[d[1] for d in all_data], random_state=42)
    train, val = train_test_split(train_val, test_size=0.176, stratify=[d[1] for d in train_val], random_state=42) # 0.15 / 0.85 approx 0.176

    setup_directories(output_root)
    
    # Save Splits
    def save_split(data_list, split_name):
        logger.info(f"💾 Saving {split_name} split...")
        for img, emotion, name in tqdm(data_list, desc=split_name):
            path = os.path.join(output_root, split_name, emotion, name)
            # Convert back to BGR for saving
            img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            # Robust saving for non-ASCII paths
            _, buf = cv2.imencode(".jpg", img_bgr)
            buf.tofile(path)

    save_split(train, 'train')
    save_split(val, 'val')
    save_split(test, 'test')
    
    logger.info(f"📈 Final Split Counts:")
    logger.info(f"  - Train: {len(train)}")
    logger.info(f"  - Val:   {len(val)}")
    logger.info(f"  - Test:  {len(test)}")
    logger.info("✨ RAF-DB Dataset Preparation Complete!")

if __name__ == "__main__":
    # Define paths based on project structure
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    RAF_INPUT = os.path.join(BASE_DIR, "archive (1)", "DATASET")
    DATA_OUTPUT = os.path.join(BASE_DIR, "data")
    
    prepare_raf_db(RAF_INPUT, DATA_OUTPUT)
