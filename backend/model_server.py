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
import keras

# Workaround for Keras 3.x 'quantization_config' serialization bug
@keras.saving.register_keras_serializable()
class FixedDense(keras.layers.Dense):
    def __init__(self, *args, **kwargs):
        kwargs.pop('quantization_config', None)
        super().__init__(*args, **kwargs)

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ModelServer")

app = Flask(__name__)
CORS(app)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
MODEL_CUBE_PATH = os.path.join(BASE_DIR, 'model_cube.h5')
MODEL_CLOCK_PATH = os.path.join(BASE_DIR, 'model_clock.h5')
# Link to the newly trained emotion model
MODEL_EMOTIONS_PATH = os.path.join(ROOT_DIR, 'models', 'best_model_final.h5')

# Global Model Variables
model_cube = None
model_clock = None
model_emotions = None

def load_model_safely(path, name):
    if not os.path.exists(path):
        logger.warning(f"Model {name} not found at {path}")
        return None
    try:
        # Use FixedDense to handle 'quantization_config' issue in Keras 3 models
        model = keras.models.load_model(path, compile=False, custom_objects={'Dense': FixedDense})
        logger.info(f"✅ Success: {name} model loaded from {path}")
        return model
    except Exception as e:
        logger.error(f"❌ Error loading {name} model: {e}")
        return None

# Initial Load
model_cube = load_model_safely(MODEL_CUBE_PATH, "CUBE")
model_clock = load_model_safely(MODEL_CLOCK_PATH, "CLOCK")
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
    """Matches the FER pipeline preprocessing"""
    img = img.convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
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

@app.route('/api/evaluate-clock', methods=['POST'])
def evaluate_clock():
    if model_clock is None:
        return jsonify({"error": "Clock model not loaded"}), 500
    
    try:
        data = request.get_json()
        image_data = data.get('image', '')
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_bytes))
        
        img_array = preprocess_for_clock(img)
        preds = model_clock.predict(img_array, verbose=0)
        
        # Assuming multi-label output [circle, numbers, hands]
        p_contorno = 1 if float(preds[0][0]) >= 0.5 else 0
        p_numeros  = 1 if float(preds[0][1]) >= 0.5 else 0
        p_agujas   = 1 if float(preds[0][2]) >= 0.5 else 0
        
        total = p_contorno + p_numeros + p_agujas
        logger.info(f"[CLOCK] Result: {total}/3")
        
        return jsonify({
            "score": total,
            "detail": {"contorno": p_contorno, "numeros": p_numeros, "agujas": p_agujas}
        })
    except Exception as e:
        logger.error(f"Error evaluating clock: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/evaluate-emotion', methods=['POST'])
def evaluate_emotion():
    if model_emotions is None:
        return jsonify({"error": "Emotion model not loaded"}), 500

    try:
        data = request.get_json()
        image_data = data.get('image', '')
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_bytes))
        
        img_array = preprocess_for_emotions(img)
        preds = model_emotions.predict(img_array, verbose=0)[0]
        
        idx = int(np.argmax(preds))
        confidence = float(preds[idx])
        emotion = EMOTION_CLASSES[idx]
        
        all_probs = {EMOTION_CLASSES[i]: round(float(preds[i]), 4) for i in range(len(EMOTION_CLASSES))}
        
        logger.info(f"[EMOTION] Detected: {emotion} ({confidence:.2f})")
        return jsonify({
            "emotion": emotion,
            "confidence": confidence,
            "all_emotions": all_probs
        })
    except Exception as e:
        logger.error(f"Error evaluating emotion: {e}")
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

if __name__ == '__main__':
    logger.info("Starting refined Model Server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)
