import axios from 'axios';

/**
 * Controlador para la integración e interpretación multimodal.
 * Actúa como un puente entre el backend Node.js y el servidor de modelos Flask.
 */
export const analyzeMultimodal = async (req, res) => {
  try {
    const payload = req.body;
    const mode = req.query.mode || 'rules'; // 'rules' (Camino A) o 'predictive' (Camino B)

    if (!payload) {
      return res.status(400).json({ error: 'No se proporcionan datos para el análisis.' });
    }

    console.log(`[NodeJS] Solicitando análisis multimodal. Modo: ${mode}`);

    // Llamada al servidor Flask (model_server.py)
    const response = await axios.post(`http://localhost:5001/api/multimodal-integration?mode=${mode}`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout para procesos pesados
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Error en multimodalController:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'El servidor de modelos (Flask) no está disponible.',
        details: 'Asegúrate de que model_server.py esté ejecutándose en el puerto 5001.'
      });
    }

    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response ? error.response.data.error : 'Error interno en el módulo multimodal.';

    return res.status(statusCode).json({ error: errorMessage });
  }
};
