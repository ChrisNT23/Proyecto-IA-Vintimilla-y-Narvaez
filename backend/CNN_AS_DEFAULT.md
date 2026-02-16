# CNN como Método por Defecto - Configuración

## ✅ Cambios Implementados

La CNN ahora es el **método principal por defecto** para detección de emociones. El sistema funciona así:

## 🔄 Flujo Actualizado

```
1. Frontend: TinyFaceDetector detecta en tiempo real (UX)
   ↓
2. Usuario confirma captura
   ↓
3. Backend recibe imagen
   ↓
4. Backend intenta procesar con CNN PRIMERO (método principal)
   ↓
5a. Si CNN funciona → Usa resultado de CNN ✅
5b. Si CNN falla → Usa resultado de face-api.js (fallback)
   ↓
6. Guarda en MongoDB con metadatos del método usado
```

## 📝 Cambios en el Código

### Backend Controller (`emotionController.js`)

**Antes:**
- CNN era opcional
- Solo se usaba si estaba disponible

**Ahora:**
- CNN es el método principal
- Siempre intenta usar CNN primero
- face-api.js solo como fallback si CNN falla
- Logs claros indicando qué método se usó

### Servidor Python (`model_server.py`)

**Agregado:**
- Endpoint `/api/evaluate-emotion` para procesar emociones con CNN
- Endpoint `/api/extract-features` para extraer características CNN
- Carga automática del modelo de emociones (intenta versión fine-tuned primero)

## 🎯 Comportamiento

### Escenario 1: CNN Disponible ✅
```
1. Frontend detecta con face-api.js (feedback visual)
2. Backend procesa con CNN
3. Resultado: Usa CNN (más preciso)
4. Guarda: detectionMethod = 'cnn'
```

### Escenario 2: CNN No Disponible ⚠️
```
1. Frontend detecta con face-api.js
2. Backend intenta CNN → Falla
3. Resultado: Usa face-api.js (fallback)
4. Guarda: detectionMethod = 'face-api.js'
```

## 📊 Metadatos Guardados

Cada captura ahora incluye:
```javascript
{
  emotion: "happy",              // Emoción detectada (CNN o face-api.js)
  confidence: 85.5,              // Confianza
  detectionMethod: "cnn",        // Método usado: 'cnn' | 'face-api.js'
  emotionProbabilities: {...},   // Probabilidades de CNN (si disponible)
  cnnFeatures: [...],           // Características CNN (si disponible)
}
```

## 🚀 Requisitos

Para que CNN funcione como método principal:

1. **Servidor Python corriendo** en puerto 5001
2. **Modelo de emociones entrenado**:
   - `model_emotions_finetuned.h5` (preferido)
   - O `model_emotions.h5` (alternativa)

## 📋 Verificación

### Verificar que CNN está activa:

1. **Revisar logs del backend:**
   ```
   🔄 Procesando imagen con CNN...
   ✅ CNN detectó: happy (0.85)
   ✅ Características CNN extraídas: 256 features
   ```

2. **Revisar logs del servidor Python:**
   ```
   [EMOCION CNN] Detectada: happy (0.8500)
   ```

3. **Verificar en MongoDB:**
   ```javascript
   {
     detectionMethod: "cnn",  // ← Indica que se usó CNN
     cnnFeatures: [0.23, 0.45, ...]  // ← Características presentes
   }
   ```

## 🔧 Troubleshooting

### Si CNN no se activa:

1. **Verificar servidor Python:**
   ```bash
   # Debe estar corriendo en puerto 5001
   python backend/model_server.py
   ```

2. **Verificar modelo de emociones:**
   ```bash
   # Debe existir uno de estos archivos:
   ls backend/model_emotions*.h5
   ```

3. **Verificar logs:**
   - Si ves "⚠️ Error procesando con CNN" → CNN no disponible
   - Si ves "✅ CNN detectó" → CNN funcionando

## 📈 Ventajas del Sistema Actual

✅ **Precisión mejorada**: CNN es más precisa que face-api.js
✅ **Análisis profundo**: Extrae características para variables derivadas
✅ **Fallback robusto**: Si CNN falla, usa face-api.js automáticamente
✅ **Trazabilidad**: Sabes qué método se usó en cada captura
✅ **UX mantenida**: Usuario sigue viendo feedback en tiempo real

## 🎓 Resumen

- **Método principal**: CNN (servidor Python)
- **Método fallback**: face-api.js (frontend)
- **Detección en tiempo real**: TinyFaceDetector (solo para UX)
- **Análisis final**: CNN (para precisión y características)

