# Guía de Acceso a Fotos de Emociones

## 📁 Ubicación de las Fotos

### Sistema de Archivos
```
backend/emotion_captures/{patientId}_{timestamp}.jpg
```

Ejemplo real:
```
backend/emotion_captures/677e9e84a41e606b091adf7c_1767481812149.jpg
```

## 🌐 Acceso mediante URL

### URL Directa
```
http://localhost:5000/emotion_captures/{filename}.jpg
```

Ejemplo:
```
http://localhost:5000/emotion_captures/677e9e84a41e606b091adf7c_1767481812149.jpg
```

## 📊 Consultar Datos en la API

### 1. Obtener todas las capturas de un paciente
```bash
GET /api/emotions/patient/{patientId}
```

Ejemplo de respuesta:
```json
[
  {
    "_id": "...",
    "patient": {
      "_id": "677e9e84a41e606b091adf7c",
      "name": "Christian"
    },
    "captures": [
      {
        "emotion": "neutral",
        "confidence": 85.23,
        "timestamp": "2025-01-03T10:30:12.149Z",
        "captureType": "initial",
        "imageUrl": "/emotion_captures/677e9e84a41e606b091adf7c_1767481812149.jpg"
      }
    ],
    "testStartTime": "2025-01-03T10:30:12.149Z"
  }
]
```

### 2. Obtener estadísticas de emociones
```bash
GET /api/emotions/{emotionDataId}/stats
```

Ejemplo de respuesta:
```json
{
  "totalCaptures": 5,
  "emotionCounts": {
    "neutral": 3,
    "happy": 1,
    "sad": 1
  },
  "dominantEmotion": {
    "emotion": "neutral",
    "count": 3
  },
  "avgConfidence": 78.45,
  "emotionsByModule": {
    "Visuoespacial": [
      {
        "emotion": "neutral",
        "confidence": 82.5,
        "timestamp": "2025-01-03T10:32:00.000Z"
      }
    ],
    "Memoria": [
      {
        "emotion": "happy",
        "confidence": 65.3,
        "timestamp": "2025-01-03T10:34:00.000Z"
      }
    ]
  },
  "testDuration": 15
}
```

### 3. Obtener emociones de un test MoCA específico
```bash
GET /api/emotions/moca/{mocaTestId}
```

## 🖼️ Visualizar Fotos en el Frontend

### Ejemplo de componente React:
```jsx
import React, { useState, useEffect } from 'react';

const EmotionGallery = ({ patientId }) => {
  const [emotions, setEmotions] = useState([]);

  useEffect(() => {
    const fetchEmotions = async () => {
      const response = await fetch(`/api/emotions/patient/${patientId}`);
      const data = await response.json();
      setEmotions(data);
    };
    fetchEmotions();
  }, [patientId]);

  return (
    <div className="emotion-gallery">
      {emotions.map((emotionData) => (
        emotionData.captures.map((capture, idx) => (
          <div key={idx} className="emotion-item">
            <img 
              src={`http://localhost:5000${capture.imageUrl}`} 
              alt={`${capture.emotion} - ${capture.confidence}%`}
            />
            <p>{capture.emotion} ({capture.confidence}%)</p>
            <small>{new Date(capture.timestamp).toLocaleString()}</small>
          </div>
        ))
      ))}
    </div>
  );
};
```

## 🔐 Seguridad

- Todas las rutas requieren autenticación (middleware `protect`)
- Las fotos solo son accesibles a través del servidor Express
- Se almacenan con nombres únicos basados en patientId y timestamp

## 📝 Formato de Archivo

- **Formato**: JPEG
- **Calidad**: 80%
- **Nombre**: `{patientId}_{timestamp}.jpg`
- **Timestamp**: Milisegundos desde epoch (Unix timestamp)

## 🗂️ Limpieza de Archivos

Para limpiar fotos antiguas, puedes crear un script:

```javascript
// backend/utils/cleanOldEmotions.js
import fs from 'fs';
import path from 'path';

const EMOTIONS_DIR = path.join(__dirname, '..', 'emotion_captures');
const MAX_AGE_DAYS = 30;

const cleanOldFiles = () => {
  const now = Date.now();
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  fs.readdir(EMOTIONS_DIR, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
      const filePath = path.join(EMOTIONS_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) throw err;
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlink(filePath, err => {
            if (err) throw err;
            console.log(`Deleted old file: ${file}`);
          });
        }
      });
    });
  });
};

export default cleanOldFiles;
```

