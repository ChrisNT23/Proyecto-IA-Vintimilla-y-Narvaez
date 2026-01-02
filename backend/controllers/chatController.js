import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import asyncHandler from "express-async-handler";

// Crear un nuevo chat o devolver uno existente
export const createChat = asyncHandler(async (req, res) => {
  const { participantId } = req.body;

  // Verificar si ya existe un chat con los mismos participantes
  let chat = await Chat.findOne({
    participants: { $all: [req.user._id, participantId] },
  }).populate("participants", "name");

  if (chat) {
    return res.status(200).json(chat); // Si el chat ya existe, devolverlo
  }

  // Si no existe, crear uno nuevo
  chat = await Chat.create({
    participants: [req.user._id, participantId],
  });

  chat = await chat.populate("participants", "name");

  res.status(201).json(chat);
});

// Obtener los chats del usuario conectado
export const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id }).populate(
    "participants",
    "name"
  );
  res.json(chats);
});

// Obtener los mensajes de un chat específico
export const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", "name")
    .populate("chat");
  res.json(messages);
});

// Enviar un mensaje dentro de un chat
export const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { chatId } = req.params;

  // Crear el mensaje
  const message = await Message.create({
    chat: chatId,
    sender: req.user._id,
    content,
  });

  // Actualizar el chat para agregar el mensaje
  await Chat.findByIdAndUpdate(chatId, {
    $push: { messages: message._id },
  });

  // Obtener el mensaje completo con las referencias de "sender" y "chat"
  const fullMessage = await Message.findById(message._id)
    .populate("sender", "name")
    .populate("chat");

  // Emitir el mensaje a los usuarios conectados al chat usando Socket.IO
  if (req.io) {
    req.io.to(chatId).emit("newMessage", fullMessage);
  }

  res.status(201).json(fullMessage);
});
