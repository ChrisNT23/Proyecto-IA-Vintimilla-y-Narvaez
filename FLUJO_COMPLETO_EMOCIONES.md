# Flujo Completo del Sistema de Detección de Emociones

## 🎯 Visión General

El sistema captura y analiza emociones faciales durante el test MoCA usando **dos tecnologías**:
1. **TinyFaceDetector (face-api.js)** - Frontend, tiempo real
2. **CNN Personalizada** - Backend, análisis profundo

---

## 📊 Flujo Paso a Paso

### **FASE 1: Inicialización (Frontend)**

```
1. Usuario inicia test MoCA
   ↓
2. Componente EmotionCapture se monta
   ↓
3. Carga modelos de face-api.js desde /public/models/
   - TinyFaceDetector (detecta rostros)
   - FaceLandmark68Net (68 puntos faciales)
   - FaceExpressionNet (7 emociones)
   ↓
4. Solicita acceso a la cámara web
   - navigator.mediaDevices.getUserMedia()
   ↓
5. Asigna stream de video al elemento <video>
   ↓
6. Video empieza a reproducirse
   ↓
7. Inicia detección continua cada 500ms
```

**Logs esperados:**
```
Cargando TinyFaceDetector...
Cargando FaceLandmark68Net...
Cargando FaceExpressionNet...
✅ Todos los modelos cargados exitosamente
Solicitando acceso a la cámara...
Stream asignado al video
✅ Video metadata cargada
✅ Video reproduciendo correctamente
🔍 Iniciando detección facial continua...
```

---

### **FASE 2: Detección en Tiempo Real (Frontend - Cada 500ms)**

```
1. detectFaceAndEmotion() se ejecuta
   ↓
2. Verifica:
   - Componente montado ✅
   - Video listo (readyState = 4) ✅
   - Video tiene dimensiones (> 0) ✅
   - Modelos cargados ✅
   ↓
3. Llama a face-api.js:
   faceapi.detectSingleFace(video, options)
     .withFaceLandmarks()
     .withFaceExpressions()
   ↓
4a. Si detecta rostro:
   - Dibuja caja verde alrededor del rostro
   - Dibuja 68 puntos rojos (landmarks)
   - Calcula emoción dominante
   - Muestra: "✅ Rostro detectado - Happy (85%)"
   - Actualiza estado: faceDetected = true
   
4b. Si NO detecta rostro:
   - Muestra: "🔍 Buscando rostro..."
   - Actualiza estado: faceDetected = false
```

**Logs esperados (cada 500ms):**
```
📹 Video estado: readyState=4, dimensiones=640x480
🔍 Iniciando detección facial...
🎯 Llamando a detectSingleFace...
✅ Promesa de detección creada
⏳ Esperando resultado de detección...
📊 Resultado recibido: Rostro detectado
✅ ¡ROSTRO DETECTADO!
🏆 Emoción dominante: happy (85.23%)
💾 Actualizando estado con emoción: {emotion: "happy", confidence: "85.23"}
```

---

### **FASE 3: Captura de Foto (Frontend - Cuando usuario confirma)**

```
1. Usuario hace clic en "Capturar y Continuar"
   ↓
2. Verifica que faceDetected = true
   ↓
3. Crea canvas temporal
   ↓
4. Dibuja frame actual del video en el canvas
   ↓
5. Convierte canvas a base64 (JPEG, 80% calidad)
   ↓
6. Envía POST a /api/emotions/capture con:
   {
     patientId: "xxx",
     image: "data:image/jpeg;base64,...",
     emotion: "happy",           // De face-api.js
     confidence: "85.23",        // De face-api.js
     timestamp: "2025-01-XX...",
     captureType: "initial",
     currentModule: null
   }
```

**Logs esperados:**
```
Capturando foto...
Imagen convertida a base64
Enviando al backend...
```

---

### **FASE 4: Procesamiento en Backend (Node.js)**

```
1. Backend recibe POST /api/emotions/capture
   ↓
2. Valida datos requeridos
   ↓
3. Decodifica imagen base64
   ↓
4. Guarda imagen en disco:
   backend/emotion_captures/{patientId}_{timestamp}.jpg
   ↓
5. Intenta procesar con CNN (MÉTODO PRINCIPAL):
   - Llama a servidor Python: POST /api/evaluate-emotion
   - Envía imagen base64
   ↓
6a. Si CNN funciona:
   - Recibe: {emotion, confidence, all_emotions}
   - Extrae características CNN
   - Usa resultado de CNN como definitivo
   
6b. Si CNN falla:
   - Usa resultado de face-api.js (fallback)
   ↓
7. Guarda en MongoDB:
   {
     emotion: "happy",              // CNN o face-api.js
     confidence: 85.5,
     imageUrl: "/emotion_captures/...",
     emotionProbabilities: {...},   // Solo si CNN
     cnnFeatures: [...],            // Solo si CNN
     detectionMethod: "cnn"         // o "face-api.js"
   }
   ↓
8. Retorna respuesta (status 201):
   {
     success: true,
     emotionDataId: "xxx",
     captureId: "yyy",
     message: "Emoción capturada exitosamente",
     detectionMethod: "cnn" o "face-api.js",
     emotion: "happy",
     confidence: 85.5
   }
   
   **IMPORTANTE**: 
   - El frontend debe incluir token de autenticación en headers
   - Verificar response.ok === true
   - Verificar que data.emotionDataId existe
   - Si hay error, revisar logs en consola del navegador
```

**Logs esperados (Backend):**
```
🔄 Procesando imagen con CNN...
✅ CNN detectó: happy (0.85)
✅ Características CNN extraídas: 256 features
```

O si CNN falla:
```
⚠️ Error procesando con CNN, usando face-api.js como fallback
```

---

### **FASE 5: Procesamiento CNN (Servidor Python - Opcional pero Principal)**

```
1. Servidor Python recibe POST /api/evaluate-emotion
   ↓
2. Decodifica imagen base64
   ↓
3. Preprocesa imagen:
   - Convierte a RGB
   - Redimensiona a 224x224
   - Normaliza para EfficientNet
   ↓
4. Pasa por modelo CNN (EfficientNetB0):
   - Extrae características
   - Calcula probabilidades de 7 emociones
   ↓
5. Retorna:
   {
     emotion: "happy",
     confidence: 0.85,
     all_emotions: {
       "neutral": 0.10,
       "happy": 0.85,
       "sad": 0.02,
       ...
     }
   }
```

**Logs esperados (Python):**
```
[EMOCION CNN] Detectada: happy (0.8500)
```

---

### **FASE 6: Capturas Durante el Test (Frontend - Periódicas)**

```
1. Durante el test MoCA, cada X segundos:
   ↓
2. CapturaEmotionDuringTest() se ejecuta
   ↓
3. Accede a cámara temporalmente
   ↓
4. Detecta con face-api.js
   ↓
5. Captura frame
   ↓
6. Envía al backend con:
   - captureType: "during_test"
   - currentModule: "Memoria" (módulo actual)
   ↓
7. Backend procesa igual que captura inicial
   ↓
8. Se agrega a la misma sesión (emotionDataId)
```

---

### **FASE 7: Cálculo de Variables Derivadas (Backend - Al finalizar)**

```
1. Al finalizar test o al llamar /api/emotions/:id/calculate-derived
   ↓
2. Backend calcula:
   - Índice de variabilidad emocional
   - Consistencia temporal
   - Probabilidades promedio
   - Transiciones emocionales
   - Índice de estrés
   - Índice de ansiedad
   - Variabilidad temporal
   ↓
3. Guarda en derivedVariables del documento
   ↓
4. Retorna estadísticas completas
```

---

## 🔄 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│                                                          │
│  1. Carga modelos face-api.js                           │
│  2. Accede a cámara                                      │
│  3. Detección continua (cada 500ms)                     │
│     └─> TinyFaceDetector detecta rostro                 │
│     └─> FaceExpressionNet detecta emoción                │
│     └─> Muestra resultado en tiempo real                │
│                                                          │
│  4. Usuario confirma → Captura foto                      │
│  5. Envía al backend:                                   │
│     - Imagen (base64)                                    │
│     - Emoción de face-api.js                            │
│     - Confianza                                          │
└─────────────────────────────────────────────────────────┘
                        ↓ HTTP POST
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                     │
│                                                          │
│  1. Recibe imagen + datos                               │
│  2. Guarda imagen en disco                              │
│  3. Intenta procesar con CNN (PRINCIPAL)                │
│     └─> POST a servidor Python                           │
│  4. Si CNN falla → Usa face-api.js (fallback)           │
│  5. Guarda en MongoDB con ambos resultados              │
└─────────────────────────────────────────────────────────┘
                        ↓ HTTP POST (si CNN disponible)
┌─────────────────────────────────────────────────────────┐
│              SERVIDOR PYTHON (Opcional)                   │
│                                                          │
│  1. Recibe imagen base64                                │
│  2. Preprocesa (224x224, normalización)                 │
│  3. Pasa por CNN (EfficientNetB0)                       │
│  4. Retorna:                                            │
│     - Emoción detectada                                  │
│     - Confianza                                          │
│     - Probabilidades de todas las emociones             │
│     - Características CNN (opcional)                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    MONGODB                               │
│                                                          │
│  Guarda:                                                 │
│  - Imagen (ruta)                                         │
│  - Emoción (CNN o face-api.js)                           │
│  - Confianza                                             │
│  - Probabilidades (si CNN)                               │
│  - Características CNN (si CNN)                          │
│  - Método usado (cnn/face-api.js)                       │
│  - Timestamp                                             │
│  - Módulo actual                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Resumen por Componente

### **Frontend (EmotionCapture.jsx)**
- **Responsabilidad**: UX y detección en tiempo real
- **Tecnología**: face-api.js (TinyFaceDetector)
- **Frecuencia**: Cada 500ms
- **Propósito**: Mostrar feedback inmediato al usuario

### **Backend (emotionController.js)**
- **Responsabilidad**: Procesamiento y almacenamiento
- **Tecnología**: Node.js + Integración con Python
- **Frecuencia**: Cuando usuario captura o periódicamente
- **Propósito**: Análisis profundo y persistencia

### **Servidor Python (model_server.py)**
- **Responsabilidad**: Análisis con CNN
- **Tecnología**: TensorFlow/Keras (EfficientNetB0)
- **Frecuencia**: Cuando backend lo llama
- **Propósito**: Precisión mejorada y características profundas

---

## 🎯 Flujo de Datos

```
Imagen de Cámara
    ↓
TinyFaceDetector (face-api.js)
    ↓
Emoción básica detectada
    ↓
Usuario confirma
    ↓
Imagen capturada (base64)
    ↓
Backend recibe
    ↓
Guarda en disco (JPEG)
    ↓
Procesa con CNN (si disponible)
    ↓
Guarda en MongoDB:
    - Emoción (CNN o face-api.js)
    - Probabilidades (CNN)
    - Características (CNN)
    ↓
Calcula variables derivadas
    ↓
Análisis completo disponible
```

---

## 🔍 Puntos Clave

1. **TinyFaceDetector** siempre corre en frontend (tiempo real)
2. **CNN** corre en backend cuando se captura (análisis profundo)
3. **CNN es el método principal** - face-api.js es fallback
4. **Ambos resultados se guardan** para comparación
5. **Variables derivadas** se calculan al finalizar

---

## 📊 Ejemplo de Datos Guardados

```javascript
{
  patient: "677e9e84a41e606b091adf7c",
  captures: [
    {
      emotion: "happy",              // De CNN (más preciso)
      confidence: 85.5,              // De CNN
      timestamp: "2025-01-XX...",
      captureType: "initial",
      detectionMethod: "cnn",       // Indica que se usó CNN
      emotionProbabilities: {        // Solo si CNN
        "neutral": 0.10,
        "happy": 0.85,
        "sad": 0.02,
        ...
      },
      cnnFeatures: [0.23, 0.45, ...], // Vector de características
      imageUrl: "/emotion_captures/..."
    }
  ],
  derivedVariables: {
    emotionalVariabilityIndex: 0.45,
    stressIndex: 0.23,
    anxietyIndex: 0.15,
    ...
  }
}
```

---

¿Quieres que profundice en alguna fase específica?

