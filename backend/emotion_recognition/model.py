import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from .utils import setup_logging

logger = setup_logging("ModelBuilder")

def build_model(num_classes=7, input_shape=(224, 224, 3)):
    """
    Builds a model using EfficientNetB0 for high-accuracy emotion recognition.
    Optimized for RAF-DB dataset at 224x224 resolution.
    """
    logger.info(f"Initializing EfficientNetB0 base model for RAF-DB with input shape {input_shape}...")
    
    # Load base model
    base_model = EfficientNetB0(
        weights='imagenet', 
        include_top=False, 
        input_shape=input_shape
    )
    
    # Freeze the base model initially for Phase 1
    base_model.trainable = False
    
    # Add custom classification head as requested
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.4)(x)
    
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    return model, base_model

def get_fine_tuned_model(model, base_model, num_layers_to_unfreeze=30):
    """
    Unfreezes the top layers of the base model for Phase 2 fine-tuning.
    """
    base_model.trainable = True
    
    # Freeze all layers except the last N
    for layer in base_model.layers[:-num_layers_to_unfreeze]:
        layer.trainable = False
        
    return model
