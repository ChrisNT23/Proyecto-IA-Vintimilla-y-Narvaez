import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import { toast } from "react-toastify";
import {
  useGetChatsQuery,
  useSendMessageMutation,
  useCreateChatMutation,
  useGetMessagesQuery,
} from "../slices/chatApiSlice";
import { useGetPatientsQuery } from "../slices/patientApiSlice";
import { useGetDoctorsQuery } from "../slices/doctorApiSlice";
import '../assets/styles/chatScreen.css'; 
import { FaComments, FaUserFriends } from 'react-icons/fa'; // Importar iconos

const ENDPOINT = process.env.REACT_APP_SOCKET_ENDPOINT || "http://localhost:5000";

const ChatScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: chats = [],
    isLoading: loadingChats,
    refetch: refetchChats,
  } = useGetChatsQuery();

  const { data: patients = [], isLoading: loadingPatients } = useGetPatientsQuery();
  const { data: doctors = [], isLoading: loadingDoctors } = useGetDoctorsQuery();

  const [sendMessage] = useSendMessageMutation();
  const [createChat] = useCreateChatMutation();

  const [selectedChat, setSelectedChat] = useState(null);
  const [activeTab, setActiveTab] = useState('chats'); // Estado para las pestañas
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [newMessageNotifications, setNewMessageNotifications] = useState({});

  const socketRef = useRef();
  const selectedChatRef = useRef(selectedChat);
  const messagesEndRef = useRef(null); // Referencia para el scroll automático

  // Actualizar la referencia de selectedChat cuando cambia
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Conectar a Socket.IO una sola vez
  useEffect(() => {
    if (userInfo) {
      socketRef.current = io(ENDPOINT);
      socketRef.current.emit("setup", userInfo);
      socketRef.current.on("connected", () => setSocketConnected(true));

      // Escuchar mensajes nuevos
      socketRef.current.on("messageReceived", (newMessageReceived) => {
        console.log("Mensaje recibido:", newMessageReceived); // Log para depuración

        const chatId = newMessageReceived.chat._id || newMessageReceived.chat;
        const senderId = newMessageReceived.sender._id || newMessageReceived.sender;

        if (senderId === userInfo._id) {
          // Ignorar mensajes enviados por el usuario actual
          return;
        }

        if (selectedChatRef.current && selectedChatRef.current._id === chatId) {
          // Si el mensaje es para el chat seleccionado, actualizar los mensajes automáticamente
          setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
        } else {
          // Si el mensaje es para otro chat, incrementar el contador de mensajes no leídos
          setNewMessageNotifications((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || 0) + 1
          }));
          toast.info("Nuevo mensaje en otro chat");
        }
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [userInfo]);

  // Obtener mensajes del chat seleccionado
  const { data: chatMessages = [], refetch: refetchMessages } = useGetMessagesQuery(
    selectedChat?._id,
    { skip: !selectedChat }
  );

  useEffect(() => {
    if (chatMessages) setMessages(chatMessages);
  }, [chatMessages]);

  // Unirse al chat seleccionado
  useEffect(() => {
    if (socketConnected && selectedChat) {
      socketRef.current.emit("joinChat", selectedChat._id);
      refetchMessages();

      // Eliminar el contador de mensajes no leídos para este chat
      setNewMessageNotifications((prev) => {
        const { [selectedChat._id]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [selectedChat, socketConnected, refetchMessages]);

  useEffect(() => {
    // Scroll automático al final de los mensajes
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("El mensaje no puede estar vacío");
      return;
    }

    if (!selectedChat || !selectedChat._id) {
      toast.error("Debes seleccionar un chat válido");
      return;
    }

    try {
      const messageData = { chatId: selectedChat._id, content: newMessage };
      const sentMessage = await sendMessage(messageData).unwrap();
      setNewMessage("");

      // Emitir el mensaje a través de Socket.IO
      socketRef.current.emit("sendMessage", sentMessage);

      // Actualizar mensajes en el chat actual
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
    } catch (error) {
      toast.error("Error al enviar el mensaje");
    }
  };

  const handleStartChat = async (participantId) => {
    if (!participantId) {
      toast.error("Debe seleccionar un participante");
      return;
    }

    try {
      const chat = await createChat({ participantId }).unwrap();
      setSelectedChat(chat);
      refetchChats();
      toast.success("Chat iniciado con éxito");
    } catch (error) {
      toast.error("Error al iniciar el chat");
    }
  };

  const renderContacts = () => {
    if (loadingPatients || loadingDoctors) {
      return <p>Cargando contactos...</p>;
    }

    if (patients.length === 0 && doctors.length === 0) {
      return <p>No hay pacientes o médicos disponibles</p>;
    }

    return (
      <div className="contacts-list">
        <h3>Pacientes</h3>
        {patients.map((patient) => (
          <div
            key={patient._id}
            onClick={() => handleStartChat(patient.user?._id)}
            className="contact-item"
          >
            {patient.user?.name || "Paciente sin nombre"}
          </div>
        ))}
        <h3>Médicos</h3>
        {doctors.map((doctor) => (
          <div
            key={doctor._id}
            onClick={() => handleStartChat(doctor.user?._id)}
            className="contact-item"
          >
            {doctor.user?.name || "Médico sin nombre"}
          </div>
        ))}
      </div>
    );
  };

  const renderChats = () => {
    if (loadingChats) {
      return <p>Cargando chats...</p>;
    }

    if (chats.length === 0) {
      return <p>No hay chats disponibles</p>;
    }

    return (
      <div className="chats-list">
        {chats.map((chat) => {
          const chatId = chat._id;
          const isSelected = selectedChat?._id === chatId;
          const newMessagesCount = newMessageNotifications[chatId] || 0;
          return (
            <div
              key={chatId}
              onClick={() => setSelectedChat(chat)}
              className={`chat-item ${
                isSelected ? "selected-chat" : newMessagesCount > 0 ? "new-message" : ""
              }`}
            >
              {chat.participants
                ?.filter((p) => p._id !== userInfo?._id)
                .map((p) => p.name)
                .join(", ") || "Sin participantes"}
              {newMessagesCount > 0 && (
                <span className="notification-badge">{newMessagesCount}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderActiveContent = () => {
    return activeTab === 'chats' ? renderChats() : renderContacts();
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <FaComments className="tab-icon" />
            Chats
          </button>
          <button
            className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <FaUserFriends className="tab-icon" />
            Contactos
          </button>
        </div>
        <div className="tab-content">
          {renderActiveContent()}
        </div>
      </div>

      <div className="chat-box">
        {selectedChat ? (
          <>
            <h2 className="chat-header">
              Chat con{" "}
              {selectedChat.participants
                ?.filter((p) => p._id !== userInfo?._id)
                .map((p) => p.name)
                .join(", ") || "Sin participantes"}
            </h2>
            <div className="messages">
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isSentByUser = msg.sender?._id === userInfo?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`message ${
                        isSentByUser ? "sent-message" : "received-message"
                      }`}
                    >
                      {msg.content}
                    </div>
                  );
                })
              ) : (
                <p>No hay mensajes aún</p>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="message-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <button onClick={handleSendMessage} className="send-button">
                &#10148;
              </button>
            </div>
          </>
        ) : (
          <p>Selecciona un chat para comenzar</p>
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
