import os
import tensorflow as tf
from .utils import setup_logging

logger = setup_logging("DataLoader")

def get_data_generators(data_dir, target_size=(224, 224), batch_size=32):
    """
    Creates optimized dataset objects for training, validation, and testing.
    """
    train_path = os.path.join(data_dir, 'train')
    val_path = os.path.join(data_dir, 'val')
    test_path = os.path.join(data_dir, 'test')

    # Data Augmentation layer as part of the model or mapping
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(0.1),
        tf.keras.layers.RandomZoom(0.1),
        tf.keras.layers.RandomTranslation(0.1, 0.1),
    ])

    def preprocess(image, label):
        image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
        return image, label

    logger.info(f"Loading datasets from {data_dir}...")

    # Load datasets
    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_path,
        image_size=target_size,
        batch_size=batch_size,
        label_mode='categorical'
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_path,
        image_size=target_size,
        batch_size=batch_size,
        label_mode='categorical'
    )

    test_ds = tf.keras.utils.image_dataset_from_directory(
        test_path,
        image_size=target_size,
        batch_size=batch_size,
        label_mode='categorical',
        shuffle=False
    )

    # Optimization
    AUTOTUNE = tf.data.AUTOTUNE
    
    # Apply augmentation only to train
    train_ds = train_ds.map(lambda x, y: (data_augmentation(x, training=True), y), num_parallel_calls=AUTOTUNE)
    
    # Preprocess all (No cache in RAM to avoid OOM)
    train_ds = train_ds.map(preprocess, num_parallel_calls=AUTOTUNE).shuffle(500).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.map(preprocess, num_parallel_calls=AUTOTUNE).prefetch(buffer_size=AUTOTUNE)
    test_ds = test_ds.map(preprocess, num_parallel_calls=AUTOTUNE).prefetch(buffer_size=AUTOTUNE)

    return train_ds, val_ds, test_ds
