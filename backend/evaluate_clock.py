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
CORS(app)  # Permitir CORS

# Cargar el modelo al iniciar la app
try:
    model = tf.keras.models.load_model('clock_model.h5')  # Asegúrate de que 'clock_model.h5' esté en la ruta correcta
    print("Modelo cargado correctamente.")
except Exception as e:
    print(f"Error al cargar el modelo: {e}")
    exit(1)

img_height = 224
img_width = 224

# Crear carpeta para guardar imágenes recibidas
received_images_path = "received_images_clock"
os.makedirs(received_images_path, exist_ok=True)

def preprocess_image(img):
    """
    Preprocesa la imagen para que sea compatible con el modelo.
    """
    img = img.convert('RGB')
    img = img.resize((img_width, img_height))  # Redimensionar la imagen
    img_array = np.array(img)  # Convertir a numpy array
    img_array = np.expand_dims(img_array, axis=0)  # Agregar dimensión batch
    # Normalizar según el preprocesamiento usado en el entrenamiento
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array

@app.route('/api/evaluate-clock', methods=['POST'])
def evaluate_clock():
    """
    Evalúa el dibujo del reloj y devuelve un puntaje de 0 a 3.
    """
    data = request.get_json()
    image_data = data.get('image', '')

    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    try:
        header, encoded = image_data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_bytes))

        # Guardar imagen con fondo blanco
        img_with_bg = Image.new("RGB", img.size, (255, 255, 255))
        img_with_bg.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)

        # Guardar la imagen en el sistema para depuración
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        img_path = os.path.join(received_images_path, f"clock_{timestamp}.png")
        img_with_bg.save(img_path)

        img_array = preprocess_image(img_with_bg)

        # Realizar inferencia con el modelo
        preds = model.predict(img_array)
        # preds contiene tres valores de salida: contorno, números, agujas
        contour_score = 1 if preds[0][0] >= 0.5 else 0
        numbers_score = 1 if preds[0][1] >= 0.5 else 0
        hands_score = 1 if preds[0][2] >= 0.5 else 0

        total_score = contour_score + numbers_score + hands_score

        return jsonify({
            "contour_score": int(contour_score),
            "numbers_score": int(numbers_score),
            "hands_score": int(hands_score),
            "total_score": int(total_score)
        })

    except Exception as e:
        print(f"Error al procesar la imagen: {e}")
        return jsonify({"error": "Error al procesar la imagen."}), 500

if __name__ == '__main__':
    # Ejecutar en el puerto 5002 para no chocar con el servicio del cubo
    app.run(host='0.0.0.0', port=5002, debug=True)
