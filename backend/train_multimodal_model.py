import pandas as pd
import pickle
import os
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

# Configurar rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'synthetic_multimodal_dataset.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'ai_models')
MODEL_FILE = os.path.join(MODEL_DIR, 'multimodal_dtree_model.pkl')

if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

def train_model():
    print(f"Cargando dataset desde {DATA_FILE}...")
    df = pd.read_csv(DATA_FILE)
    
    # Codificar la variable categórica dominant_emotion
    le = LabelEncoder()
    df['dominant_emotion_encoded'] = le.fit_transform(df['dominant_emotion'])
    
    # Definir variables independientes y dependiente
    FEATURES = [
        'moca_total_score',
        'negative_emotion_ratio',
        'emotion_volatility',
        'clock_score',
        'cube_score',
        'stress_index',
        'dominant_emotion_encoded'
    ]
    X = df[FEATURES]
    y = df['label']
    
    # Dividir en entrenamiento y prueba
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Entrenar Árbol de Decisión (profundidad limitada para interpretación y evitar overfitting)
    clf = DecisionTreeClassifier(max_depth=4, class_weight='balanced', random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluación con Validación Cruzada
    print("\nEvaluación con Validación Cruzada (k=5):")
    cv_scores = cross_val_score(clf, X, y, cv=5, scoring='f1_weighted')
    print(f"F1weighted: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
    
    # Evaluación en Test Set
    print("\nReporte de Clasificación (Test Set):")
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    # Visualización de reglas (texto)
    print("\nReglas del Árbol de Decisión:")
    print(export_text(clf, feature_names=FEATURES))
    
    # Guardar modelo, encoder y lista de features
    print(f"\nGuardando modelo en {MODEL_FILE}...")
    model_data = {
        'model': clf,
        'label_encoder': le,
        'features': FEATURES,
        'classes': le.classes_.tolist()
    }
    with open(MODEL_FILE, 'wb') as f:
        pickle.dump(model_data, f)
    print("¡Modelo guardado exitosamente!")

if __name__ == "__main__":
    train_model()
