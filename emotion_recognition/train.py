import os
import tensorflow as tf
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from .data_loader import get_data_generators
from .model import build_model, get_fine_tuned_model
from .utils import setup_logging, EMOTIONS, ensure_dir, get_class_weights

logger = setup_logging("Training")

def train(data_dir, epochs_initial=20, epochs_finetune=20, batch_size=32):
    """
    Main training pipeline.
    """
    # 1. Preparations
    base_path = os.getcwd()
    models_dir = os.path.join(base_path, 'models')
    ensure_dir(models_dir)
    ensure_dir(os.path.join(base_path, 'logs'))
    
    # Disabled mixed precision for stability on CPU/Common GPUs
    logger.info("Using standard precision for maximum stability.")

    # 2. Data Loading
    train_ds, val_ds, test_ds = get_data_generators(data_dir, batch_size=batch_size)
    
    # Compute class weights manually since we are using tf.data
    from collections import Counter
    import numpy as np
    
    logger.info("Computing class weights...")
    labels = []
    for _, l in train_ds.unbatch():
        labels.append(np.argmax(l.numpy()))
    
    counts = Counter(labels)
    total = sum(counts.values())
    class_weights = {i: total / (len(counts) * counts[i]) for i in range(len(EMOTIONS))}
    logger.info(f"Class weights: {class_weights}")

    # 3. Model Building
    model, base_model = build_model(num_classes=len(EMOTIONS))
    
    # 4. Phase 1: Training only the custom head
    logger.info("Starting Phase 1: Training custom head...")
    model.compile(
        optimizer=Adam(learning_rate=5e-5), # Lower LR for head to avoid destructive gradients
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
    )
    
    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor='val_loss'),
        ReduceLROnPlateau(factor=0.2, patience=3, min_lr=1e-6, monitor='val_loss'),
        ModelCheckpoint(os.path.join(models_dir, 'best_model_phase1.h5'), save_best_only=True, monitor='val_loss')
    ]
    
    history_initial = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_initial,
        callbacks=callbacks,
        class_weight=class_weights
    )
    
    # 5. Phase 2: Fine-tuning
    logger.info("Starting Phase 2: Fine-tuning...")
    model = get_fine_tuned_model(model, base_model, num_layers_to_unfreeze=50) # Unfreeze more layers
    
    # Re-compile with lower learning rate
    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
    )
    
    callbacks_finetune = [
        EarlyStopping(patience=8, restore_best_weights=True, monitor='val_loss'), # More patience for fine-tuning
        ReduceLROnPlateau(factor=0.2, patience=4, min_lr=1e-7, monitor='val_loss'),
        ModelCheckpoint(os.path.join(models_dir, 'best_model_final.h5'), save_best_only=True, monitor='val_loss')
    ]
    
    history_finetune = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs_finetune,
        callbacks=callbacks_finetune,
        class_weight=class_weights
    )
    
    # 6. Save Final Model
    final_h5 = os.path.join(models_dir, 'emotion_model_final.h5')
    model.save(final_h5)
    
    # Robust export
    try:
        model.save(os.path.join(models_dir, 'emotion_model_final.keras'))
    except Exception as e:
        logger.warning(f"Keras 3 format save issue: {e}")
        
    logger.info(f"Model saved successfully at {models_dir}")
    
    return model, history_initial, history_finetune, test_ds

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train FER Model")
    parser.add_argument("--data_dir", type=str, required=True, help="Path to the dataset directory (containing train/val/test)")
    parser.add_argument("--epochs", type=int, default=20, help="Number of epochs for each phase")
    parser.add_argument("--batch_size", type=int, default=64, help="Increased Batch size for speed")
    
    args = parser.parse_args()
    
    # Run training
    model, h_init, h_fine, test_ds = train(args.data_dir, epochs_initial=args.epochs, epochs_finetune=args.epochs, batch_size=args.batch_size)
    
    # Run evaluation
    from .evaluate import evaluate_model, plot_history
    evaluate_model(model, test_ds)
    plot_history(h_init, filename='history_initial.png')
    plot_history(h_fine, filename='history_finetune.png')
    
    print("Pipeline complete. Reports generated in 'reports/' and models in 'models/'.")
