"""
Módulo de arquitecturas CNN personalizadas para el proyecto.
Incluye modelos mejorados para evaluación de dibujos MoCA y detección de emociones.
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, regularizers
from tensorflow.keras.applications import (
    MobileNetV2, ResNet50, EfficientNetB0, 
    VGG16, DenseNet121
)


class CNNModelBuilder:
    """Builder para crear diferentes arquitecturas CNN según necesidades."""
    
    @staticmethod
    def build_custom_cnn(input_shape=(224, 224, 3), num_classes=1, task_type='binary'):
        """
        Construye una CNN personalizada desde cero.
        
        Args:
            input_shape: Forma de entrada (alto, ancho, canales)
            num_classes: Número de clases de salida
            task_type: 'binary', 'multi_class', 'multi_output', 'regression'
        
        Returns:
            Modelo Keras compilado
        """
        inputs = keras.Input(shape=input_shape)
        
        # Bloque convolucional 1
        x = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(inputs)
        x = layers.BatchNormalization()(x)
        x = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(x)
        x = layers.MaxPooling2D((2, 2))(x)
        x = layers.Dropout(0.25)(x)
        
        # Bloque convolucional 2
        x = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(x)
        x = layers.MaxPooling2D((2, 2))(x)
        x = layers.Dropout(0.25)(x)
        
        # Bloque convolucional 3
        x = layers.Conv2D(128, (3, 3), activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Conv2D(128, (3, 3), activation='relu', padding='same')(x)
        x = layers.MaxPooling2D((2, 2))(x)
        x = layers.Dropout(0.25)(x)
        
        # Bloque convolucional 4
        x = layers.Conv2D(256, (3, 3), activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Conv2D(256, (3, 3), activation='relu', padding='same')(x)
        x = layers.MaxPooling2D((2, 2))(x)
        x = layers.Dropout(0.5)(x)
        
        # Flatten y capas densas
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dense(512, activation='relu', 
                        kernel_regularizer=regularizers.l2(0.001))(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.5)(x)
        x = layers.Dense(256, activation='relu',
                        kernel_regularizer=regularizers.l2(0.001))(x)
        x = layers.Dropout(0.3)(x)
        
        # Capa de salida según el tipo de tarea
        if task_type == 'binary':
            outputs = layers.Dense(1, activation='sigmoid')(x)
            loss = 'binary_crossentropy'
        elif task_type == 'multi_class':
            outputs = layers.Dense(num_classes, activation='softmax')(x)
            loss = 'categorical_crossentropy'
        elif task_type == 'multi_output':
            outputs = layers.Dense(num_classes, activation='sigmoid')(x)
            loss = 'binary_crossentropy'
        else:  # regression
            outputs = layers.Dense(num_classes, activation='linear')(x)
            loss = 'mse'
        
        model = models.Model(inputs, outputs)
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss=loss,
            metrics=['accuracy']
        )
        
        return model
    
    @staticmethod
    def build_transfer_learning_model(
        base_model_name='mobilenetv2',
        input_shape=(224, 224, 3),
        num_classes=1,
        task_type='binary',
        fine_tune_layers=0,
        dropout_rate=0.5
    ):
        """
        Construye un modelo usando Transfer Learning con diferentes arquitecturas base.
        
        Args:
            base_model_name: 'mobilenetv2', 'resnet50', 'efficientnet', 'vgg16', 'densenet'
            input_shape: Forma de entrada
            num_classes: Número de clases
            task_type: 'binary', 'multi_class', 'multi_output'
            fine_tune_layers: Número de capas a fine-tunear (0 = solo entrenar top layers)
            dropout_rate: Tasa de dropout
        
        Returns:
            Modelo Keras compilado
        """
        # Seleccionar modelo base
        base_models = {
            'mobilenetv2': MobileNetV2,
            'resnet50': ResNet50,
            'efficientnet': EfficientNetB0,
            'vgg16': VGG16,
            'densenet': DenseNet121
        }
        
        if base_model_name not in base_models:
            raise ValueError(f"Modelo base no soportado: {base_model_name}")
        
        BaseModel = base_models[base_model_name]
        
        # Cargar modelo base preentrenado
        base_model = BaseModel(
            input_shape=input_shape,
            include_top=False,
            weights='imagenet'
        )
        
        # Congelar capas base inicialmente
        base_model.trainable = False
        
        # Si se especifican capas para fine-tuning
        if fine_tune_layers > 0:
            base_model.trainable = True
            for layer in base_model.layers[:-fine_tune_layers]:
                layer.trainable = False
        
        # Construir modelo completo
        inputs = keras.Input(shape=input_shape)
        x = base_model(inputs, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dense(512, activation='relu',
                        kernel_regularizer=regularizers.l2(0.001))(x)
        x = layers.Dropout(dropout_rate)(x)
        x = layers.Dense(256, activation='relu',
                        kernel_regularizer=regularizers.l2(0.001))(x)
        x = layers.Dropout(dropout_rate * 0.6)(x)
        
        # Capa de salida
        if task_type == 'binary':
            outputs = layers.Dense(1, activation='sigmoid')(x)
            loss = 'binary_crossentropy'
        elif task_type == 'multi_class':
            outputs = layers.Dense(num_classes, activation='softmax')(x)
            loss = 'categorical_crossentropy'
        elif task_type == 'multi_output':
            outputs = layers.Dense(num_classes, activation='sigmoid')(x)
            loss = 'binary_crossentropy'
        else:
            outputs = layers.Dense(num_classes, activation='linear')(x)
            loss = 'mse'
        
        model = models.Model(inputs, outputs)
        
        # Compilar con diferentes learning rates según si hay fine-tuning
        lr = 0.0001 if fine_tune_layers == 0 else 0.00001
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=lr),
            loss=loss,
            metrics=['accuracy']
        )
        
        return model
    
    @staticmethod
    def build_emotion_cnn(input_shape=(224, 224, 3), num_emotions=7):
        """
        CNN especializada para detección de emociones faciales.
        
        Args:
            input_shape: Forma de entrada
            num_emotions: Número de emociones (7: neutral, happy, sad, angry, 
                         fearful, disgusted, surprised)
        
        Returns:
            Modelo Keras compilado
        """
        # Usar EfficientNet para mejor precisión en detección facial
        base_model = EfficientNetB0(
            input_shape=input_shape,
            include_top=False,
            weights='imagenet'
        )
        
        base_model.trainable = False
        
        inputs = keras.Input(shape=input_shape)
        x = base_model(inputs, training=False)
        
        # Agregar capas especializadas para emociones
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dense(1024, activation='relu',
                        kernel_regularizer=regularizers.l2(0.001))(x)
        x = layers.Dropout(0.5)(x)
        x = layers.Dense(512, activation='relu',
                        kernel_regularizer=regularizers.l2(0.001))(x)
        x = layers.Dropout(0.3)(x)
        
        # Salida para 7 emociones
        outputs = layers.Dense(num_emotions, activation='softmax')(x)
        
        model = models.Model(inputs, outputs)
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy', 'top_k_categorical_accuracy']
        )
        
        return model
    
    @staticmethod
    def build_attention_cnn(input_shape=(224, 224, 3), num_classes=1):
        """
        CNN con mecanismo de atención para mejor interpretabilidad.
        
        Args:
            input_shape: Forma de entrada
            num_classes: Número de clases
        
        Returns:
            Modelo Keras con atención
        """
        inputs = keras.Input(shape=input_shape)
        
        # Backbone (usar ResNet50)
        base_model = ResNet50(
            input_shape=input_shape,
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False
        
        x = base_model(inputs, training=False)
        
        # Mecanismo de atención
        attention = layers.Conv2D(1, (1, 1), activation='sigmoid')(x)
        x = layers.Multiply()([x, attention])
        
        # Pooling y clasificación
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dense(256, activation='relu')(x)
        x = layers.Dropout(0.5)(x)
        outputs = layers.Dense(num_classes, activation='sigmoid')(x)
        
        model = models.Model(inputs, outputs)
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model


def get_data_augmentation():
    """
    Retorna un generador de data augmentation mejorado.
    """
    return keras.Sequential([
        layers.RandomRotation(0.2),
        layers.RandomTranslation(0.1, 0.1),
        layers.RandomZoom(0.2),
        layers.RandomFlip("horizontal"),
        layers.RandomContrast(0.2),
        layers.RandomBrightness(0.2),
    ])


def create_callbacks(model_name='model', patience=10, monitor='val_loss'):
    """
    Crea callbacks útiles para el entrenamiento.
    
    Args:
        model_name: Nombre para guardar el modelo
        patience: Paciencia para early stopping
        monitor: Métrica a monitorear
    
    Returns:
        Lista de callbacks
    """
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor=monitor,
            patience=patience,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            filepath=f'{model_name}_best.h5',
            monitor=monitor,
            save_best_only=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor=monitor,
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        keras.callbacks.CSVLogger(f'{model_name}_training.log')
    ]
    
    return callbacks

