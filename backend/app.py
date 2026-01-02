import base64
import io
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf
from flask_cors import CORS  # Importar CORS

app = Flask(__name__)
CORS(app)  # Aplicar CORS a toda la aplicación

# Cargar el modelo al iniciar la app
model = tf.keras.models.load_model('model.h5')  # Asegúrate de que 'model.h5' esté en la ruta correcta
img_height = 224
img_width = 224

def preprocess_image(img):
    # img es un objeto PIL
    img = img.convert('RGB')
    img = img.resize((img_width, img_height))  # Redimensionar la imagen
    img_array = np.array(img)  # Convertir a numpy array
    img_array = np.expand_dims(img_array, axis=0)  # Agregar dimensión batch
    # Normalizar según el preprocesamiento usado en el entrenamiento
    # Si usaste MobileNetV2 con pesos de ImageNet:
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array

@app.route('/api/evaluate-cube', methods=['POST'])
def evaluate():
    data = request.get_json()
    image_data = data.get('image', '')

    if not image_data.startswith('data:image'):
        return jsonify({"error": "No es una imagen válida."}), 400

    header, encoded = image_data.split(',', 1)
    img_bytes = base64.b64decode(encoded)

    img = Image.open(io.BytesIO(img_bytes))
    img_array = preprocess_image(img)

    # Realizar inferencia con el modelo
    preds = model.predict(img_array)
    # preds es una probabilidad entre 0 y 1 (asumiendo activación sigmoid)
    # Si preds[0][0] >= 0.5 => correcto, else incorrecto
    score = 1 if preds[0][0] >= 0.5 else 0

    return jsonify({"score": int(score)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
