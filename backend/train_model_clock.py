import os
import csv
import tensorflow as tf
import numpy as np
from tensorflow.keras import layers, models
from PIL import Image

TRAIN_DIR = "data_clock/train"
TRAIN_CSV = "data_clock/train/train_labels.csv"
VAL_DIR   = "data_clock/val"
VAL_CSV   = "data_clock/val/val_labels.csv"

MODEL_PATH = "model_clock.h5"

IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 16
EPOCHS = 10

def load_data_from_csv(base_dir, csv_path):
    """
    Carga rutas de imágenes y etiquetas multi-output (contorno, numeros, agujas).
    Las imágenes se asumen en subcarpetas 'correct/' o 'incorrect/'.
    """
    images = []
    labels = []
    with open(csv_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row['filename']  # p.ej. "correct/reloj_01.jpg" o "incorrect/reloj_10.jpg"
            contorno = int(row['contorno'])
            numeros  = int(row['numeros'])
            agujas   = int(row['agujas'])
            
            # Ruta final = base_dir + "/" + filename (p.ej. data_clock/train/correct/reloj_01.jpg)
            img_path = os.path.join(base_dir, filename)
            if os.path.exists(img_path):
                images.append(img_path)
                labels.append([contorno, numeros, agujas])
            else:
                print(f"Advertencia: la imagen {img_path} no existe.")
    
    return images, np.array(labels, dtype="float32")

def preprocess_image(path):
    """
    Lee la imagen, la redimensiona y la normaliza como MobileNetV2.
    """
    img = Image.open(path).convert('RGB')
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img)
    # Preprocesamiento de MobileNetV2 (normalización y escalado)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array

def data_generator(paths, labels, batch_size):
    """
    Generador Python que yield batches de imágenes y etiquetas multi-output.
    """
    dataset_size = len(paths)
    indices = np.arange(dataset_size)
    
    while True:
        np.random.shuffle(indices)
        for start in range(0, dataset_size, batch_size):
            end = min(start + batch_size, dataset_size)
            batch_indices = indices[start:end]

            batch_images = []
            batch_labels = []
            for i in batch_indices:
                img_array = preprocess_image(paths[i])
                batch_images.append(img_array)
                batch_labels.append(labels[i])
            
            yield (np.array(batch_images), np.array(batch_labels))


# Cargar datos de entrenamiento y validación
train_paths, train_labels = load_data_from_csv(TRAIN_DIR, TRAIN_CSV)
val_paths, val_labels     = load_data_from_csv(VAL_DIR,   VAL_CSV)

# Definir pasos por época
train_steps = len(train_paths) // BATCH_SIZE
val_steps   = len(val_paths)   // BATCH_SIZE

# Definir generadores
train_gen = data_generator(train_paths, train_labels, BATCH_SIZE)
val_gen   = data_generator(val_paths,   val_labels,   BATCH_SIZE)

# Crear el modelo base (MobileNetV2) sin la parte fully connected
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_HEIGHT, IMG_WIDTH, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # Congelar el modelo base en un inicio

# Añadir capas densas de clasificación multi-output (3 salidas: contorno, numeros, agujas)
model = tf.keras.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),
    layers.Dense(3, activation="sigmoid")  # 3 salidas
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="binary_crossentropy",  # Para cada salida (contorno, numeros, agujas)
    metrics=["accuracy"]
)

print("=== Iniciando Entrenamiento (Reloj) ===")

history = model.fit(
    train_gen,
    steps_per_epoch=train_steps,
    epochs=EPOCHS,
    validation_data=val_gen,
    validation_steps=val_steps
)

# Guardar el modelo
model.save(MODEL_PATH)
print(f"Modelo guardado en {MODEL_PATH}")
