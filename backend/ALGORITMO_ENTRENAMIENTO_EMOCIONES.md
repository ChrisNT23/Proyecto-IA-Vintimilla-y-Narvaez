# Algoritmo de Entrenamiento para Detección de Emociones

## 📊 Resumen Ejecutivo

El sistema utiliza **Transfer Learning** con **EfficientNetB0** como arquitectura base, optimizado con **Adam** y un proceso de **fine-tuning** en dos fases.

---

## 🏗️ Arquitectura del Modelo

### **Modelo Base: EfficientNetB0**
- **Arquitectura**: EfficientNetB0 (preentrenado en ImageNet)
- **Input**: Imágenes de 224x224x3 (RGB)
- **Output**: 7 clases de emociones (softmax)
- **Pesos iniciales**: ImageNet (transfer learning)

### **Estructura Completa**:
```
Input (224x224x3)
    ↓
EfficientNetB0 Base (congelado inicialmente)
    ↓
GlobalAveragePooling2D
    ↓
BatchNormalization
    ↓
Dense(1024, ReLU) + L2 Regularization (0.001) + Dropout(0.5)
    ↓
Dense(512, ReLU) + L2 Regularization (0.001) + Dropout(0.3)
    ↓
Dense(7, Softmax) → [neutral, happy, sad, angry, fearful, disgusted, surprised]
```

---

## 🎯 Algoritmo de Optimización

### **Optimizador: Adam (Adaptive Moment Estimation)**
- **Learning Rate Inicial**: 0.0001
- **Learning Rate Schedule**: Reducción programada
  - Épocas 0-15: LR = 0.0001
  - Épocas 15-30: LR = 0.00005 (50% del inicial)
  - Épocas 30+: LR = 0.00001 (10% del inicial)

### **Función de Pérdida: Categorical Crossentropy**
- Apropiada para clasificación multiclase (7 emociones)
- Calcula la diferencia entre probabilidades predichas y verdaderas

### **Métricas de Evaluación**:
- `accuracy`: Precisión general
- `top_k_categorical_accuracy`: Precisión top-k (útil para verificar si la emoción correcta está en las top predicciones)

---

## 📈 Proceso de Entrenamiento (2 Fases)

### **FASE 1: Entrenamiento Inicial (50 épocas)**

1. **Transfer Learning**:
   - Base EfficientNetB0 **congelado** (pesos de ImageNet)
   - Solo se entrenan las capas densas superiores
   - Learning Rate: 0.0001

2. **Data Augmentation** (específico para rostros):
   ```python
   - Rotación: ±15 grados
   - Desplazamiento: 10% horizontal/vertical
   - Zoom: ±10%
   - Flip horizontal: Sí
   - Brillo: 80-120%
   - Rescale: 1/255 (normalización)
   ```

3. **Callbacks**:
   - **EarlyStopping**: Patience=20, monitor='val_accuracy'
   - **ModelCheckpoint**: Guarda mejor modelo según val_accuracy
   - **ReduceLROnPlateau**: Reduce LR si no mejora (factor=0.5, patience=5)
   - **LearningRateScheduler**: Reducción programada de LR
   - **CSVLogger**: Guarda logs de entrenamiento

### **FASE 2: Fine-Tuning (30 épocas adicionales)**

1. **Descongelamiento Parcial**:
   - Últimas 40 capas de EfficientNetB0 se descongelan
   - Resto de capas permanecen congeladas
   - Learning Rate reducido: 0.00001 (10x menor)

2. **Objetivo**:
   - Ajustar características específicas de rostros
   - Mejorar precisión en el dominio de emociones

---

## 🔧 Hiperparámetros

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Batch Size** | 32 | Imágenes por lote |
| **Epochs (Fase 1)** | 50 | Épocas iniciales |
| **Epochs (Fase 2)** | 30 | Épocas de fine-tuning |
| **Learning Rate Inicial** | 0.0001 | Tasa de aprendizaje |
| **Learning Rate Fine-tune** | 0.00001 | LR reducido para fine-tuning |
| **Dropout Rate** | 0.5 / 0.3 | Regularización (capa 1 / capa 2) |
| **L2 Regularization** | 0.001 | Penalización de pesos |
| **Early Stopping Patience** | 20 | Épocas sin mejora antes de parar |
| **Image Size** | 224x224 | Tamaño de entrada |

---

## 📊 Data Augmentation

### **Transformaciones Aplicadas**:
```python
ImageDataGenerator(
    rescale=1.0/255,              # Normalización [0,1]
    rotation_range=15,             # Rotación ±15° (conservador para rostros)
    width_shift_range=0.1,         # Desplazamiento horizontal 10%
    height_shift_range=0.1,        # Desplazamiento vertical 10%
    zoom_range=0.1,                # Zoom ±10%
    horizontal_flip=True,          # Flip horizontal (rostros simétricos)
    brightness_range=[0.8, 1.2],   # Variación de brillo
    fill_mode='nearest'            # Relleno de bordes
)
```

**Razón**: Las transformaciones son conservadoras porque:
- Los rostros tienen estructura específica
- Demasiada rotación puede distorsionar características faciales
- El flip horizontal es natural (rostros son simétricos)

---

## 🎓 Técnicas de Regularización

1. **Dropout**:
   - Capa 1: 50% (previene sobreajuste)
   - Capa 2: 30% (menos agresivo)

2. **L2 Regularization**:
   - Factor: 0.001 en capas densas
   - Penaliza pesos grandes

3. **Batch Normalization**:
   - Después de pooling y antes de capas densas
   - Estabiliza el entrenamiento

4. **Early Stopping**:
   - Previene sobreentrenamiento
   - Restaura mejores pesos al finalizar

---

## 📁 Estructura de Datos Esperada

```
data_emotions/
├── train/
│   ├── neutral/
│   ├── happy/
│   ├── sad/
│   ├── angry/
│   ├── fearful/
│   ├── disgusted/
│   └── surprised/
├── val/
│   └── [misma estructura]
└── test/
    └── [misma estructura]
```

---

## 🔄 Flujo de Entrenamiento Completo

```
1. Cargar EfficientNetB0 preentrenado (ImageNet)
   ↓
2. Congelar todas las capas base
   ↓
3. Agregar capas densas personalizadas
   ↓
4. Compilar con Adam (LR=0.0001)
   ↓
5. Entrenar 50 épocas con data augmentation
   ├─ Early stopping si no mejora
   ├─ Guardar mejor modelo
   └─ Reducir LR si estancado
   ↓
6. Descongelar últimas 40 capas
   ↓
7. Fine-tuning 30 épocas (LR=0.00001)
   ├─ Ajustar características faciales
   └─ Mejorar precisión específica
   ↓
8. Guardar modelo final (model_emotions_finetuned.h5)
```

---

## 📈 Ventajas de Este Enfoque

1. **Transfer Learning**:
   - Aprovecha conocimiento de ImageNet
   - Requiere menos datos propios
   - Entrenamiento más rápido

2. **EfficientNetB0**:
   - Balance eficiencia/precisión
   - Arquitectura optimizada
   - Buen rendimiento en imágenes pequeñas

3. **Fine-Tuning**:
   - Adapta características a rostros
   - Mejora precisión en dominio específico
   - Mantiene generalización

4. **Regularización**:
   - Previene sobreajuste
   - Mejora generalización
   - Modelo más robusto

---

## 🎯 Resultados Esperados

- **Precisión de Validación**: >85%
- **Precisión de Test**: >80%
- **Tiempo de Inferencia**: <100ms por imagen
- **Tamaño del Modelo**: ~15-20 MB

---

## 🔍 Comparación con Alternativas

| Método | Ventajas | Desventajas |
|--------|----------|-------------|
| **EfficientNetB0 (Actual)** | Balance eficiencia/precisión | Requiere fine-tuning |
| **MobileNetV2** | Más rápido, menor tamaño | Menor precisión |
| **ResNet50** | Mayor precisión | Más lento, mayor tamaño |
| **CNN desde cero** | Control total | Requiere muchos datos, más lento |

---

## 📝 Comandos de Entrenamiento

```bash
# Entrenar modelo de emociones
cd backend
python train_cnn_emotions.py

# El script generará:
# - model_emotions.h5 (después de fase 1)
# - model_emotions_finetuned.h5 (después de fase 2)
# - emotion_classes.json (mapeo de clases)
# - model_emotions_training.log (logs)
```

---

## 🔧 Personalización

Para cambiar el algoritmo de entrenamiento, modifica:

1. **Arquitectura base**: Cambiar `EfficientNetB0` en `cnn_models.py`
2. **Optimizador**: Cambiar `Adam` por `SGD`, `RMSprop`, etc.
3. **Learning Rate**: Ajustar en `train_cnn_emotions.py`
4. **Data Augmentation**: Modificar `ImageDataGenerator`
5. **Fine-tuning**: Ajustar número de capas descongeladas

---

## 📚 Referencias Técnicas

- **EfficientNet**: Tan & Le (2019) - "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks"
- **Transfer Learning**: Yosinski et al. (2014) - "How transferable are features in deep neural networks?"
- **Adam Optimizer**: Kingma & Ba (2014) - "Adam: A Method for Stochastic Optimization"

---

¿Quieres modificar algún aspecto del algoritmo de entrenamiento?

