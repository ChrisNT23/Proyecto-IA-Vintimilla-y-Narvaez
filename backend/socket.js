// backend/socket.js

import { Server } from 'socket.io';

let io;

/**
 * Inicializa Socket.io con el servidor HTTP.
 * @param {http.Server} server - El servidor HTTP de Express.
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // Ajusta según tu frontend
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  return io;
};

/**
 * Obtiene la instancia de Socket.io.
 * @returns {Server} - La instancia de Socket.io.
 * @throws {Error} - Si Socket.io no ha sido inicializado.
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io no ha sido inicializado");
  }
  return io;
};

export { initSocket, getIO };
