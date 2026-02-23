import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, f1_score
import pandas as pd
import os
from .utils import setup_logging, EMOTIONS, ensure_dir

logger = setup_logging("Evaluation")

def plot_history(history, filename='training_history.png'):
    """Plots training and validation accuracy/loss."""
    acc = history.history['accuracy']
    val_acc = history.history['val_accuracy']
    loss = history.history['loss']
    val_loss = history.history['val_loss']
    epochs = range(1, len(acc) + 1)

    plt.figure(figsize=(12, 5))
    
    # Plot Accuracy
    plt.subplot(1, 2, 1)
    plt.plot(epochs, acc, 'b', label='Training Acc')
    plt.plot(epochs, val_acc, 'r', label='Validation Acc')
    plt.title('Accuracy')
    plt.legend()
    
    # Plot Loss
    plt.subplot(1, 2, 2)
    plt.plot(epochs, loss, 'b', label='Training Loss')
    plt.plot(epochs, val_loss, 'r', label='Validation Loss')
    plt.title('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join('reports', filename))
    plt.close()

def evaluate_model(model, test_gen, class_names):
    """
    Evaluates the model and generates reports.
    """
    ensure_dir('reports')
    
    logger.info("Starting model evaluation...")
    
    # Predictions
    y_pred_probs = model.predict(test_gen)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = test_gen.classes
    
    # 1. Classification Report
    report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
    report_df = pd.DataFrame(report).transpose()
    report_df.to_csv('reports/classification_report.csv')
    logger.info("Classification report saved.")
    
    # 2. Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', xticklabels=class_names, yticklabels=class_names, cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.savefig('reports/confusion_matrix.png')
    plt.close()
    logger.info("Confusion matrix saved.")
    
    # 3. F1 Scores
    f1 = f1_score(y_true, y_pred, average=None)
    f1_dict = dict(zip(class_names, f1))
    with open('reports/f1_scores.txt', 'w') as f:
        for cls, score in f1_dict.items():
            f.write(f"{cls}: {score:.4f}\n")
    logger.info("F1 scores saved.")
    
    return report
