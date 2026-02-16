# Guía de Implementación de CNNs Mejoradas

Esta guía explica cómo usar las nuevas arquitecturas CNN implementadas en el proyecto.

## 📋 Contenido

1. [Arquitecturas Disponibles](#arquitecturas-disponibles)
2. [Entrenamiento de Modelos](#entrenamiento-de-modelos)
3. [Uso en Producción](#uso-en-producción)
4. [Mejoras Implementadas](#mejoras-implementadas)

## 🏗️ Arquitecturas Disponibles

### 1. CNN Personalizada (`build_custom_cnn`)
- **Uso**: Modelo desde cero sin transfer learning
- **Ventajas**: Control total sobre la arquitectura
- **Desventajas**: Requiere más datos y tiempo de entrenamiento
- **Mejor para**: Cuando tienes datasets grandes y específicos

### 2. Transfer Learning (`build_transfer_learning_model`)
- **Modelos base disponibles**:
  - `mobilenetv2`: Ligero y rápido
  - `resnet50`: Balance entre precisión y velocidad
  - `efficientnet`: Mejor precisión
  - `vgg16`: Clásico y confiable
  - `densenet`: Muy preciso pero más lento
- **Ventajas**: Entrenamiento rápido, buena precisión con pocos datos
- **Recomendado**: Para la mayoría de casos

### 3. CNN de Emociones (`build_emotion_cnn`)
- **Especializada**: Para detección de emociones faciales
- **Base**: EfficientNetB0
- **Salida**: 7 emociones (neutral, happy, sad, angry, fearful, disgusted, surprised)

### 4. CNN con Atención (`build_attention_cnn`)
- **Característica**: Mecanismo de atención para interpretabilidad
- **Útil**: Para entender qué partes de la imagen son importantes

## 🚀 Entrenamiento de Modelos

### Evaluación de Cubos

```bash
cd backend
python train_model.py
```

**Opciones de configuración:**
- Cambiar `MODEL_TYPE` entre `'custom'` y `'transfer'`
- Ajustar `EPOCHS`, `BATCH_SIZE` según tu hardware
- Modificar `base_model_name` en el script para probar diferentes arquitecturas

**Estructura de datos esperada:**
```
data/
  train/
    Correcto/
      *.png
    Incorrecto/
      *.png
  val/
    Correcto/
    Incorrecto/
  test/
    Correcto/
    Incorrecto/
```

### Evaluación de Relojes

```bash
python train_cnn_clock_improved.py
```

**Estructura de datos esperada:**
```
data_clock/
  train/
    correct/
      *.jpg
    incorrect/
      *.jpg
    train_labels.csv
  val/
    correct/
    incorrect/
    val_labels.csv
```

**Formato CSV:**
```csv
filename,contorno,numeros,agujas
correct/reloj_01.jpg,1,1,1
incorrect/reloj_02.jpg,0,1,0
```

### Detección de Emociones

```bash
python train_cnn_emotions.py
```

**Estructura de datos esperada:**
```
data_emotions/
  train/
    neutral/
      *.jpg
    happy/
      *.jpg
    sad/
      *.jpg
    angry/
      *.jpg
    fearful/
      *.jpg
    disgusted/
      *.jpg
    surprised/
      *.jpg
  val/
    [misma estructura]
  test/
    [misma estructura]
```

## 🔧 Uso en Producción

### Servidor Mejorado

El archivo `model_server_improved.py` incluye:

1. **Carga automática de modelos**: Intenta cargar versiones mejoradas primero
2. **Preprocesamiento inteligente**: Detecta el tipo de modelo y preprocesa acorde
3. **Endpoint de salud**: `/api/health` para verificar modelos cargados
4. **Mejor manejo de errores**: Mensajes más descriptivos

**Para usar el servidor mejorado:**

```bash
# Opción 1: Reemplazar el servidor actual
mv model_server.py model_server_old.py
mv model_server_improved.py model_server.py

# Opción 2: Ejecutar ambos en paralelo (diferentes puertos)
python model_server_improved.py  # Puerto 5001
python model_server.py            # Puerto 5002
```

### Integración con Backend Node.js

El backend Node.js ya está configurado para llamar al servidor Python. Solo asegúrate de que:

1. El servidor Python esté corriendo en el puerto 5001
2. Los modelos entrenados estén en la carpeta `backend/`
3. Los nombres de archivo coincidan con los esperados

## ✨ Mejoras Implementadas

### 1. Arquitecturas Avanzadas
- ✅ CNNs personalizadas desde cero
- ✅ Transfer Learning con múltiples modelos base
- ✅ Fine-tuning configurable
- ✅ Mecanismos de atención

### 2. Data Augmentation Mejorado
- Rotación, traslación, zoom
- Ajuste de brillo y contraste
- Flip horizontal
- Shear y channel shift

### 3. Callbacks y Optimización
- Early Stopping
- Model Checkpointing
- Learning Rate Scheduling
- Reduce LR on Plateau
- CSV Logger para análisis

### 4. Preprocesamiento Inteligente
- Detección automática del tipo de modelo
- Preprocesamiento específico por arquitectura
- Normalización optimizada

### 5. Manejo de Modelos
- Carga automática de versiones mejoradas
- Fallback a modelos anteriores
- Verificación de salud de modelos
- Información detallada de arquitectura

## 📊 Comparación de Arquitecturas

| Arquitectura | Precisión | Velocidad | Tamaño | Uso Recomendado |
|-------------|-----------|-----------|--------|-----------------|
| Custom CNN | Media-Alta | Media | Medio | Datasets grandes |
| MobileNetV2 | Media | Muy Rápida | Pequeño | Producción, móviles |
| ResNet50 | Alta | Media | Medio | Balance general |
| EfficientNet | Muy Alta | Media | Medio | Máxima precisión |
| VGG16 | Alta | Lenta | Grande | Referencia |
| DenseNet | Muy Alta | Lenta | Grande | Investigación |

## 🎯 Recomendaciones

### Para Evaluación de Cubos/Relojes:
1. **Empezar con**: EfficientNet o ResNet50
2. **Si necesitas velocidad**: MobileNetV2
3. **Si tienes muchos datos**: Custom CNN

### Para Detección de Emociones:
1. **Usar**: `build_emotion_cnn` (EfficientNet base)
2. **Fine-tuning**: Descongelar últimas 40 capas
3. **Data augmentation**: Conservador (rostros son sensibles)

### Optimización:
1. **Batch size**: 16-32 según GPU
2. **Learning rate**: 0.0001 inicial, reducir en fine-tuning
3. **Épocas**: 30-50 para transfer learning, más para custom
4. **Fine-tuning**: Después de 20-30 épocas iniciales

## 🔍 Troubleshooting

### Error: "Modelo no encontrado"
- Verifica que los modelos estén en `backend/`
- Revisa los nombres de archivo (deben coincidir exactamente)

### Error: "Out of memory"
- Reduce `BATCH_SIZE`
- Usa `MobileNetV2` en lugar de modelos más grandes
- Reduce `IMG_HEIGHT` y `IMG_WIDTH` a 128x128

### Baja precisión
- Aumenta data augmentation
- Más épocas de entrenamiento
- Fine-tuning más agresivo
- Revisa calidad de datos de entrenamiento

### Entrenamiento muy lento
- Usa GPU si está disponible
- Reduce tamaño de imagen
- Usa `MobileNetV2` o modelos más ligeros
- Reduce batch size si es necesario

## 📚 Recursos Adicionales

- [TensorFlow Transfer Learning Guide](https://www.tensorflow.org/tutorials/images/transfer_learning)
- [Keras Preprocessing](https://keras.io/api/preprocessing/)
- [EfficientNet Paper](https://arxiv.org/abs/1905.11946)

## 🆘 Soporte

Para problemas o preguntas:
1. Revisa los logs de entrenamiento
2. Verifica la estructura de datos
3. Consulta los mensajes de error detallados
4. Revisa la documentación de TensorFlow/Keras

