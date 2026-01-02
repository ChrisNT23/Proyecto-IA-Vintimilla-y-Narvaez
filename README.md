# Aplicativo Web para el Seguimiento de Pacientes con Problemas Neurodegenerativos

Este repositorio contiene el código fuente del proyecto de titulación **"Aplicativo Web para el Seguimiento de Pacientes con Problemas Neurodegenerativos"**, desarrollado con el stack MERN (MongoDB, Express, React, Node.js). Este sistema está diseñado para digitalizar y optimizar el diagnóstico y tratamiento de pacientes, incluyendo funcionalidades avanzadas como la evaluación cognitiva MoCA y la asignación de actividades personalizadas.

## Funcionalidades Principales
- Manejo de perfiles de pacientes y médicos.
- Evaluación cognitiva mediante la prueba MoCA con inteligencia artificial.
- Creación, Asignación de tratamientos y actividades personalizadas.
- Recordatorios de medicamentos.
- Dashboard para monitorear el progreso.
- Registro y monitoreo de estados emocionales.
- Visualización de reportes.
- Seguridad robusta con autenticación basada en roles y cifrado de datos.

## Requisitos Previos

Asegúrate de tener instalados los siguientes programas en tu máquina:
- [Node.js](https://nodejs.org) (versión 16.x o superior).
- [MongoDB](https://www.mongodb.com) para la base de datos.
- [Git](https://git-scm.com/) para clonar el repositorio.

## Pasos para Configurar el Proyecto

### 1. Clonar el Repositorio
```bash
# Usar HTTPS
[git clone https://github.com/ThyaraV/Proyecto-capstone-Vintimilla-y-Valverde.git]
# O usar SSH
git@github.com:ThyaraV/Proyecto-capstone-Vintimilla-y-Valverde.git
```

### 2. Navegar al Directorio del Proyecto
```bash
cd \Documents\GitHub\Proyecto-capstone-Vintimilla-y-Valverde
```

### 3. Instalar las Dependencias

Ejecuta el siguiente comando en la raíz del proyecto para instalar las dependencias tanto del cliente (frontend) como del servidor (backend):
```bash
npm install
```

Si tienes directorios separados para frontend y backend, asegúrate de instalar las dependencias en cada uno:
```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 4. Configurar las Variables de Entorno
Crea un archivo `.env` en las carpetas del frontend y backend basándote en los archivos `.env.example` proporcionados. Configura las variables necesarias, como la URL de la base de datos y las claves secretas.

Ejemplo para el backend:
```
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/miBaseDeDatos
JWT_SECRET=tu_clave_secreta
```

### 5. Levantar el Proyecto

#### Backend y frontend
Asegúrate de estar en la carpeta principal y ejecuta:
```bash
npm run dev
```

### 6. Acceso a la Aplicación

Una vez que ambos servidores estén corriendo:
- Backend: Disponible en `http://localhost:5000`
- Frontend: Disponible en `http://localhost:3000`

---

