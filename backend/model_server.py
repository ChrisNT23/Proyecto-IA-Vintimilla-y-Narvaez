import base64
import io
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf
from flask_cors import CORS
import os
import time
import logging
import cv2
import mediapipe as mp

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ModelServer")

app = Flask(__name__)
CORS(app)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
MODEL_CUBE_PATH = os.path.join(BASE_DIR, 'model_cube.h5')
MODEL_CLOCK_PATH = os.path.join(BASE_DIR, 'model_clock.keras')
# Link to the newly trained emotion model in ai_models
MODEL_EMOTIONS_PATH = os.path.join(BASE_DIR, 'ai_models', 'emotion_model_final.keras')

# Global variables for models and detectors
model_cube = None
model_clock = None
model_emotions = None
face_detector = None # Changed from face_detection to face_detector (using Haar)

# Initialize Robust Face Detection (OpenCV Haar Cascades)
# This is much more reliable across Python versions than MediaPipe
try:
    import cv2
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_detector = cv2.CascadeClassifier(cascade_path)
    if face_detector.empty():
        logger.warning("❌ Failed to load Haar Cascade from default path. Detection will be disabled.")
        face_detector = None
    else:
        logger.info("✅ Robust Face Detection (OpenCV) initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize face detection: {e}")

def load_model_safely(path, name):
    if not os.path.exists(path):
        logger.warning(f"Model {name} not found at {path}")
        return None
    try:
        # Avoid compile error for models with custom metrics/layers
        model = tf.keras.models.load_model(path, compile=False)
        logger.info(f"✅ Success: {name} model loaded from {path}")
        return model
    except Exception as e:
        logger.error(f"❌ Error loading {name} model: {e}")
        return None

# Initial Load
model_cube = load_model_safely(MODEL_CUBE_PATH, "CUBE")
model_clock = load_model_safely(MODEL_CLOCK_PATH, "CLOCK")
# model_clock = tf.keras.models.load_model(
#     os.path.join(BASE_DIR, 'model_clock.keras'),
#     compile=False
# )

print("Loaded model outputs:", model_clock.outputs)
print("Output count:", len(model_clock.outputs))
model_emotions = load_model_safely(MODEL_EMOTIONS_PATH, "EMOTIONS")

# FER Classes
EMOTION_CLASSES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

def preprocess_for_cube(img):
    """Preprocessing aligned with MobileNetV2 training"""
    img = img.convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img).astype('float32')
    img_array = np.expand_dims(img_array, axis=0)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array

def preprocess_for_clock(img):
    """Matches common MobileNetV2 preprocessing"""
    img = img.convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array

def preprocess_for_emotions(img):
    """
    Improved preprocessing with Face Cropping using OpenCV Haar Cascades.
    This ensures the model only sees the face, matching training conditions.
    """
    global face_detector
    img_array = np.array(img)
    
    # Process only if detector is available
    if face_detector is not None:
        try:
            # Haar requires grayscale
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            faces = face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50))
            
            if len(faces) > 0:
                # Pick the largest face found
                (x, y, w, h) = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
                
                # Add a small margin (20%)
                margin_w = int(w * 0.2)
                margin_h = int(h * 0.2)
                img_h, img_w, _ = img_array.shape
                
                start_x = max(0, x - margin_w)
                start_y = max(0, y - margin_h)
                end_x = min(img_w, x + w + margin_w)
                end_y = min(img_h, y + h + margin_h)
                
                face_img = img_array[start_y:end_y, start_x:end_x]
                if face_img.size > 0:
                    # Aplicar CLAHE para resaltar rasgos sutiles (cejas, boca)
                    try:
                        lab = cv2.cvtColor(face_img, cv2.COLOR_RGB2LAB)
                        l, a, b = cv2.split(lab)
                        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                        cl = clahe.apply(l)
                        limg = cv2.merge((cl, a, b))
                        face_img = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
                    except Exception as e:
                        logger.warning(f"Error applying CLAHE: {e}")
                    
                    img = Image.fromarray(face_img).resize((224, 224))
                else:
                    img = img.resize((224, 224))
            else:
                img = img.resize((224, 224))
        except Exception as e:
            logger.warning(f"Detection error: {e}")
            img = img.resize((224, 224))
    else:
        # Fallback if detector failed to init or is not supported
        img = img.resize((224, 224))
        
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    # Robust EfficientNet preprocessing
    try:
        # Some TF versions prefer this path
        img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
    except AttributeError:
        # Fallback for other TF installations
        import tensorflow.keras.applications.efficientnet as efnet
        img_array = efnet.preprocess_input(img_array)
    return img_array

@app.route('/api/evaluate-cube', methods=['POST'])
def evaluate_cube():
    if model_cube is None:
        return jsonify({"error": "Cube model not loaded"}), 500
    
    try:
        data = request.get_json()
        image_data = data.get('image', '')
        if not image_data.startswith('data:image'):
            return jsonify({"error": "Invalid image format"}), 400

        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_bytes))
        
        img_array = preprocess_for_cube(img)
        preds = model_cube.predict(img_array, verbose=0)
        prob = float(preds[0][0])
        
        # In binary classification, check which class is which. 
        # Typically 0=Correct if folder order was 'correct' then 'incorrect'
        # Adjust logic based on training labels:
        score = 1 if prob < 0.5 else 0
        
        logger.info(f"[CUBE] Prob: {prob:.4f} -> Score: {score}")
        return jsonify({"score": score, "probability": prob})
    except Exception as e:
        logger.error(f"Error evaluating cube: {e}")
        return jsonify({"error": str(e)}), 500

def detect_circle_contour(img_pil):
    img = np.array(img_pil.convert("L"))
    img = cv2.GaussianBlur(img, (5,5), 0)
    edges = cv2.Canny(img, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 2000:
            continue

        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue

        circularity = 4 * np.pi * (area / (perimeter * perimeter))

        if 0.6 < circularity < 1.3:
            return True

    return False

@app.route('/api/evaluate-clock', methods=['POST'])
def evaluate_clock():
    if model_clock is None:
        return jsonify({"error": "Clock model not loaded"}), 500

    try:
        data = request.get_json()
        image_data = data.get('image', '')

        if not image_data or ',' not in image_data:
            return jsonify({"error": "Invalid image data"}), 400

        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        img_array = preprocess_for_clock(img)
        preds = model_clock.predict(img_array, verbose=0)
        print(type(preds))
        print(len(preds))
        print(preds)
        print([p.shape for p in preds])
        # Cada salida es independiente: contorno, numeros, agujas
        prob_contorno = float(np.squeeze(preds[0]))
        prob_numeros  = float(np.squeeze(preds[1]))
        prob_agujas   = float(np.squeeze(preds[2]))

        p_contorno = 1 if prob_contorno >= 0.8 else 0
        p_numeros  = 1 if prob_numeros  >= 0.999 else 0
        p_agujas   = 1 if prob_agujas   >= 0.9 else 0

        if not p_contorno:
            if detect_circle_contour(img):
                p_contorno = 1
        
        total = p_contorno + p_numeros + p_agujas

        logger.info(
            f"[CLOCK] contorno={prob_contorno:.4f}, numeros={prob_numeros:.4f}, agujas={prob_agujas:.4f} -> total={total}"
        )

        return jsonify({
            "score": total,
            "detail": {
                "contorno": p_contorno,
                "numeros": p_numeros,
                "agujas": p_agujas
            },
            "probabilities": {
                "contorno": round(prob_contorno, 4),
                "numeros": round(prob_numeros, 4),
                "agujas": round(prob_agujas, 4)
            }
        })

    except Exception as e:
        logger.error(f"Clock evaluation error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/evaluate-emotion', methods=['POST'])
def evaluate_emotion():
    if model_emotions is None:
        return jsonify({"error": "Emotion model not loaded"}), 500

    try:
        data = request.get_json()
        image_data = data.get('image', '')
        if not image_data or ',' not in image_data:
            return jsonify({"error": "Invalid image data"}), 400

        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        # Preprocess and Predict
        img_array = preprocess_for_emotions(img)
        preds = model_emotions.predict(img_array, verbose=0)[0]
        
        # --- Aplicar Pesos de Sensibilidad para Tristeza y Enojo ---
        # Si estas emociones superan un umbral de ruido, les damos un boost (1.2x)
        weights = {
            'angry': 1.25,
            'sad': 1.2,
            'neutral': 0.9  # Reducimos ligeramente neutral para evitar que "se coma" a las demás
        }
        
        weighted_preds = np.copy(preds)
        for i, cls in enumerate(EMOTION_CLASSES):
            if cls in weights:
                weighted_preds[i] *= weights[cls]
        
        # Normalizar de nuevo para que sumen 1
        weighted_preds = weighted_preds / np.sum(weighted_preds)
        
        idx = int(np.argmax(weighted_preds))
        confidence = float(weighted_preds[idx])
        emotion = EMOTION_CLASSES[idx]
        
        all_probs = {EMOTION_CLASSES[i]: round(float(weighted_preds[i]), 4) for i in range(len(EMOTION_CLASSES))}
        
        logger.info(f"[EMOTION] Detected: {emotion} ({confidence:.2f}) - Adjusted logic applied")
        return jsonify({
            "emotion": emotion,
            "confidence": confidence,
            "all_emotions": all_probs,
            "original_top": EMOTION_CLASSES[int(np.argmax(preds))] # Para debug
        })
    except Exception as e:
        logger.error(f"Error in evaluate-emotion: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/extract-features', methods=['POST'])
def extract_features():
    if model_emotions is None:
        return jsonify({"error": "Emotion model not loaded"}), 500
    try:
        data = request.get_json()
        image_data = data.get('image', '')
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_bytes))
        
        img_array = preprocess_for_emotions(img)
        
        # We target the layer before the last two (Dense 128)
        # MobileNetV2 output -> GAP -> Dense 128 -> Dropout -> Dense 7
        # So layers[-4] would be GAP or similar. Let's find GAP.
        gap_layer = next(l for l in reversed(model_emotions.layers) if 'global_average_pooling2d' in l.name)
        feat_model = tf.keras.Model(inputs=model_emotions.input, outputs=gap_layer.output)
        features = feat_model.predict(img_array, verbose=0)[0]
        
        return jsonify({"features": features.tolist()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Multimodal Integration Module (MIIM) Import
from multimodal_engine import run_multimodal_analysis
import pickle

# Path for Multimodal Model in ai_models
MODEL_MULTIMODAL_PATH = os.path.join(BASE_DIR, 'ai_models', 'multimodal_dtree_model.pkl')
multimodal_model_data = None

def load_multimodal_model():
    global multimodal_model_data
    if not os.path.exists(MODEL_MULTIMODAL_PATH):
        logger.warning(f"MIIM Predictive model not found at {MODEL_MULTIMODAL_PATH}. Camino B will be disabled.")
        return None
    try:
        with open(MODEL_MULTIMODAL_PATH, 'rb') as f:
            data = pickle.load(f)
            logger.info("✅ Success: MIIM Predictive model loaded")
            return data
    except Exception as e:
        logger.error(f"❌ Error loading MIIM model: {e}")
        return None

multimodal_model_data = load_multimodal_model()

@app.route('/api/multimodal-integration', methods=['POST'])
def multimodal_integration():
    """
    Endpoint principal para la integración e interpretación multimodal.
    Soporta:
    - mode='rules' (Camino A - Motor de Reglas, Default)
    - mode='predictive' (Camino B - Árbol de Decisión)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        mode = request.args.get('mode', 'rules') # 'rules' o 'predictive'
        
        # Ejecutar análisis core (Camino A ya calcule todo lo necesario)
        analysis_result = run_multimodal_analysis(data)
        
        # Si el modo es predictivo, sobreescribir confiabilidad con la predicción del modelo
        if mode == 'predictive':
            if multimodal_model_data is None:
                analysis_result['predictive_model_status'] = "Model not loaded, falling back to rules"
            else:
                try:
                    clf = multimodal_model_data['model']
                    le = multimodal_model_data['label_encoder']
                    features_list = multimodal_model_data['features']
                    
                    # Preparar vector de características
                    # FEATURES = ['moca_total_score','negative_emotion_ratio','emotion_volatility',
                    #             'clock_score','cube_score','stress_index','dominant_emotion_encoded']
                    
                    moca_score = data.get('moca', {}).get('total_score', 0)
                    emotions = data.get('emotions', {})
                    dist = emotions.get('distribution', {})
                    neg_ratio = sum([dist.get(e, 0) for e in ['angry', 'fear', 'sad', 'disgust']])
                    volatility = emotions.get('volatility', 0)
                    clock_score = data.get('clock', {}).get('score', 0)
                    cube_score = data.get('cube', {}).get('score', 0)
                    stress = emotions.get('stress_index', 0.5)
                    dom_em = emotions.get('dominant_emotion', 'neutral')
                    
                    # Codificar emoción dominante
                    dom_em_encoded = le.transform([dom_em])[0] if dom_em in le.classes_ else le.transform(['neutral'])[0]
                    
                    feature_vector = np.array([[
                        moca_score, neg_ratio, volatility, 
                        clock_score, cube_score, stress, dom_em_encoded
                    ]])
                    
                    prediction = clf.predict(feature_vector)[0]
                    # Convertir etiqueta de predicción a confiabilidad
                    # label: 'posiblemente_sesgado' | 'confiable'
                    analysis_result['predictive_reliability'] = "baja/media" if prediction == 'posiblemente_sesgado' else "alta"
                    analysis_result['result_reliability'] = analysis_result['predictive_reliability'] # Override
                    analysis_result['analysis_mode'] = "predictive (Camino B)"
                    
                except Exception as e:
                    logger.error(f"Error in predictive mode: {e}")
                    analysis_result['predictive_error'] = str(e)
                    analysis_result['analysis_mode'] = "rules (fallback due to error)"
        else:
            analysis_result['analysis_mode'] = "rules (Camino A)"
            
        logger.info(f"[MULTIMODAL] Analysis complete. Mode: {mode}, Reliability: {analysis_result['result_reliability']}")
        return jsonify(analysis_result)

    except Exception as e:
        logger.error(f"Multimodal integration error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting refined Model Server on port 5001...")
    # Add project root to sys path to ensure multimodal_engine is importable
    import sys
    sys.path.append(BASE_DIR)
    app.run(host='0.0.0.0', port=5001, debug=False)
