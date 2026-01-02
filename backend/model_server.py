import base64
import io
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf
from flask_cors import CORS
import os
import time

app = Flask(__name__)
CORS(app)

# Carpeta para imágenes recibidas (opcional)
RECEIVED_IMAGES_DIR = 'received_images'
if not os.path.exists(RECEIVED_IMAGES_DIR):
    os.makedirs(RECEIVED_IMAGES_DIR)

# Cargar modelo para el cubo
MODEL_CUBE_PATH = 'model_cube.h5'
try:
    model_cube = tf.keras.models.load_model(MODEL_CUBE_PATH)
    print(f"Modelo de CUBO cargado correctamente desde {MODEL_CUBE_PATH}.")
except Exception as e:
    print(f"Error al cargar el modelo de cubo desde {MODEL_CUBE_PATH}: {e}")
    model_cube = None

# Cargar modelo para el reloj
MODEL_CLOCK_PATH = 'model_clock.h5'
try:
    model_clock = tf.keras.models.load_model(MODEL_CLOCK_PATH)
    print(f"Modelo de RELOJ cargado correctamente desde {MODEL_CLOCK_PATH}.")
except Exception as e:
    print(f"Error al cargar el modelo de reloj desde {MODEL_CLOCK_PATH}: {e}")
    model_clock = None

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
        print(f"Error al procesar la imagen de cubo: {e}")
        return jsonify({"error": "Error al procesar la imagen del cubo."}), 500


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



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
