// Servidor Python (model_server.py): Carga de modelos y predicción
app = Flask(__name__)
MODEL_CUBE_PATH = 'model_cube.h5'
# Cargar modelo sin compilar para evitar errores de arquitectura personalizada
model_cube = tf.keras.models.load_model(MODEL_CUBE_PATH, compile=False)

@app.route('/api/evaluate-cube', methods=['POST'])
def evaluate_cube():
    data = request.get_json()
    image_data = data.get('image', '')
    # Decodificar base64 a imagen PIL
    img_bytes = base64.b64decode(image_data.split(',', 1)[1])
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB').resize((224, 224))
    # Preprocesamiento MobileNetV2
    img_array = np.array(img).astype('float32')
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(np.expand_dims(img_array, axis=0))
    # Inferencia
    preds = model_cube.predict(img_array, verbose=0)
    prob = float(preds[0][0])
    # Respuesta JSON
    score = 1 if prob < 0.5 else 0
    return jsonify({"score": score, "probability": prob})
