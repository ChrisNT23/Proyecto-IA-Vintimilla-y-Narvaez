import os
import csv
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers
from PIL import Image

# ===============================
# CONFIGURACIÓN
# ===============================

TRAIN_DIR = "data_clock/train_aug"
TRAIN_CSV = "data_clock/train_aug/train_labels.csv"

VAL_DIR   = "data_clock/val"
VAL_CSV   = "data_clock/val/val_labels.csv"

MODEL_PATH = "model_clock.keras"

IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 32
EPOCHS_PHASE1 = 10
EPOCHS_PHASE2 = 20

# ===============================
# CARGA DE DATOS
# ===============================

def load_data_from_csv(base_dir, csv_path):
    images = []
    labels = []

    with open(csv_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row['filename']
            contorno = int(row['contorno'])
            numeros  = int(row['numeros'])
            agujas   = int(row['agujas'])

            img_path = os.path.join(base_dir, filename)

            if os.path.exists(img_path):
                images.append(img_path)
                labels.append([contorno, numeros, agujas])

    return images, np.array(labels, dtype="float32")


def preprocess_image(path):
    img = Image.open(path).convert('RGB')
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array


def data_generator(paths, labels, batch_size):
    dataset_size = len(paths)
    indices = np.arange(dataset_size)

    while True:
        np.random.shuffle(indices)
        for start in range(0, dataset_size, batch_size):
            end = min(start + batch_size, dataset_size)
            batch_indices = indices[start:end]

            batch_images = []
            contornos = []
            numeros = []
            agujas = []

            for i in batch_indices:
                img_array = preprocess_image(paths[i])
                batch_images.append(img_array)

                contornos.append(labels[i][0])
                numeros.append(labels[i][1])
                agujas.append(labels[i][2])

            yield (
                np.array(batch_images),
                {
                    "contorno": np.array(contornos),
                    "numeros": np.array(numeros),
                    "agujas": np.array(agujas)
                }
            )

# ===============================
# PREPARAR DATASET
# ===============================

train_paths, train_labels = load_data_from_csv(TRAIN_DIR, TRAIN_CSV)
val_paths, val_labels     = load_data_from_csv(VAL_DIR, VAL_CSV)

train_steps = int(np.ceil(len(train_paths) / BATCH_SIZE))
val_steps   = int(np.ceil(len(val_paths) / BATCH_SIZE))

train_gen = data_generator(train_paths, train_labels, BATCH_SIZE)
val_gen   = data_generator(val_paths, val_labels, BATCH_SIZE)

print("Train imágenes:", len(train_paths))
print("Val imágenes:", len(val_paths))

# ===============================
# DATA AUGMENTATION ONLINE
# ===============================

data_augmentation = tf.keras.Sequential([
    layers.RandomRotation(0.05),
    layers.RandomZoom(0.1),
    layers.RandomTranslation(0.05, 0.05),
])

# ===============================
# MODELO BASE
# ===============================

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_HEIGHT, IMG_WIDTH, 3),
    include_top=False,
    weights='imagenet'
)

# ===============================
# FASE 1 — ENTRENAR HEAD
# ===============================

base_model.trainable = False

inputs = tf.keras.Input(shape=(IMG_HEIGHT, IMG_WIDTH, 3))
x = data_augmentation(inputs)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.BatchNormalization()(x)
x = layers.Dropout(0.4)(x)

out_contorno = layers.Dense(
    1,
    activation="sigmoid",
    kernel_regularizer=tf.keras.regularizers.l2(0.001),
    name="contorno"
)(x)

out_numeros = layers.Dense(
    1,
    activation="sigmoid",
    kernel_regularizer=tf.keras.regularizers.l2(0.001),
    name="numeros"
)(x)

out_agujas = layers.Dense(
    1,
    activation="sigmoid",
    kernel_regularizer=tf.keras.regularizers.l2(0.001),
    name="agujas"
)(x)

model = tf.keras.Model(
    inputs=inputs,
    outputs=[out_contorno, out_numeros, out_agujas]
)

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss={
        "contorno": "binary_crossentropy",
        "numeros": "binary_crossentropy",
        "agujas": "binary_crossentropy"
    },
    metrics={
        "contorno": [
            tf.keras.metrics.BinaryAccuracy(),
            tf.keras.metrics.Precision(),
            tf.keras.metrics.Recall()
        ],
        "numeros": [
            tf.keras.metrics.BinaryAccuracy(),
            tf.keras.metrics.Precision(),
            tf.keras.metrics.Recall()
        ],
        "agujas": [
            tf.keras.metrics.BinaryAccuracy(),
            tf.keras.metrics.Precision(),
            tf.keras.metrics.Recall()
        ]
    }
)

print("\n=== FASE 1: Entrenando HEAD ===")

callbacks = [
    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=3,
        verbose=1
    ),
    tf.keras.callbacks.ModelCheckpoint(
        "best_model_clock.keras",
        monitor="val_loss",
        save_best_only=True,
        verbose=1
    )
]

model.fit(
    train_gen,
    steps_per_epoch=train_steps,
    epochs=EPOCHS_PHASE1,
    validation_data=val_gen,
    validation_steps=val_steps,
    callbacks=callbacks
)

# ===============================
# FASE 2 — FINE TUNING
# ===============================

print("\n=== FASE 2: Fine-Tuning ===")

base_model.trainable = True

# Descongelar solo últimas 20 capas
for layer in base_model.layers[:-20]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),
    loss={
        "contorno": "binary_crossentropy",
        "numeros": "binary_crossentropy",
        "agujas": "binary_crossentropy"
    },
    metrics={
        "contorno": [
            tf.keras.metrics.BinaryAccuracy(),
            tf.keras.metrics.Precision(),
            tf.keras.metrics.Recall()
        ],
        "numeros": [
            tf.keras.metrics.BinaryAccuracy(),
            tf.keras.metrics.Precision(),
            tf.keras.metrics.Recall()
        ],
        "agujas": [
            tf.keras.metrics.BinaryAccuracy(),
            tf.keras.metrics.Precision(),
            tf.keras.metrics.Recall()
        ]
    }
)

model.fit(
    train_gen,
    steps_per_epoch=train_steps,
    epochs=EPOCHS_PHASE2,
    validation_data=val_gen,
    validation_steps=val_steps,
    callbacks=callbacks
)

# ===============================
# GUARDAR MODELO FINAL
# ===============================

model.save(MODEL_PATH)
print(f"\nModelo final guardado en {MODEL_PATH}")