import express from 'express';
import axios from 'axios';

const router = express.Router();

// Esta ruta recibe la imagen desde el frontend
// y la reenvía al servidor Flask en http://localhost:5001/api/evaluate-cube
router.post('/', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No se proporcionó la imagen' });
    }

    // Llamar a la API del Flask server
    const response = await axios.post('http://localhost:5001/api/evaluate-cube', { image }, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Responder al frontend con el resultado obtenido del servidor Flask
    res.json(response.data);
  } catch (error) {
    console.error('Error al evaluar el cubo:', error.message);
    res.status(500).json({ error: 'Error en la evaluación del cubo' });
  }
});

export default router;
