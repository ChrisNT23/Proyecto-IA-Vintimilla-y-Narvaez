"""
Script para entrenar CNN de detección de emociones faciales.
Reemplaza face-api.js con un modelo personalizado entrenado en datos específicos.
"""

import os
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from cnn_models import CNNModelBuilder, create_callbacks

# Configurar TensorFlow para compatibilidad
# Desactivar mixed precision si está activado (puede causar problemas de compatibilidad)
tf.keras.mixed_precision.set_global_policy('float32')

# Configuración
# Estructura esperada: data_emotions/train/{emotion_name}/*.jpg
# Emociones: neutral, happy, sad, angry, fearful, disgusted, surprised
TRAIN_DIR = "data_emotions/train"
VAL_DIR = "data_emotions/val"
TEST_DIR = "data_emotions/test"

IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 32
EPOCHS = 50
NUM_EMOTIONS = 7

# Verificar rutas
if not os.path.exists(TRAIN_DIR):
    print(f"Error: {TRAIN_DIR} no existe.")
    print("Estructura esperada:")
    print("  data_emotions/train/neutral/*.jpg")
    print("  data_emotions/train/happy/*.jpg")
    print("  data_emotions/train/sad/*.jpg")
    print("  ... etc")
    exit(1)

# Data augmentation específico para rostros
train_datagen = ImageDataGenerator(
    rescale=1.0/255,
    rotation_range=15,  # Menos rotación para rostros
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.1,
    horizontal_flip=True,
    brightness_range=[0.8, 1.2],
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1.0/255)
test_datagen = ImageDataGenerator(rescale=1.0/255)

# Generadores
train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True,
    seed=42
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

test_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

print(f"Clases encontradas: {train_generator.class_indices}")
print(f"Imágenes de entrenamiento: {train_generator.samples}")
print(f"Imágenes de validación: {val_generator.samples}")
print(f"Imágenes de test: {test_generator.samples}")

# Construir modelo especializado para emociones
print("\n=== Construyendo Modelo de Emociones ===")
model = CNNModelBuilder.build_emotion_cnn(
    input_shape=(IMG_HEIGHT, IMG_WIDTH, 3),
    num_emotions=NUM_EMOTIONS
)

print("Arquitectura del modelo:")
model.summary()

# Callbacks
callbacks = create_callbacks(
    model_name='model_emotions',
    patience=20,
    monitor='val_accuracy'  # Monitorear accuracy para clasificación
)

# Learning rate scheduler
def lr_schedule(epoch):
    initial_lr = 0.0001
    if epoch < 15:
        return initial_lr
    elif epoch < 30:
        return initial_lr * 0.5
    else:
        return initial_lr * 0.1

from tensorflow.keras.callbacks import LearningRateScheduler
callbacks.append(LearningRateScheduler(lr_schedule))

# Entrenamiento
print("\n=== Iniciando Entrenamiento ===")
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=val_generator,
    callbacks=callbacks,
    verbose=1
)

# Evaluación
print("\n=== Evaluando en Test ===")
test_loss, test_acc, test_top_k = model.evaluate(test_generator, verbose=1)
print(f"Test Loss: {test_loss:.4f}")
print(f"Test Accuracy: {test_acc:.4f}")
print(f"Test Top-K Accuracy: {test_top_k:.4f}")

# Guardar modelo de manera compatible
print("\n=== Guardando Modelo ===")
try:
    model.save('model_emotions.h5', save_format='h5')
    print("Modelo guardado como model_emotions.h5 (formato H5 compatible)")
except Exception as e:
    print(f"Error al guardar en formato H5: {e}")
    model.save_weights('model_emotions_weights.h5')
    print("Pesos guardados como model_emotions_weights.h5")

# Guardar mapeo de clases
import json
class_indices = train_generator.class_indices
class_names = {v: k for k, v in class_indices.items()}
with open('emotion_classes.json', 'w') as f:
    json.dump(class_names, f, indent=2)
print("Mapeo de clases guardado en emotion_classes.json")

# Fine-tuning
print("\n=== Iniciando Fine-tuning ===")
base_model = model.layers[1]
base_model.trainable = True

# Descongelar últimas 40 capas
for layer in base_model.layers[:-40]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.00001),
    loss='categorical_crossentropy',
    metrics=['accuracy', 'top_k_categorical_accuracy']
)

fine_tune_history = model.fit(
    train_generator,
    epochs=30,
    initial_epoch=EPOCHS,
    validation_data=val_generator,
    callbacks=callbacks,
    verbose=1
)

try:
    model.save('model_emotions_finetuned.h5', save_format='h5')
    print("Modelo fine-tuned guardado como model_emotions_finetuned.h5 (formato H5 compatible)")
except Exception as e:
    print(f"Error al guardar modelo fine-tuned: {e}")
    model.save_weights('model_emotions_finetuned_weights.h5')
    print("Pesos del modelo fine-tuned guardados")

print("\n=== Entrenamiento Completado ===")
print("\nPara usar este modelo en lugar de face-api.js:")
print("1. Carga el modelo en model_server.py")
print("2. Preprocesa las imágenes de rostros")
print("3. Usa model.predict() para obtener emociones")

