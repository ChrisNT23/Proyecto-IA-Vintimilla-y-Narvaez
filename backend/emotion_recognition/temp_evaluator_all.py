import os
import numpy as np
import tensorflow as tf
from PIL import Image, ImageEnhance
import pandas as pd
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EMOTION_MODEL = os.path.join(BASE_DIR, "backend/ai_models/emotion_model_final.keras")
CUBE_MODEL = os.path.join(BASE_DIR, "backend/model_cube_final.h5")
CLOCK_MODEL = os.path.join(BASE_DIR, "backend/best_model_clock.keras")

EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

def add_gaussian_noise(image_array):
    noise = np.random.normal(0, 15, image_array.shape)
    noisy_image = np.clip(image_array + noise, 0, 255).astype(np.uint8)
    return noisy_image

def adjust_brightness(image, factor):
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(factor)

def evaluate_emotions(model_path, data_dir):
    print(f"--- Evaluating Emotions ({model_path}) ---")
    model = tf.keras.models.load_model(model_path)
    correct, incorrect = [], []
    for emotion in EMOTIONS:
        folder = os.path.join(data_dir, emotion)
        if not os.path.exists(folder): continue
        for f in os.listdir(folder)[:50]:
            img_path = os.path.join(folder, f)
            img = Image.open(img_path).convert('RGB').resize((224, 224))
            processed = tf.keras.applications.efficientnet.preprocess_input(np.array(img))
            pred = model.predict(np.expand_dims(processed, 0), verbose=0)[0]
            pred_idx = np.argmax(pred)
            res = {"path": img_path, "true": emotion, "pred": EMOTIONS[pred_idx], "conf": float(pred[pred_idx])}
            if pred_idx == EMOTIONS.index(emotion): correct.append(res)
            else: incorrect.append(res)
            if len(correct) >= 5 and len(incorrect) >= 5: break
    
    robustness = []
    for item in correct[:5]:
        img = Image.open(item['path']).convert('RGB').resize((224, 224))
        n_proc = tf.keras.applications.efficientnet.preprocess_input(add_gaussian_noise(np.array(img)))
        b_proc = tf.keras.applications.efficientnet.preprocess_input(np.array(adjust_brightness(img, 0.7)))
        p_n = EMOTIONS[np.argmax(model.predict(np.expand_dims(n_proc, 0), verbose=0)[0])]
        p_b = EMOTIONS[np.argmax(model.predict(np.expand_dims(b_proc, 0), verbose=0)[0])]
        robustness.append({"original": item['true'], "pred_noisy": p_n, "pred_bright": p_b})
    return correct[:5], incorrect[:5], robustness

def evaluate_cube(model_path, data_dir):
    print(f"--- Evaluating Cube ({model_path}) ---")
    model = tf.keras.models.load_model(model_path)
    correct, incorrect = [], []
    for label in ['0', '1']:
        folder = os.path.join(data_dir, label)
        if not os.path.exists(folder):
            print(f"Folder not found: {folder}")
            continue
        for f in os.listdir(folder)[:100]:
            img_path = os.path.join(folder, f)
            img = Image.open(img_path).convert('RGB').resize((224, 224))
            processed = tf.keras.applications.mobilenet_v2.preprocess_input(np.array(img))
            pred = np.array(model.predict(np.expand_dims(processed, 0), verbose=0)).flatten()[0]
            pred_label = '1' if pred >= 0.5 else '0'
            res = {"path": img_path, "true": label, "pred": pred_label, "conf": float(pred)}
            if pred_label == label: correct.append(res)
            else: incorrect.append(res)
            if len(correct) >= 5 and len(incorrect) >= 5: break
    
    robustness = []
    for item in correct[:5]:
        img = Image.open(item['path']).convert('RGB').resize((224, 224))
        n_proc = tf.keras.applications.mobilenet_v2.preprocess_input(add_gaussian_noise(np.array(img)))
        b_proc = tf.keras.applications.mobilenet_v2.preprocess_input(np.array(adjust_brightness(img, 0.7)))
        p_n = '1' if model.predict(np.expand_dims(n_proc, 0), verbose=0).flatten()[0] >= 0.5 else '0'
        p_b = '1' if model.predict(np.expand_dims(b_proc, 0), verbose=0).flatten()[0] >= 0.5 else '0'
        robustness.append({"original": item['true'], "pred_noisy": p_n, "pred_bright": p_b})
    return correct[:5], incorrect[:5], robustness

def evaluate_clock(model_path, val_dir, csv_path):
    print(f"--- Evaluating Clock ({model_path}) ---")
    model = tf.keras.models.load_model(model_path)
    df = pd.read_csv(csv_path)
    correct, incorrect = [], []
    for _, row in df.iterrows():
        img_path = os.path.join(val_dir, row['filename'])
        if not os.path.exists(img_path): continue
        img = Image.open(img_path).convert('RGB').resize((224, 224))
        processed = tf.keras.applications.mobilenet_v2.preprocess_input(np.array(img))
        preds = model.predict(np.expand_dims(processed, 0), verbose=0)
        # Handle both multi-output list and single multi-column output
        if isinstance(preds, list):
            p_vals = [1 if p[0][0] >= 0.5 else 0 for p in preds]
        else:
            p_vals = [1 if v >= 0.5 else 0 for v in preds[0]]
        
        true_vals = [int(row['contorno']), int(row['numeros']), int(row['agujas'])]
        res = {"path": img_path, "true": true_vals, "pred": p_vals}
        if true_vals == p_vals: correct.append(res)
        else: incorrect.append(res)
        if len(correct) >= 5 and len(incorrect) >= 5: break

    robustness = []
    for item in correct[:5]:
        img = Image.open(item['path']).convert('RGB').resize((224, 224))
        n_proc = tf.keras.applications.mobilenet_v2.preprocess_input(add_gaussian_noise(np.array(img)))
        b_proc = tf.keras.applications.mobilenet_v2.preprocess_input(np.array(adjust_brightness(img, 0.7)))
        
        def get_pred(p_in):
            pr = model.predict(np.expand_dims(p_in, 0), verbose=0)
            if isinstance(pr, list): return [1 if p[0][0] >= 0.5 else 0 for p in pr]
            return [1 if v >= 0.5 else 0 for v in pr[0]]
            
        robustness.append({"original": item['true'], "pred_noisy": get_pred(n_proc), "pred_bright": get_pred(b_proc)})
    return correct[:5], incorrect[:5], robustness

if __name__ == "__main__":
    results = {}
    try: results['emotions'] = dict(zip(['correct','incorrect','robustness'], evaluate_emotions(EMOTION_MODEL, os.path.join(BASE_DIR, "backend/emotion_recognition/data/test"))))
    except Exception as e: print(f"Emotions error: {e}")
    try: results['cube'] = dict(zip(['correct','incorrect','robustness'], evaluate_cube(CUBE_MODEL, os.path.join(BASE_DIR, "backend/data/test"))))
    except Exception as e: print(f"Cube error: {e}")
    try: results['clock'] = dict(zip(['correct','incorrect','robustness'], evaluate_clock(CLOCK_MODEL, os.path.join(BASE_DIR, "backend/data_clock/val"), os.path.join(BASE_DIR, "backend/data_clock/val/val_labels.csv"))))
    except Exception as e: print(f"Clock error: {e}")
    
    # Save the results in the same folder as the script
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diagnostic_results.json")
    with open(output_path, "w") as f: json.dump(results, f, indent=4)
    print(f"\n✅ Final results saved to {output_path}")
