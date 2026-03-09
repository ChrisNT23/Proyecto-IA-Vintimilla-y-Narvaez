import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from sklearn.metrics import confusion_matrix, classification_report
import matplotlib.pyplot as plt
import seaborn as sns

# ==========================
# CONFIG
# ==========================

IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 32
TEST_DIR = os.path.join('data', 'test')

# ==========================
# CARGAR MODELO
# ==========================

model = tf.keras.models.load_model("model_cube_final.h5")

# ==========================
# GENERADOR TEST
# ==========================

test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

test_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='binary',
    shuffle=False  # MUY IMPORTANTE
)

# ==========================
# PREDICCIONES
# ==========================

preds = model.predict(test_generator)
preds = (preds > 0.5).astype(int).reshape(-1)

y_true = test_generator.classes

# ==========================
# MATRIZ DE CONFUSIÓN
# ==========================

cm = confusion_matrix(y_true, preds)
print("Confusion Matrix:\n", cm)

print("\nClassification Report:\n")
print(classification_report(y_true, preds, target_names=test_generator.class_indices.keys()))

# ==========================
# GRAFICAR MATRIZ
# ==========================

plt.figure(figsize=(6,5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=test_generator.class_indices.keys(),
            yticklabels=test_generator.class_indices.keys())

plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix - Cube Model")
plt.show()
