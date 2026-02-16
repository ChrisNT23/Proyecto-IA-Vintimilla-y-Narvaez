# Sistema de Datos Biométricos Emocionales

## 📋 Descripción General

Sistema completo para captura, procesamiento y análisis de datos biométricos emocionales durante la aplicación digital del test MoCA.

## 🎯 Características Implementadas

### 1. **Captura de Datos No Estructurados**
- ✅ Captura controlada de imágenes del rostro durante MoCA
- ✅ Soporte para secuencias de frames/video
- ✅ Almacenamiento en formato JPEG/PNG
- ✅ Metadatos temporales y contextuales

### 2. **Extracción de Características con CNN**
- ✅ Procesamiento con modelos CNN preentrenados (transfer learning)
- ✅ Extracción de vectores de características
- ✅ Cálculo de probabilidades de emociones
- ✅ Integración con servidor Python de modelos

### 3. **Variables Derivadas**

#### Índices de Variabilidad Emocional
- **emotionalVariabilityIndex**: Mide qué tan variable son las emociones (0-1)
  - 0 = Muy estable
  - 1 = Muy variable

#### Consistencia Temporal
- **temporalConsistency**: Mide consistencia de expresiones en ventanas de tiempo (0-1)
  - Basado en entropía de Shannon
  - Análisis por ventanas de 30 segundos

#### Probabilidades Promedio
- **averageEmotionProbabilities**: Probabilidades promedio por emoción
  - Calculado sobre todas las capturas
  - Formato: `{emotion: probability}`

#### Transiciones Emocionales
- **emotionTransitions**: Frecuencia de transiciones entre emociones
  - Formato: `{"emotion1->emotion2": frequency}`
  - Útil para detectar patrones de cambio emocional

#### Índices de Estrés y Ansiedad
- **stressIndex**: Índice de estrés (0-1)
  - Basado en emociones: angry, fearful, sad
  - Ponderado por frecuencia y confianza

- **anxietyIndex**: Índice de ansiedad (0-1)
  - Basado en emociones: fearful, surprised
  - Ponderado por frecuencia y confianza

#### Variabilidad Temporal
- **temporalVariability**: Cambios emocionales por segundo
  - Mide la velocidad de cambio emocional
  - Útil para detectar inestabilidad emocional

## 📊 Estructura de Datos

### Modelo de Captura (`emotionCaptureSchema`)
```javascript
{
  emotion: String,                    // Emoción detectada
  confidence: Number,                 // Confianza (0-100)
  timestamp: Date,                    // Timestamp de captura
  captureType: String,                // 'initial' | 'during_test'
  currentModule: String,              // Módulo MoCA actual
  imageUrl: String,                  // Ruta a la imagen
  emotionProbabilities: Map,          // Probabilidades de todas las emociones
  cnnFeatures: [Number],              // Vector de características CNN
  frameIndex: Number                  // Índice en secuencia
}
```

### Modelo de Datos (`emotionDataSchema`)
```javascript
{
  patient: ObjectId,
  mocaTest: ObjectId,
  captures: [emotionCaptureSchema],
  testStartTime: Date,
  testEndTime: Date,
  derivedVariables: {
    emotionalVariabilityIndex: Number,
    temporalConsistency: Number,
    averageEmotionProbabilities: Map,
    emotionTransitions: Map,
    stressIndex: Number,
    anxietyIndex: Number,
    temporalVariability: Number
  },
  processingMetadata: {
    totalFrames: Number,
    processedFrames: Number,
    cnnModel: String,
    processingDate: Date
  }
}
```

## 🔌 Endpoints de la API

### 1. Capturar Emoción Individual
```http
POST /api/emotions/capture
```
**Body:**
```json
{
  "patientId": "string",
  "emotionDataId": "string (opcional)",
  "image": "base64 string",
  "emotion": "string",
  "confidence": "number",
  "timestamp": "ISO string",
  "captureType": "initial | during_test",
  "currentModule": "string (opcional)"
}
```

**Respuesta:**
```json
{
  "success": true,
  "emotionDataId": "string",
  "captureId": "string"
}
```

### 2. Procesar Secuencia de Frames
```http
POST /api/emotions/process-sequence
```
**Body:**
```json
{
  "patientId": "string",
  "emotionDataId": "string (opcional)",
  "images": ["base64", "base64", ...],
  "timestamps": ["ISO string", ...],
  "currentModule": "string (opcional)"
}
```

**Respuesta:**
```json
{
  "success": true,
  "emotionDataId": "string",
  "processedFrames": 10,
  "results": [...],
  "derivedVariables": {
    "emotionalVariabilityIndex": 0.45,
    "temporalConsistency": 0.78,
    "stressIndex": 0.23,
    "anxietyIndex": 0.15,
    "temporalVariability": 0.05
  }
}
```

### 3. Calcular Variables Derivadas
```http
POST /api/emotions/:emotionDataId/calculate-derived
```

**Respuesta:**
```json
{
  "success": true,
  "derivedVariables": {
    "emotionalVariabilityIndex": 0.45,
    "temporalConsistency": 0.78,
    "averageEmotionProbabilities": {
      "neutral": 0.65,
      "happy": 0.20,
      "sad": 0.10,
      ...
    },
    "emotionTransitions": {
      "neutral->happy": 3,
      "happy->neutral": 2,
      ...
    },
    "stressIndex": 0.23,
    "anxietyIndex": 0.15,
    "temporalVariability": 0.05
  }
}
```

### 4. Obtener Estadísticas (Incluye Variables Derivadas)
```http
GET /api/emotions/:emotionDataId/stats
```

**Respuesta:**
```json
{
  "totalCaptures": 25,
  "emotionCounts": {
    "neutral": 15,
    "happy": 5,
    "sad": 3,
    ...
  },
  "dominantEmotion": {
    "emotion": "neutral",
    "count": 15
  },
  "avgConfidence": 78.5,
  "emotionsByModule": {...},
  "testDuration": 15,
  "derivedVariables": {
    "emotionalVariabilityIndex": 0.45,
    "temporalConsistency": 0.78,
    "stressIndex": 0.23,
    "anxietyIndex": 0.15,
    "temporalVariability": 0.05
  }
}
```

## 🔧 Servicios y Utilidades

### `emotionProcessingService.js`
- `processImageWithCNN()`: Procesa imagen individual con CNN
- `processImageSequence()`: Procesa secuencia de imágenes
- `extractCNNFeatures()`: Extrae vector de características

### `emotionAnalysis.js`
- `calculateEmotionalVariabilityIndex()`: Índice de variabilidad
- `calculateTemporalConsistency()`: Consistencia temporal
- `calculateAverageEmotionProbabilities()`: Probabilidades promedio
- `calculateEmotionTransitions()`: Transiciones emocionales
- `calculateStressIndex()`: Índice de estrés
- `calculateAnxietyIndex()`: Índice de ansiedad
- `calculateTemporalVariability()`: Variabilidad temporal
- `calculateAllDerivedVariables()`: Calcula todas las variables

## 📈 Flujo de Procesamiento

```
1. Captura de Imagen/Frame
   ↓
2. Almacenamiento en disco (JPEG/PNG)
   ↓
3. Procesamiento con CNN (servidor Python)
   - Extracción de características
   - Cálculo de probabilidades emocionales
   ↓
4. Almacenamiento en MongoDB
   - Imagen + metadatos
   - Características CNN
   - Probabilidades emocionales
   ↓
5. Cálculo de Variables Derivadas
   - Índices de variabilidad
   - Consistencia temporal
   - Índices de estrés/ansiedad
   ↓
6. Análisis y Reportes
```

## 🎓 Uso de Transfer Learning

El sistema está diseñado para usar modelos preentrenados debido a:
- Dataset pequeño en etapa inicial
- Necesidad de precisión inmediata
- Limitación de datos propios

**Modelos CNN disponibles:**
- EfficientNetB0 (recomendado)
- ResNet50
- MobileNetV2
- VGG16
- DenseNet121

## 📝 Ejemplo de Uso

### Captura durante test MoCA
```javascript
// En el frontend, durante el test
const captureEmotion = async () => {
  const imageData = canvas.toDataURL('image/jpeg');
  
  await fetch('/api/emotions/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: patientId,
      emotionDataId: emotionDataId,
      image: imageData,
      emotion: detectedEmotion,
      confidence: confidence,
      timestamp: new Date().toISOString(),
      captureType: 'during_test',
      currentModule: 'Memoria'
    })
  });
};
```

### Procesar secuencia completa
```javascript
// Al finalizar el test
const processSequence = async (frames) => {
  const response = await fetch('/api/emotions/process-sequence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: patientId,
      emotionDataId: emotionDataId,
      images: frames.map(f => f.imageData),
      timestamps: frames.map(f => f.timestamp),
      currentModule: 'Final'
    })
  });
  
  const data = await response.json();
  console.log('Variables derivadas:', data.derivedVariables);
};
```

## 🔍 Interpretación de Variables

### Emotional Variability Index
- **< 0.3**: Emociones muy estables (posible apatía o control emocional)
- **0.3 - 0.6**: Variabilidad normal
- **> 0.6**: Alta variabilidad (posible inestabilidad emocional)

### Stress Index
- **< 0.2**: Bajo estrés
- **0.2 - 0.5**: Estrés moderado
- **> 0.5**: Alto estrés

### Anxiety Index
- **< 0.2**: Baja ansiedad
- **0.2 - 0.5**: Ansiedad moderada
- **> 0.5**: Alta ansiedad

### Temporal Consistency
- **> 0.7**: Muy consistente
- **0.4 - 0.7**: Moderadamente consistente
- **< 0.4**: Inconsistente

## 🚀 Próximos Pasos

1. **Análisis longitudinal**: Comparar variables entre tests
2. **Alertas automáticas**: Notificar cuando índices superen umbrales
3. **Visualizaciones**: Gráficos de evolución temporal
4. **Machine Learning**: Modelos predictivos basados en variables derivadas
5. **Integración con resultados MoCA**: Correlación emocional-cognitiva

## 📚 Referencias

- Transfer Learning para visión por computador
- Análisis temporal de señales emocionales
- Índices de variabilidad en datos biométricos
- CNN para reconocimiento de emociones faciales

