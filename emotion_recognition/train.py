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
    ensure_dir('models')
    ensure_dir('logs')
    
    # 2. Data Loading
    train_gen, val_gen, test_gen = get_data_generators(data_dir, batch_size=batch_size)
    class_weights = get_class_weights(train_gen)
    logger.info(f"Class weights computed: {class_weights}")
    
    # 3. Model Building
    model, base_model = build_model(num_classes=train_gen.num_classes)
    
    # 4. Phase 1: Training only the custom head
    logger.info("Starting Phase 1: Training custom head...")
    model.compile(
        optimizer=Adam(learning_rate=1e-4),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
    )
    
    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor='val_loss'),
        ReduceLROnPlateau(factor=0.2, patience=3, min_lr=1e-6, monitor='val_loss'),
        ModelCheckpoint('models/best_model_phase1.h5', save_best_only=True, monitor='val_loss')
    ]
    
    history_initial = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=epochs_initial,
        callbacks=callbacks,
        class_weight=class_weights
    )
    
    # 5. Phase 2: Fine-tuning
    logger.info("Starting Phase 2: Fine-tuning...")
    model = get_fine_tuned_model(model, base_model, num_layers_to_unfreeze=30)
    
    # Re-compile with lower learning rate
    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
    )
    
    callbacks_finetune = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor='val_loss'),
        ReduceLROnPlateau(factor=0.2, patience=3, min_lr=1e-7, monitor='val_loss'),
        ModelCheckpoint('models/best_model_final.h5', save_best_only=True, monitor='val_loss')
    ]
    
    history_finetune = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=epochs_finetune,
        callbacks=callbacks_finetune,
        class_weight=class_weights
    )
    
    # 6. Save Final Model
    model.save('models/emotion_model_final.h5')
    
    # Keras 3+ uses .keras as default, and .export() for SavedModel
    try:
        model.save('models/emotion_model_final.keras')
        if hasattr(model, 'export'):
            model.export('models/emotion_model_final_savedmodel')
        else:
            # Fallback for older TF versions
            model.save('models/emotion_model_final_savedmodel', save_format='tf')
    except Exception as e:
        logger.warning(f"Note: SavedModel export encountered an issue: {e}. However, .h5 model was saved successfully.")
    
    logger.info("Model saved successfully.")
    
    return model, history_initial, history_finetune, test_gen

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train FER Model")
    parser.add_argument("--data_dir", type=str, required=True, help="Path to the dataset directory (containing train/val/test)")
    parser.add_argument("--epochs", type=int, default=20, help="Number of epochs for each phase")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    
    args = parser.parse_args()
    
    # Run training
    model, h_init, h_fine, test_gen = train(args.data_dir, epochs_initial=args.epochs, epochs_finetune=args.epochs, batch_size=args.batch_size)
    
    # Run evaluation
    from .evaluate import evaluate_model, plot_history
    class_names = list(test_gen.class_indices.keys())
    evaluate_model(model, test_gen, class_names)
    plot_history(h_init, filename='history_initial.png')
    plot_history(h_fine, filename='history_finetune.png')
    
    print("Pipeline complete. Check models/ and reports/ folders.")
