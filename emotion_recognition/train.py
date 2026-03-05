import os
import tensorflow as tf
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TerminateOnNaN
from .data_loader import get_data_generators
from .model import build_model, get_fine_tuned_model
from .utils import setup_logging, EMOTIONS, ensure_dir
from .evaluate import evaluate_model, plot_history

logger = setup_logging("Training")

def train(data_dir, epochs_initial=25, epochs_finetune=30, batch_size=32):
    """
    RAF-DB High Accuracy Training Pipeline
    EfficientNetB0 + 224x224 Resolution + Transfer Learning
    """
    # 1. Preparations
    base_path = os.getcwd()
    models_dir = os.path.join(base_path, 'models')
    ensure_dir(models_dir)
    ensure_dir(os.path.join(base_path, 'logs'))
    ensure_dir(os.path.join(base_path, 'reports'))
    
    logger.info("Starting RAF-DB Training: EfficientNetB0 @ 224x224")

    # 2. Data Loading (224x224 resolution for high accuracy)
    train_ds, val_ds, test_ds = get_data_generators(data_dir, batch_size=batch_size, target_size=(224, 224))
    
    # 3. Model Building
    model, base_model = build_model(num_classes=len(EMOTIONS), input_shape=(224, 224, 3))
    
    # 4. Phase 1: Training the custom head (1e-3)
    logger.info("Phase 1: Training custom head (1e-3)...")
    model.compile(
        optimizer=Adam(learning_rate=1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
    )
    
    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor='val_accuracy'),
        ReduceLROnPlateau(factor=0.5, patience=3, min_lr=1e-5, monitor='val_accuracy'),
        TerminateOnNaN()
    ]
    
    history_initial = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_initial,
        callbacks=callbacks
    )
    
    # 5. Phase 2: Fine-tuning (1e-5)
    logger.info("Phase 2: Fine-tuning EfficientNet layers (1e-5)...")
    model = get_fine_tuned_model(model, base_model, num_layers_to_unfreeze=30)
    
    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
    )
    
    callbacks_finetune = [
        EarlyStopping(patience=10, restore_best_weights=True, monitor='val_accuracy'),
        ReduceLROnPlateau(factor=0.2, patience=5, min_lr=1e-7, monitor='val_accuracy'),
        ModelCheckpoint(os.path.join(models_dir, 'best_model_checkpoint.keras'), save_best_only=True, monitor='val_accuracy')
    ]
    
    history_finetune = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_finetune,
        callbacks=callbacks_finetune
    )
    
    # 6. Save Final Model and Generate Reports
    logger.info("Generating Final Emotional Intelligence Reports...")
    model.save(os.path.join(models_dir, 'emotion_model_final.keras'))
    model.save(os.path.join(models_dir, 'emotion_model_final.h5'))
    
    evaluate_model(model, test_ds)
    plot_history(history_initial, filename='history_initial.png')
    plot_history(history_finetune, filename='history_finetune.png')
    
    logger.info(f"DONE. Model saved in 'models/' and all reports in 'reports/'.")
    
    return model

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train High-Accuracy RAF-DB Model")
    parser.add_argument("--data_dir", type=str, required=True, help="Path to prepared data")
    parser.add_argument("--epochs", type=int, default=40, help="Epochs per phase")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    
    args = parser.parse_args()
    
    train(args.data_dir, epochs_initial=args.epochs, epochs_finetune=args.epochs, batch_size=args.batch_size)
