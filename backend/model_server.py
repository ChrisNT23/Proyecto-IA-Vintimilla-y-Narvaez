import base64
import io
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf
from flask_cors import CORS
import os
import time
import sys

app = Flask(__name__)
CORS(app)

# Configurar codificación UTF-8 para Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Usar ruta absoluta basada en el directorio del script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Carpeta para imágenes recibidas (opcional)
RECEIVED_IMAGES_DIR = os.path.join(BASE_DIR, 'received_images')
if not os.path.exists(RECEIVED_IMAGES_DIR):
    os.makedirs(RECEIVED_IMAGES_DIR)

def load_model_compatible(model_path):
    """
    Carga un modelo de Keras con compatibilidad hacia atrás.
    Maneja problemas de incompatibilidad entre versiones de Keras/TensorFlow.
    """
    if not os.path.exists(model_path):
        return None
    
    # Crear objetos personalizados para compatibilidad
    custom_objects = {}
    
    # Manejar DTypePolicy (versiones antiguas de Keras usan este formato)
    try:
        # Intentar obtener DTypePolicy de mixed_precision
        if hasattr(tf.keras, 'mixed_precision'):
            try:
                policy = tf.keras.mixed_precision.Policy('float32')
                # Registrar el tipo de Policy como DTypePolicy para compatibilidad
                custom_objects['DTypePolicy'] = lambda **kwargs: tf.keras.mixed_precision.Policy('float32')
            except:
                pass
        
        # Si no funciona, crear una clase compatible
        if 'DTypePolicy' not in custom_objects:
            class DTypePolicyCompat:
                def __init__(self, name='float32'):
                    self.name = name
                
                @classmethod
                def from_config(cls, config):
                    name = config.get('name', 'float32') if isinstance(config, dict) else 'float32'
                    return cls(name=name)
                
                def __call__(self, *args, **kwargs):
                    return 'float32'
            
            custom_objects['DTypePolicy'] = DTypePolicyCompat
    except Exception as e:
        # Si falla, usar una implementación mínima
        class DTypePolicyCompat:
            @classmethod
            def from_config(cls, config):
                return 'float32'
        custom_objects['DTypePolicy'] = DTypePolicyCompat
    
    # Manejar InputLayer con batch_shape
    try:
        from tensorflow.keras.layers import InputLayer as OriginalInputLayer
        
        class CompatibleInputLayer(OriginalInputLayer):
            @classmethod
            def from_config(cls, config):
                # Remover batch_shape si existe y convertir a input_shape
                if isinstance(config, dict) and 'batch_shape' in config:
                    batch_shape = config.pop('batch_shape')
                    if batch_shape is not None and len(batch_shape) > 1:
                        config['input_shape'] = batch_shape[1:]
                return super().from_config(config)
        
        custom_objects['InputLayer'] = CompatibleInputLayer
    except:
        pass
    
    # Intentar múltiples estrategias de carga
    strategies = [
        # Estrategia 1: Cargar con custom_objects
        lambda: tf.keras.models.load_model(model_path, compile=False, custom_objects=custom_objects),
        # Estrategia 2: Cargar sin custom_objects (por si el modelo es compatible)
        lambda: tf.keras.models.load_model(model_path, compile=False),
        # Estrategia 3: Intentar con tf.compat.v1 para modelos muy antiguos
        lambda: tf.compat.v1.keras.models.load_model(model_path, compile=False) if hasattr(tf.compat.v1, 'keras') else None,
    ]
    
    last_error = None
    for i, strategy in enumerate(strategies, 1):
        try:
            model = strategy()
            if model is not None:
                return model
        except Exception as e:
            last_error = e
            if i < len(strategies):
                continue  # Intentar siguiente estrategia
    
    # Si todas las estrategias fallaron, mostrar el error
    if last_error:
        error_str = str(last_error)
        if 'DTypePolicy' in error_str or 'batch_shape' in error_str or 'Unrecognized keyword' in error_str:
            # Error de incompatibilidad - no mostrar traceback completo
            pass
        else:
            # Otro tipo de error - podría ser útil verlo
            import traceback
            traceback.print_exc()
    
    return None

# Cargar modelo para el cubo (intentar versiones mejoradas primero)
model_cube = None
cube_model_paths = [
    os.path.join(BASE_DIR, 'model_cube_improved_best.h5'),
    os.path.join(BASE_DIR, 'model_cube_improved.h5'),
    os.path.join(BASE_DIR, 'model_cube_finetuned.h5'),
    os.path.join(BASE_DIR, 'model_cube.h5')
]

for MODEL_CUBE_PATH in cube_model_paths:
    model_cube = load_model_compatible(MODEL_CUBE_PATH)
    if model_cube:
        print(f"Modelo de CUBO cargado correctamente desde {MODEL_CUBE_PATH}.")
        break

if not model_cube:
    print(f"ERROR: No se pudo cargar ningun modelo de cubo. Se intentaron:")
    for path in cube_model_paths:
        print(f"  - {path}")

# Cargar modelo para el reloj
MODEL_CLOCK_PATH = os.path.join(BASE_DIR, 'model_clock.h5')
model_clock = load_model_compatible(MODEL_CLOCK_PATH)
if model_clock:
    print(f"Modelo de RELOJ cargado correctamente desde {MODEL_CLOCK_PATH}.")
else:
    print(f"ERROR: No se pudo cargar el modelo de reloj desde {MODEL_CLOCK_PATH}")

# Cargar modelo para emociones (opcional, intenta cargar versión mejorada primero)
MODEL_EMOTIONS_PATH = os.path.join(BASE_DIR, 'model_emotions_finetuned.h5')
model_emotions = load_model_compatible(MODEL_EMOTIONS_PATH)
if model_emotions:
    print(f"Modelo de EMOCIONES cargado desde {MODEL_EMOTIONS_PATH}.")
else:
    MODEL_EMOTIONS_PATH = os.path.join(BASE_DIR, 'model_emotions.h5')
    model_emotions = load_model_compatible(MODEL_EMOTIONS_PATH)
    if model_emotions:
        print(f"Modelo de EMOCIONES cargado desde {MODEL_EMOTIONS_PATH}.")
    else:
        print(f"Modelo de emociones no encontrado. CNN de emociones no disponible.")

# Mapeo de clases de emociones
emotion_classes = {
    "0": "neutral",
    "1": "happy",
    "2": "sad",
    "3": "angry",
    "4": "fearful",
    "5": "disgusted",
    "6": "surprised"
}

img_height = 224
img_width = 224

def preprocess_image(img):
    """
    Preprocesa la imagen para que sea compatible con, por ejemplo, MobileNetV2.
    Ajusta según la forma en que entrenaste los modelos.
    """
    img = img.convert('RGB')
    img = img.resize((img_width, img_height))
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    # Preprocesamiento (ejemplo) de MobileNetV2
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array

@app.route('/api/evaluate-cube', methods=['POST'])
def evaluate_cube():
    """
    Endpoint para evaluar el dibujo del cubo.
    Retorna {"score": 0 or 1} según se considere incorrecto o correcto.
    """
    if model_cube is None:
        return jsonify({"error": "No se cargó el modelo de cubo."}), 500

    data = request.get_json()
    image_data = data.get('image', '')

    # Validar que la imagen está en formato base64
    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    try:
        # Decodificar la imagen
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)

        # Guardar imagen recibida (opcional)
        timestamp = int(time.time())
        image_filename = os.path.join(RECEIVED_IMAGES_DIR, f"cube_{timestamp}.png")
        with open(image_filename, "wb") as f:
            f.write(img_bytes)
        print(f"Imagen (CUBO) recibida y guardada como {image_filename}")

        # Procesar la imagen
        img = Image.open(io.BytesIO(img_bytes))
        img_array = preprocess_image(img)

        # Realizar inferencia con modelo_cube
        preds = model_cube.predict(img_array)
        probabilidad = float(preds[0][0])

        # Lógica de puntuación: Ajusta tu umbral según tu conveniencia
        # Ejemplo: >= 0.5 es 1 (correcto), si no 0
        score = 0 if probabilidad >= 0.7 else 1

        print(f"[CUBO] Puntaje asignado: {score}, Prob: {probabilidad:.4f}")
        return jsonify({"score": score})

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error al procesar la imagen de cubo: {e}")
        print(f"Detalles del error:\n{error_details}")
        return jsonify({"error": f"Error al procesar la imagen del cubo: {str(e)}"}), 500


@app.route('/api/evaluate-clock', methods=['POST'])
def evaluate_clock():
    """
    Endpoint para evaluar el dibujo del reloj con 3 criterios:
    contorno, numeros, agujas.
    Retorna un total de 0 a 3, y el desglose.
    """
    if model_clock is None:
        return jsonify({"error": "No se cargó el modelo de reloj."}), 500

    data = request.get_json()
    image_data = data.get('image', '')

    # Validar que la imagen está en formato base64
    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    try:
        # Decodificar la imagen
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)

        # Guardar imagen recibida (opcional)
        timestamp = int(time.time())
        image_filename = os.path.join(RECEIVED_IMAGES_DIR, f"clock_{timestamp}.png")
        with open(image_filename, "wb") as f:
            f.write(img_bytes)
        print(f"Imagen (RELOJ) recibida y guardada como {image_filename}")

        # Procesar la imagen
        img = Image.open(io.BytesIO(img_bytes))
        img_array = preprocess_image(img)

        # Realizar inferencia con modelo_clock
        preds = model_clock.predict(img_array)
        # Ejemplo preds => [[0.83, 0.12, 0.99]]
        prob_contorno = float(preds[0][0])
        prob_numeros  = float(preds[0][1])
        prob_agujas   = float(preds[0][2])

        # Asignar puntos con un umbral (ej: 0.5)
        p_contorno = 1 if prob_contorno >= 0.5 else 0
        p_numeros  = 1 if prob_numeros >= 0.5 else 0
        p_agujas   = 1 if prob_agujas >= 0.5 else 0

        total_score = p_contorno + p_numeros + p_agujas

        print(f"[RELOJ] contorno={p_contorno}, numeros={p_numeros}, agujas={p_agujas} => total={total_score}")
        return jsonify({
            "score": total_score,  # 0, 1, 2, 3
            "detail": {
                "contorno": p_contorno,
                "numeros": p_numeros,
                "agujas": p_agujas
            }
        })

    except Exception as e:
        print(f"Error al procesar la imagen del reloj: {e}")
        return jsonify({"error": "Error al procesar la imagen del reloj."}), 500

@app.route('/api/evaluate-emotion', methods=['POST'])
def evaluate_emotion():
    """
    Endpoint para evaluar emociones faciales usando CNN personalizada.
    Método principal por defecto.
    """
    if model_emotions is None:
        return jsonify({"error": "No se cargó el modelo de emociones."}), 500

    data = request.get_json()
    image_data = data.get('image', '')

    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    try:
        # Decodificar imagen
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)

        # Procesar imagen
        img = Image.open(io.BytesIO(img_bytes))
        img_array = preprocess_image(img)

        # Predicción
        preds = model_emotions.predict(img_array, verbose=0)[0]

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

        print(f"[EMOCION CNN] Detectada: {emotion_name} ({confidence:.4f})")

        return jsonify({
            "emotion": emotion_name,
            "confidence": round(confidence, 4),
            "all_emotions": all_emotions
        })

    except Exception as e:
        print(f"Error al procesar emocion: {e}")
        return jsonify({"error": f"Error al procesar la imagen de emocion: {str(e)}"}), 500

@app.route('/api/extract-features', methods=['POST'])
def extract_features():
    """
    Endpoint para extraer características CNN de una imagen.
    Retorna el vector de características de la capa intermedia.
    """
    if model_emotions is None:
        return jsonify({"error": "No se cargó el modelo de emociones."}), 500

    data = request.get_json()
    image_data = data.get('image', '')

    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    try:
        # Decodificar imagen
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)

        # Procesar imagen
        img = Image.open(io.BytesIO(img_bytes))
        img_array = preprocess_image(img)

        # Obtener características de una capa intermedia (antes de la capa de salida)
        # Usar la capa antes de la última capa densa
        feature_layer = model_emotions.layers[-2]  # Capa antes de la salida
        feature_model = tf.keras.Model(inputs=model_emotions.input, outputs=feature_layer.output)
        features = feature_model.predict(img_array, verbose=0)[0]

        return jsonify({
            "features": features.tolist(),
            "feature_size": len(features)
        })

    except Exception as e:
        print(f"Error extrayendo caracteristicas: {e}")
        return jsonify({"error": f"Error extrayendo caracteristicas: {str(e)}"}), 500

if __name__ == '__main__':
    print("\n=== Servidor de Modelos CNN ===")
    print(f"Modelos cargados:")
    print(f"  - Cubo: {'OK' if model_cube else 'NO DISPONIBLE'}")
    print(f"  - Reloj: {'OK' if model_clock else 'NO DISPONIBLE'}")
    print(f"  - Emociones: {'OK' if model_emotions else 'NO DISPONIBLE'}")
    print("Servidor corriendo en http://0.0.0.0:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
