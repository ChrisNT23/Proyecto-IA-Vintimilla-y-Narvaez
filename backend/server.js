import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import activitiesRoutes from "./routes/activitiesRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import treatmentRoutes from "./routes/treatmentRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import mocaSelfRoutes from "./routes/mocaSelfRoutes.js";
import axios from "axios"; // Importar axios para realizar solicitudes HTTP

import connectDB from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

connectDB(); // Conectar a la base de datos MongoDB

const app = express();

// Middleware para procesar JSON y formularios
app.use(express.json({ limit: '10mb' })); // Aumentar el límite si las imágenes son grandes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para manejar cookies
app.use(cookieParser());

// Definir las rutas
app.use("/api/users", userRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/mocaSelf", mocaSelfRoutes);

// Montar las rutas de tratamientos y asignaciones en sus respectivas rutas
app.use('/api/treatments', treatmentRoutes);
app.use('/api/assignments', assignmentRoutes); // Montar el nuevo router de asignaciones

// NUEVA RUTA para evaluar el cubo con IA
app.post('/api/evaluate-cube', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No se proporcionó la imagen.' });
    }

    // Enviar la imagen al servidor Flask
    const flaskResponse = await axios.post('http://localhost:5001/api/evaluate-cube', { image }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // Tiempo de espera de 10 segundos
    });

    // Verificar la respuesta del servidor Flask
    if (flaskResponse.data && typeof flaskResponse.data.score === 'number') {
      return res.json({ score: flaskResponse.data.score });
    } else {
      return res.status(500).json({ error: 'Respuesta inesperada del servidor de IA.' });
    }

  } catch (error) {
    console.error('Error al evaluar el cubo:', error.message);

    // Manejar errores específicos de axios
    if (error.response) {
      // El servidor respondió con un estado fuera del rango 2xx
      return res.status(error.response.status).json({ error: error.response.data.error || 'Error en el servidor de IA.' });
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      return res.status(500).json({ error: 'No se recibió respuesta del servidor de IA.' });
    } else {
      // Algo ocurrió al configurar la solicitud
      return res.status(500).json({ error: 'Error al configurar la solicitud de evaluación.' });
    }
  }
});

// Configurar ruta para archivos estáticos (subidas)
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// Ruta de inicio de la API
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Middlewares para manejar errores
app.use(notFound);
app.use(errorHandler);

// Crear el servidor HTTP y configurar Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Cambia el origen según sea necesario
    methods: ["GET", "POST"],
  },
});

// Configurar eventos de Socket.IO
io.on("connection", (socket) => {
  console.log("Nueva conexión de socket establecida");

  // Unirse al espacio personal del usuario
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
    console.log(`Usuario ${userData.name} conectado con ID: ${userData._id}`);
  });

  // Unirse a un chat específico
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`Usuario se ha unido al chat: ${chatId}`);
  });

  // Manejar el envío de mensajes
  socket.on("sendMessage", (message) => {
    console.log("Mensaje enviado:", message); // Log para depuración

    const chatId = message.chat._id || message.chat;

    // Emitir el mensaje a todos los usuarios en el chat excepto al remitente
    socket.to(chatId).emit("messageReceived", message);
  });

  // Desconexión del socket
  socket.on("disconnect", () => {
    console.log("Usuario desconectado del socket");
  });
});

// Nota: Eliminado initSocket(httpServer), ya que Socket.IO se configura directamente arriba

// Iniciar el servidor en el puerto especificado
httpServer.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
