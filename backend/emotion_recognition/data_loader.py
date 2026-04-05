import os
import tensorflow as tf
from .utils import setup_logging

logger = setup_logging("DataLoader")

def get_data_generators(data_dir, target_size=(224, 224), batch_size=32):
    """
    Creates optimized dataset objects for RAF-DB training with requested augmentations.
    """
    train_path = os.path.join(data_dir, 'train')
    val_path = os.path.join(data_dir, 'val')
    test_path = os.path.join(data_dir, 'test')

    # Data Augmentation layer matching requirements:
    # rotation_range=20 (approx 0.05 in RandomRotation factor as it is in radians or use 20/360)
    # width_shift_range=0.1, height_shift_range=0.1
    # zoom_range=0.15, horizontal_flip=True
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(factor=20/360),
        tf.keras.layers.RandomZoom(height_factor=(-0.15, 0.15)),
        tf.keras.layers.RandomTranslation(height_factor=0.1, width_factor=0.1),
    ])

    def preprocess(image, label):
        # Match the EfficientNet architecture pre-processing
        image = tf.keras.applications.efficientnet.preprocess_input(image)
        return image, label

    logger.info(f"Loading RAF-DB datasets from {data_dir} at {target_size}...")

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
    
    # Apply augmentation and preprocessing
    train_ds = train_ds.map(
        lambda x, y: (data_augmentation(x, training=True), y), 
        num_parallel_calls=AUTOTUNE
    )
    
    train_ds = train_ds.map(preprocess, num_parallel_calls=AUTOTUNE).shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.map(preprocess, num_parallel_calls=AUTOTUNE).prefetch(buffer_size=AUTOTUNE)
    test_ds = test_ds.map(preprocess, num_parallel_calls=AUTOTUNE).prefetch(buffer_size=AUTOTUNE)

    return train_ds, val_ds, test_ds
