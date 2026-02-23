import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from .utils import setup_logging, EMOTIONS

logger = setup_logging("ModelBuilder")

def build_model(num_classes=len(EMOTIONS), input_shape=(224, 224, 3)):
    """
    Builds the FER model using MobileNetV2 as a base.
    
    Args:
        num_classes (int): Number of emotion classes
        input_shape (tuple): Input image dimensions
        
    Returns:
        tf.keras.Model: The compiled model
    """
    logger.info("Initializing MobileNetV2 base model...")
    
    # Load base model
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=input_shape
    )
    
    # Freeze the base model
    base_model.trainable = False
    
    # Add custom head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    return model, base_model

def get_fine_tuned_model(model, base_model, num_layers_to_unfreeze=30):
    """
    Unfreezes the last layers of the base model for fine-tuning.
    
    Args:
        model (tf.keras.Model): The current model
        base_model (tf.keras.Model): The base MobileNetV2 model
        num_layers_to_unfreeze (int): Number of layers to unfreeze from the end
        
    Returns:
        tf.keras.Model: Model ready for fine-tuning
    """
    logger.info(f"Unfreezing the last {num_layers_to_unfreeze} layers for fine-tuning...")
    
    base_model.trainable = True
    
    # Re-freeze everything except the last N layers
    for layer in base_model.layers[:-num_layers_to_unfreeze]:
        layer.trainable = False
        
    return model
