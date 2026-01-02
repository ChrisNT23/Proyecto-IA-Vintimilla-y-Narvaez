import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Parámetros para la carga de datos
TRAIN_DIR = os.path.join('data', 'train')
VAL_DIR = os.path.join('data', 'val')
TEST_DIR = os.path.join('data', 'test')  # Opcional para pruebas

IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 16
EPOCHS = 10  # Ajusta según tu necesidad

# Verificar que las rutas existen
for directory in [TRAIN_DIR, VAL_DIR, TEST_DIR]:
    if not os.path.exists(directory):
        print(f"Error: La carpeta {directory} no existe.")
        exit(1)

# Generadores de imágenes con Data Augmentation para entrenamiento
train_datagen = ImageDataGenerator(
    rescale=1.0/255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

# Para validación y test solemos usar menos aumentos para mantener consistencia
val_datagen = ImageDataGenerator(rescale=1.0/255)
test_datagen = ImageDataGenerator(rescale=1.0/255)

# Carga de datos en batch desde directorios
train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='binary',  # Correcto vs Incorrecto
    shuffle=True
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='binary',
    shuffle=False
)

# Opcional: si quieres evaluar en test
test_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='binary',
    shuffle=False
)

# Carga del modelo base (MobileNetV2) sin la parte fully connected original
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_HEIGHT, IMG_WIDTH, 3),
    include_top=False,  # quitamos las capas densas originales
    weights='imagenet'
)

# Congelamos el modelo base para que no se entrene en las primeras épocas
base_model.trainable = False

# Añadimos capas densas de clasificación
model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(1, activation='sigmoid')  # Binario: Correcto vs Incorrecto
])

# Compilamos el modelo
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

print("=== Iniciando Entrenamiento ===")

# Entrenamiento del modelo
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=val_generator
)

# (Opcional) Evaluación final con la carpeta de test
print("=== Evaluando en Test ===")
test_loss, test_acc = model.evaluate(test_generator)
print(f"Loss en Test: {test_loss:.4f} - Acc en Test: {test_acc:.4f}")

# Guardamos el modelo en un archivo h5
model.save('model_cube.h5')
print("Modelo guardado como model_cube.h5")

# Si quieres luego re-entrenar con fine-tuning, 
# descongela las últimas capas del base_model y vuelve a entrenar.
# Por ejemplo:
# base_model.trainable = True
# for layer in base_model.layers[:100]:
#     layer.trainable = False
# model.compile(optimizer=..., loss=..., metrics=...)
# model.fit(...)
# model.save('model.h5')
