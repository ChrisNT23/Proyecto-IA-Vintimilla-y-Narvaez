import tensorflow as tf
import os
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Sequential
from tensorflow.keras.applications import MobileNetV2

# Ruta de los datos de entrenamiento y validación
base_dir = "dataClock"
train_dir = os.path.join(base_dir, "train")
val_dir = os.path.join(base_dir, "val")

# Parámetros del modelo
batch_size = 32
img_height = 224
img_width = 224
epochs = 10

# Cargar los datos desde las carpetas
train_ds = tf.keras.preprocessing.image_dataset_from_directory(
    train_dir,
    seed=123,
    image_size=(img_height, img_width),
    batch_size=batch_size,
    label_mode="categorical"  # Etiquetas en formato one-hot para 5 clases
)

val_ds = tf.keras.preprocessing.image_dataset_from_directory(
    val_dir,
    seed=123,
    image_size=(img_height, img_width),
    batch_size=batch_size,
    label_mode="categorical"  # Etiquetas en formato one-hot para 5 clases
)

# Preprocesamiento y aumento del rendimiento
AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

# Construcción del modelo usando MobileNetV2 preentrenado
base_model = MobileNetV2(input_shape=(img_height, img_width, 3),
                         include_top=False,
                         weights='imagenet')
base_model.trainable = False  # Congelar la capa base

# Capas superiores del modelo
model = Sequential([
    base_model,
    GlobalAveragePooling2D(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(5, activation='softmax')  # Cinco salidas con softmax para clasificación multiclase
])

# Compilar el modelo
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
              loss='categorical_crossentropy',  # Pérdida para clasificación multiclase
              metrics=['accuracy'])

# Entrenar el modelo
print("Iniciando el entrenamiento del modelo...")
history = model.fit(train_ds, validation_data=val_ds, epochs=epochs)

# Guardar el modelo entrenado
model.save('clock_model.h5')
print("Modelo guardado como clock_model.h5")
