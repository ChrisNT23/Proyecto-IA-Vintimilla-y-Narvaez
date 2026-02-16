"""
Servidor Flask mejorado con CNNs avanzadas para evaluación de dibujos MoCA.
Incluye soporte para modelos personalizados y detección de emociones.
"""

import base64
import io
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf
from flask_cors import CORS
import os
import time
import json

app = Flask(__name__)
CORS(app)

# Configuración
RECEIVED_IMAGES_DIR = 'received_images'
if not os.path.exists(RECEIVED_IMAGES_DIR):
    os.makedirs(RECEIVED_IMAGES_DIR)

IMG_HEIGHT = 224
IMG_WIDTH = 224

# Cargar modelos
models_loaded = {}

def load_model(model_name, model_path):
    """Carga un modelo de TensorFlow."""
    try:
        if os.path.exists(model_path):
            model = tf.keras.models.load_model(model_path)
            models_loaded[model_name] = model
            print(f"✅ Modelo {model_name} cargado desde {model_path}")
            return model
        else:
            print(f"⚠️  Modelo {model_path} no encontrado")
            return None
    except Exception as e:
        print(f"❌ Error al cargar {model_name}: {e}")
        return None

# Cargar modelos disponibles
print("=== Cargando Modelos ===")

# Modelo de cubo (intentar cargar versión mejorada primero)
cube_model = load_model('cube', 'model_cube_improved.h5')
if cube_model is None:
    cube_model = load_model('cube', 'model_cube_finetuned.h5')
if cube_model is None:
    cube_model = load_model('cube', 'model_cube.h5')

# Modelo de reloj
clock_model = load_model('clock', 'model_clock_improved.h5')
if clock_model is None:
    clock_model = load_model('clock', 'model_clock_finetuned.h5')
if clock_model is None:
    clock_model = load_model('clock', 'model_clock.h5')

# Modelo de emociones (opcional)
emotion_model = load_model('emotions', 'model_emotions_finetuned.h5')
if emotion_model is None:
    emotion_model = load_model('emotions', 'model_emotions.h5')

# Cargar mapeo de clases de emociones
emotion_classes = None
if emotion_model:
    try:
        with open('emotion_classes.json', 'r') as f:
            emotion_classes = json.load(f)
        print(f"✅ Mapeo de emociones cargado: {emotion_classes}")
    except:
        # Mapeo por defecto
        emotion_classes = {
            "0": "neutral",
            "1": "happy",
            "2": "sad",
            "3": "angry",
            "4": "fearful",
            "5": "disgusted",
            "6": "surprised"
        }

def preprocess_image_for_model(img, model_type='efficientnet'):
    """
    Preprocesa imagen según el tipo de modelo base.
    
    Args:
        img: PIL Image
        model_type: 'efficientnet', 'mobilenet', 'resnet', etc.
    """
    img = img.convert('RGB')
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    
    # Preprocesamiento según el modelo
    if model_type == 'efficientnet':
        img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
    elif model_type == 'mobilenet':
        img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    elif model_type == 'resnet':
        img_array = tf.keras.applications.resnet50.preprocess_input(img_array)
    else:
        # Normalización estándar
        img_array = img_array / 255.0
    
    return img_array

@app.route('/api/evaluate-cube', methods=['POST'])
def evaluate_cube():
    """Endpoint para evaluar el dibujo del cubo."""
    if models_loaded.get('cube') is None:
        return jsonify({"error": "No se cargó el modelo de cubo."}), 500

    data = request.get_json()
    image_data = data.get('image', '')

    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    try:
        # Decodificar imagen
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)

        # Guardar imagen
        timestamp = int(time.time())
        image_filename = os.path.join(RECEIVED_IMAGES_DIR, f"cube_{timestamp}.png")
        with open(image_filename, "wb") as f:
            f.write(img_bytes)
        print(f"📸 Imagen (CUBO) guardada: {image_filename}")

        # Procesar imagen
        img = Image.open(io.BytesIO(img_bytes))
        img_array = preprocess_image_for_model(img, model_type='efficientnet')

        # Predicción
        model = models_loaded['cube']
        preds = model.predict(img_array, verbose=0)
        
        # Manejar diferentes formatos de salida
        if len(preds[0].shape) == 0:  # Escalar
            probabilidad = float(preds[0])
        else:
            probabilidad = float(preds[0][0])

        # Lógica de puntuación mejorada
        # Umbral ajustable según el modelo
        threshold = 0.5
        score = 1 if probabilidad >= threshold else 0

        print(f"[CUBO] Score: {score}, Probabilidad: {probabilidad:.4f}")
        
        return jsonify({
            "score": score,
            "confidence": round(probabilidad, 4),
            "details": {
                "correct": probabilidad >= threshold,
                "probability": probabilidad
            }
        })

    except Exception as e:
        print(f"❌ Error al procesar cubo: {e}")
        return jsonify({"error": f"Error al procesar la imagen del cubo: {str(e)}"}), 500

@app.route('/api/evaluate-clock', methods=['POST'])
def evaluate_clock():
    """Endpoint para evaluar el dibujo del reloj."""
    if models_loaded.get('clock') is None:
        return jsonify({"error": "No se cargó el modelo de reloj."}), 500

    data = request.get_json()
    image_data = data.get('image', '')

    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    try:
        # Decodificar imagen
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)

        # Guardar imagen
        timestamp = int(time.time())
        image_filename = os.path.join(RECEIVED_IMAGES_DIR, f"clock_{timestamp}.png")
        with open(image_filename, "wb") as f:
            f.write(img_bytes)
        print(f"📸 Imagen (RELOJ) guardada: {image_filename}")

        # Procesar imagen
        img = Image.open(io.BytesIO(img_bytes))
        img_array = preprocess_image_for_model(img, model_type='efficientnet')

        # Predicción
        model = models_loaded['clock']
        preds = model.predict(img_array, verbose=0)
        
        # Extraer probabilidades (3 salidas: contorno, números, agujas)
        prob_contorno = float(preds[0][0])
        prob_numeros = float(preds[0][1])
        prob_agujas = float(preds[0][2])

        # Asignar puntos con umbral
        threshold = 0.5
        p_contorno = 1 if prob_contorno >= threshold else 0
        p_numeros = 1 if prob_numeros >= threshold else 0
        p_agujas = 1 if prob_agujas >= threshold else 0

        total_score = p_contorno + p_numeros + p_agujas

        print(f"[RELOJ] contorno={p_contorno}, numeros={p_numeros}, agujas={p_agujas} => total={total_score}")

        return jsonify({
            "score": total_score,  # 0, 1, 2, 3
            "detail": {
                "contorno": {
                    "score": p_contorno,
                    "confidence": round(prob_contorno, 4)
                },
                "numeros": {
                    "score": p_numeros,
                    "confidence": round(prob_numeros, 4)
                },
                "agujas": {
                    "score": p_agujas,
                    "confidence": round(prob_agujas, 4)
                }
            }
        })

    except Exception as e:
        print(f"❌ Error al procesar reloj: {e}")
        return jsonify({"error": f"Error al procesar la imagen del reloj: {str(e)}"}), 500

@app.route('/api/evaluate-emotion', methods=['POST'])
def evaluate_emotion():
    """
    Endpoint para evaluar emociones faciales usando CNN personalizada.
    Alternativa a face-api.js.
    """
    if models_loaded.get('emotions') is None:
        return jsonify({"error": "No se cargó el modelo de emociones."}), 500

    data = request.get_json()
    image_data = data.get('image', '')

    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    try:
        # Decodificar imagen
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)

        # Procesar imagen (asumiendo que ya está recortada al rostro)
        img = Image.open(io.BytesIO(img_bytes))
        img_array = preprocess_image_for_model(img, model_type='efficientnet')

        # Predicción
        model = models_loaded['emotions']
        preds = model.predict(img_array, verbose=0)[0]

        # Obtener emoción con mayor probabilidad
        emotion_idx = int(np.argmax(preds))
        confidence = float(preds[emotion_idx])

        # Mapear índice a nombre de emoción
        emotion_name = emotion_classes.get(str(emotion_idx), f"emotion_{emotion_idx}")

        # Retornar todas las emociones con sus probabilidades
        all_emotions = {}
        for idx, prob in enumerate(preds):
            emotion = emotion_classes.get(str(idx), f"emotion_{idx}")
            all_emotions[emotion] = round(float(prob), 4)

        print(f"[EMOCION] Detectada: {emotion_name} ({confidence:.4f})")

        return jsonify({
            "emotion": emotion_name,
            "confidence": round(confidence, 4),
            "all_emotions": all_emotions
        })

    except Exception as e:
        print(f"❌ Error al procesar emoción: {e}")
        return jsonify({"error": f"Error al procesar la imagen de emoción: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar el estado de los modelos."""
    status = {
        "status": "ok",
        "models_loaded": list(models_loaded.keys()),
        "models_status": {}
    }
    
    for name, model in models_loaded.items():
        status["models_status"][name] = {
            "loaded": True,
            "input_shape": str(model.input_shape),
            "output_shape": str(model.output_shape)
        }
    
    return jsonify(status)

if __name__ == '__main__':
    print("\n=== Servidor de Modelos CNN Iniciado ===")
    print(f"Modelos cargados: {list(models_loaded.keys())}")
    print("Servidor corriendo en http://0.0.0.0:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)

