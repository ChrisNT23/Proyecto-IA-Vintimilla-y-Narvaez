# Aplicación de inteligencia artificial multimodal para apoyo a la evaluación cognitiva inicial mediante análisis cognitivo y emocional

Este proyecto es una plataforma integral diseñada para digitalizar y optimizar el diagnóstico, seguimiento y tratamiento de pacientes con trastornos neurodegenerativos. Combina el poder del stack **MERN** (MongoDB, Express, React, Node.js) con modelos avanzados de **Inteligencia Artificial** para la evaluación cognitiva.

## 🚀 Descripción del Proyecto

El sistema permite a médicos y cuidadores gestionar de manera eficiente la salud de los pacientes a través de:
- **Gestión de Perfiles**: Registro detallado de historial médico y evolución.
- **Evaluación MoCA Asistida por IA**: Uso de Redes Neuronales Convolucionales (CNN) basadas en **MobileNetV2** para calificar automáticamente dibujos de la prueba MoCA (Cubo, Reloj).
- **Monitoreo Emocional**: Seguimiento de estados de ánimo y bienestar.
- **Dashboards y Reportes**: Visualización de datos y reportes automáticos en PDF.

---

## 🛠️ Dependencias y Versiones

El proyecto requiere sistemas operativos compatibles (Windows/Linux/macOS) y las siguientes herramientas principales:

### Entorno de Ejecución
- **Node.js**: `v18.x` o superior.
- **npm**: `v9.x` o superior.
- **Python**: `3.10.x` o superior (Recomendado 3.10.11).
- **MongoDB**: `v6.x` o superior (Local o Atlas).

### Librerías de Inteligencia Artificial (Python)
- **TensorFlow**: `>= 2.10.0`
- **Flask**: Para el microservicio del modelo.
- **Numpy, Pandas, Scikit-learn**: Procesamiento de datos.
- **Pillow**: Procesamiento de imágenes.

### Frameworks de Desarrollo
- **Frontend**: React 18, Redux Toolkit, Tailwind CSS.
- **Backend**: Express, Mongoose, Socket.io (para comunicación en tiempo real).

---

## 💻 Instrucciones de Ejecución

Sigue estos pasos para configurar el entorno de desarrollo:

### 1. Clonar el repositorio
```bash
git clone https://github.com/ChrisNT23/Proyecto-IA-Vintimilla-y-Narvaez.git
cd Proyecto-IA-Vintimilla-y-Narvaez
```

### 2. Configurar el Backend de Inteligencia Artificial (Python)
Se recomienda el uso de un entorno virtual:
```bash
cd backend
# Crear entorno virtual
python -m venv venv
# Activar entorno (Windows)
.\venv\Scripts\activate
# Instalar requerimientos
pip install -r requirements.txt
cd ..
```

### 3. Instalar Dependencias de Node.js
Ejecuta esto en la raíz para instalar dependencias del core, frontend y backend:
```bash
npm install
cd frontend && npm install
cd ..
```

### 4. Variables de Entorno
Crea un archivo `.env` en la raíz (o en `backend/`) con el siguiente formato:
```env
MONGO_URI=mongodb://tu_conexion_de_mongo
JWT_SECRET=tu_clave_secreta
PORT=5000
```

### 5. Iniciar la Aplicación
El proyecto usa `concurrently` para lanzar todos los servicios con un solo comando:
```bash
npm run dev
```

Esto iniciará simultáneamente:
- **Backend (Node.js)**: `http://localhost:5000`
- **Frontend (React)**: `http://localhost:3000`
- **Model Server (Python/IA)**: Ejecutándose en segundo plano para procesar predicciones.

---

## 🏗️ Arquitectura de IA (Backend Python)
El archivo `train_model.py` implementa el ajuste fino (*fine-tuning*) de **MobileNetV2**. El entrenamiento se divide en:
1. **Fase de Calentamiento**: Entrenamiento de la nueva cabeza de clasificación.
2. **Fase de Fine-Tuning**: Descongelamiento de las últimas capas del modelo base para mayor precisión.

Los modelos resultantes (`.h5`) son servidos a través de `model_server.py` mediante una API Flask.

---
**Desarrollado por:** ChrisNT23 - Vintimilla y Narvaez.
