"""
Script mejorado para entrenar CNN de evaluación de relojes MoCA.
Evalúa múltiples criterios: contorno, números y agujas.
"""

import os
import csv
import tensorflow as tf
import numpy as np
from PIL import Image
from cnn_models import CNNModelBuilder, create_callbacks

# Configurar TensorFlow para compatibilidad
# Desactivar mixed precision si está activado (puede causar problemas de compatibilidad)
tf.keras.mixed_precision.set_global_policy('float32')

# Configuración
TRAIN_DIR = "data_clock/train"
TRAIN_CSV = "data_clock/train/train_labels.csv"
VAL_DIR = "data_clock/val"
VAL_CSV = "data_clock/val/val_labels.csv"
TEST_DIR = "data_clock/test"
TEST_CSV = "data_clock/test/test_labels.csv"

MODEL_PATH = "model_clock_improved.h5"
IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 32
EPOCHS = 50

def load_data_from_csv(base_dir, csv_path):
    """Carga imágenes y etiquetas multi-output desde CSV."""
    images = []
    labels = []
    
    if not os.path.exists(csv_path):
        print(f"Advertencia: {csv_path} no existe.")
        return [], []
    
    with open(csv_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row['filename']
            contorno = int(row['contorno'])
            numeros = int(row['numeros'])
            agujas = int(row['agujas'])
            
            img_path = os.path.join(base_dir, filename)
            if os.path.exists(img_path):
                images.append(img_path)
                labels.append([contorno, numeros, agujas])
            else:
                print(f"Advertencia: {img_path} no existe.")
    
    return images, np.array(labels, dtype="float32")

def preprocess_image(path):
    """Preprocesa imagen para EfficientNet."""
    img = Image.open(path).convert('RGB')
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img)
    # Preprocesamiento de EfficientNet
    img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
    return img_array

def data_generator(paths, labels, batch_size, augment=False):
    """Generador de datos con opción de data augmentation."""
    dataset_size = len(paths)
    indices = np.arange(dataset_size)
    
    # Data augmentation
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2]
    ) if augment else None
    
    while True:
        if augment:
            np.random.shuffle(indices)
        
        for start in range(0, dataset_size, batch_size):
            end = min(start + batch_size, dataset_size)
            batch_indices = indices[start:end]

            batch_images = []
            batch_labels = []
            
            for i in batch_indices:
                img_array = preprocess_image(paths[i])
                
                # Aplicar augmentation si está habilitado
                if augment and datagen:
                    img_array = datagen.random_transform(img_array.astype('float32'))
                
                batch_images.append(img_array)
                batch_labels.append(labels[i])
            
            yield (np.array(batch_images), np.array(batch_labels))

# Cargar datos
print("=== Cargando Datos ===")
train_paths, train_labels = load_data_from_csv(TRAIN_DIR, TRAIN_CSV)
val_paths, val_labels = load_data_from_csv(VAL_DIR, VAL_CSV)
test_paths, test_labels = load_data_from_csv(TEST_DIR, TEST_CSV)

print(f"Imágenes de entrenamiento: {len(train_paths)}")
print(f"Imágenes de validación: {len(val_paths)}")
print(f"Imágenes de test: {len(test_paths)}")

if len(train_paths) == 0:
    print("Error: No se encontraron datos de entrenamiento.")
    exit(1)

# Definir pasos
train_steps = len(train_paths) // BATCH_SIZE
val_steps = len(val_paths) // BATCH_SIZE if len(val_paths) > 0 else 1
test_steps = len(test_paths) // BATCH_SIZE if len(test_paths) > 0 else 1

# Generadores
train_gen = data_generator(train_paths, train_labels, BATCH_SIZE, augment=True)
val_gen = data_generator(val_paths, val_labels, BATCH_SIZE, augment=False)
test_gen = data_generator(test_paths, test_labels, BATCH_SIZE, augment=False)

# Construir modelo con Transfer Learning
print("\n=== Construyendo Modelo ===")
model = CNNModelBuilder.build_transfer_learning_model(
    base_model_name='efficientnet',  # Cambiar a 'resnet50' o 'densenet' si se prefiere
    input_shape=(IMG_HEIGHT, IMG_WIDTH, 3),
    num_classes=3,  # 3 salidas: contorno, números, agujas
    task_type='multi_output',
    fine_tune_layers=0,
    dropout_rate=0.5
)

print("Arquitectura del modelo:")
model.summary()

# Callbacks
callbacks = create_callbacks(
    model_name='model_clock_improved',
    patience=15,
    monitor='val_loss'
)

# Entrenamiento
print("\n=== Iniciando Entrenamiento ===")
history = model.fit(
    train_gen,
    steps_per_epoch=train_steps,
    epochs=EPOCHS,
    validation_data=val_gen,
    validation_steps=val_steps,
    callbacks=callbacks,
    verbose=1
)

# Evaluación en test
if len(test_paths) > 0:
    print("\n=== Evaluando en Test ===")
    test_results = model.evaluate(test_gen, steps=test_steps, verbose=1)
    print(f"Test Loss: {test_results[0]:.4f}")
    print(f"Test Accuracy: {test_results[1]:.4f}")

# Guardar modelo de manera compatible
print("\n=== Guardando Modelo ===")
try:
    model.save(MODEL_PATH, save_format='h5')
    print(f"Modelo guardado en {MODEL_PATH} (formato H5 compatible)")
except Exception as e:
    print(f"Error al guardar en formato H5: {e}")
    model.save_weights(MODEL_PATH.replace('.h5', '_weights.h5'))
    print(f"Pesos guardados en {MODEL_PATH.replace('.h5', '_weights.h5')}")

# Fine-tuning opcional
print("\n=== Fine-tuning (Opcional) ===")
base_model = model.layers[1]
base_model.trainable = True

# Descongelar últimas 30 capas
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.00001),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

print("Entrenando con fine-tuning...")
fine_tune_history = model.fit(
    train_gen,
    steps_per_epoch=train_steps,
    epochs=20,
    initial_epoch=EPOCHS,
    validation_data=val_gen,
    validation_steps=val_steps,
    callbacks=callbacks,
    verbose=1
)

try:
    model.save('model_clock_finetuned.h5', save_format='h5')
    print("Modelo fine-tuned guardado como model_clock_finetuned.h5 (formato H5 compatible)")
except Exception as e:
    print(f"Error al guardar modelo fine-tuned: {e}")
    model.save_weights('model_clock_finetuned_weights.h5')
    print("Pesos del modelo fine-tuned guardados")

print("\n=== Entrenamiento Completado ===")

