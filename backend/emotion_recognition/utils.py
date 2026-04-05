import logging
import os
import numpy as np
from sklearn.utils.class_weight import compute_class_weight

# Shared Configuration
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

def setup_logging(name="FER_Pipeline"):
    """Sets up professional logging for the project."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("emotion_recognition.log"),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger("FER_Pipeline")

def get_class_weights(train_generator):
    """
    Computes class weights to handle imbalanced datasets.
    
    Args:
        train_generator: The Training Image Data Generator
        
    Returns:
        dict: Mapping of class index to weight
    """
    classes = train_generator.classes
    class_indices = list(train_generator.class_indices.values())
    
    weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(classes),
        y=classes
    )
    
    return dict(zip(class_indices, weights))

def ensure_dir(path):
    """Ensures a directory exists."""
    if not os.path.exists(path):
        os.makedirs(path)
