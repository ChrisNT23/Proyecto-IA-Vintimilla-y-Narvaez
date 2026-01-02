import React, { useState, useEffect } from "react";

const TypingText = ({ text, speed = 100, resetDelay = 1000 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    let typingInterval;

    if (isTyping) {
      // Inicia el intervalo para escribir el texto
      typingInterval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText((prev) => prev + text[index]);
          index++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false); // Finaliza la animación de escritura
        }
      }, speed);
    } else {
      // Espera antes de reiniciar la animación
      const resetTimeout = setTimeout(() => {
        setDisplayedText("");
        setIsTyping(true);
      }, resetDelay);

      return () => clearTimeout(resetTimeout); // Limpia el tiempo de espera
    }

    return () => clearInterval(typingInterval);
  }, [text, speed, isTyping, resetDelay]);

  return <p className="typing-text">{displayedText}</p>;
};

export default TypingText;