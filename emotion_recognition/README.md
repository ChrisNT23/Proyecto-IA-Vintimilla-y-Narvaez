# Facial Emotion Recognition (FER) Pipeline

This project implements a production-ready Deep Learning pipeline for recognizing 7 facial emotions using Transfer Learning with MobileNetV2.

## Structure
- `data_loader.py`: Data augmentation and generator setup.
- `model.py`: Model architecture and fine-tuning logic.
- `train.py`: Main training script (Phase 1: Head, Phase 2: Fine-tuning).
- `evaluate.py`: Metrics, Confusion Matrix, and Plots.
- `realtime_inference.py`: Real-time detection using MediaPipe and OpenCV.
- `utils.py`: Logging and class weight handling.

## Requirements
To install dependencies:
```bash
pip install -r requirements.txt
```

## How to Run

### 1. Training
Prepare your dataset in a folder with `train`, `val`, and `test` subdirectories. Each subdirectory should contain folders for each of the 7 classes.

Run the training pipeline from the root directory:
```bash
python -m emotion_recognition.train --data_dir /path/to/dataset --epochs 25
```

### 2. Real-time Inference
Once the model is trained (saved in `models/emotion_model_final.h5`), run:
```bash
python -m emotion_recognition.realtime_inference
```

## Features
- **Transfer Learning**: Uses MobileNetV2 pre-trained on ImageNet.
- **Handling Imbalance**: Automatically computes class weights.
- **Data Augmentation**: Includes rotation, zoom, flip, and brightness adjustments.
- **Real-time Optimized**: Uses MediaPipe for fast face detection and MobileNetV2 for lightweight inference.
- **Evaluation**: Generates detailed reports, F1-scores, and confusion matrices.
