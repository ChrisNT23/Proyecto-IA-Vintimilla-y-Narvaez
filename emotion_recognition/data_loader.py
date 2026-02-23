import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from .utils import setup_logging

logger = setup_logging("DataLoader")

def get_data_generators(data_dir, target_size=(224, 224), batch_size=32):
    """
    Creates train, validation, and test generators.
    
    Args:
        data_dir (str): Root directory containing train/test/val folders
        target_size (tuple): Image dimensions (H, W)
        batch_size (int): Batch size
        
    Returns:
        tuple: (train_gen, val_gen, test_gen)
    """
    train_path = os.path.join(data_dir, 'train')
    val_path = os.path.join(data_dir, 'val')
    test_path = os.path.join(data_dir, 'test')

    # Data Augmentation for Training
    train_datagen = ImageDataGenerator(
        rotation_range=15,
        zoom_range=0.1,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input
    )

    # Only rescaling for validation and testing
    test_val_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input
    )

    logger.info(f"Loading data from {data_dir}...")

    train_generator = train_datagen.flow_from_directory(
        train_path,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=True
    )

    val_generator = test_val_datagen.flow_from_directory(
        val_path,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )

    test_generator = test_val_datagen.flow_from_directory(
        test_path,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )

    return train_generator, val_generator, test_generator
