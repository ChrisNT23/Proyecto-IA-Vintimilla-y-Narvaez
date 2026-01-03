# Instrucciones para ejecutar el proyecto

## Requisitos previos

### Node.js y npm
- Node.js instalado (versión 14 o superior)
- npm instalado

### Python
- Python 3.7 o superior instalado
- pip instalado

## Instalación

### 1. Dependencias de Node.js
```bash
npm install
```

### 2. Dependencias de Python
Instalar las dependencias necesarias para el servidor de evaluación de modelos:
```bash
pip install -r backend/requirements.txt
```

O si usas pip3:
```bash
pip3 install -r backend/requirements.txt
```

## Ejecución del proyecto

Para iniciar el proyecto completo (frontend React + backend Node.js + servidor Python), ejecuta:

```bash
npm run dev
```

Este comando iniciará simultáneamente:
- **Backend Node.js** en el puerto 5000 (servidor principal)
- **Frontend React** en el puerto 3000
- **Servidor Python** en el puerto 5001 (evaluación de dibujos MoCA)

## Scripts disponibles

- `npm start` - Inicia solo el backend Node.js en modo producción
- `npm run server` - Inicia el backend Node.js con nodemon (desarrollo)
- `npm run client` - Inicia solo el frontend React
- `npm run python` - Inicia solo el servidor Python
- `npm run dev` - Inicia todo el sistema completo
- `npm run data:import` - Importa datos de prueba
- `npm run data:destroy` - Elimina datos de prueba

## Verificación

Una vez iniciado, verifica que:
1. Frontend esté disponible en: http://localhost:3000
2. Backend Node.js esté disponible en: http://localhost:5000
3. Servidor Python esté disponible en: http://localhost:5001

## Troubleshooting

### Error: Python no encontrado
En Windows, asegúrate de que Python esté agregado al PATH del sistema.

### Error: Puerto en uso
Si algún puerto está ocupado, cierra la aplicación que lo esté usando o cambia el puerto en la configuración correspondiente.

### Error: Modelos de ML no encontrados
Asegúrate de que los archivos `model_cube.h5` y `model_clock.h5` estén en el directorio raíz del proyecto o ajusta las rutas en `backend/model_server.py`.

