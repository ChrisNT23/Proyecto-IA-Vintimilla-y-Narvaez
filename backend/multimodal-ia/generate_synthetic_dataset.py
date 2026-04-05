import pandas as pd
import numpy as np
import os
import sys

# Añadir el directorio actual al path para importar el motor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from multimodal_engine import calculate_emotional_interference

np.random.seed(42)
N = 500

def generate_dataset(n):
    records = []
    # Distribución alineada con los 3 niveles reales del sistema (escala 16):
    # Grave (0-6), Moderado (7-12), Leve (13-16)
    
    for i in range(n):
        # moca_score sobre 16
        moca = int(np.random.choice(
            range(17),
            p=[0.02,0.02,0.02,0.02,0.02,0.05,  # 0–5 (grave) -> 0.15
               0.09,0.09,0.09,0.09,0.09,0.05,  # 6–11 (moderado) -> 0.50
               0.05,0.09,0.09,0.09,0.03]        # 12–16 (leve) -> 0.35
        ))
        
        neg_ratio = np.random.beta(2, 5)          # mayoría baja, algunos altos
        volatility = np.random.beta(1.5, 4)
        clock = np.random.choice([0,1,2,3], p=[0.15,0.25,0.35,0.25])
        cube = np.random.choice([0, 1], p=[0.35, 0.65])
        stress = np.random.uniform(0.1, 0.9)
        
        emotions = ['neutral','sad','fear','angry','happy','disgust','surprise']
        probs = [0.35, 0.20, 0.15, 0.10, 0.10, 0.05, 0.05]
        dominant = np.random.choice(emotions, p=probs)
        
        # Simular distribución para el motor de reglas
        # Si neg_ratio es alto, las emociones negativas suben
        dist = {
            'sad': neg_ratio * 0.4,
            'fear': neg_ratio * 0.3,
            'angry': neg_ratio * 0.2,
            'disgust': neg_ratio * 0.1,
            'neutral': (1 - neg_ratio) * 0.8,
            'surprise': (1 - neg_ratio) * 0.1,
            'happy': (1 - neg_ratio) * 0.1
        }
        
        # Etiqueta generada por el motor de reglas (Camino A)
        interference = calculate_emotional_interference(dist, volatility)
        
        # Etiqueta lógica: posiblemente_sesgado si hay mucha interferencia emocional 
        # y el desempeño es moderado o bajo (moca <= 12)
        label = 'posiblemente_sesgado' if interference in ['alta', 'moderada'] and moca <= 12 else 'confiable'
        
        records.append({
            'moca_total_score': moca,
            'negative_emotion_ratio': round(neg_ratio, 4),
            'emotion_volatility': round(volatility, 4),
            'clock_score': clock,
            'cube_score': cube,
            'stress_index': round(stress, 4),
            'dominant_emotion': dominant,
            'label': label
        })
        
    return pd.DataFrame(records)

if __name__ == "__main__":
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    OUTPUT_FILE = os.path.join(DATA_DIR, 'synthetic_multimodal_dataset.csv')
    
    print(f"Generando dataset sintético de {N} casos...")
    df = generate_dataset(N)
    df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"Dataset guardado en: {OUTPUT_FILE}")
    print("\nDistribución de etiquetas:")
    print(df['label'].value_counts())
    print("\nPromedio MoCA por etiqueta:")
    print(df.groupby('label')['moca_total_score'].mean())
