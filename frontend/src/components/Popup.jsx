// src/components/Popup.jsx

import React, { useState } from 'react';
import '../assets/styles/Popup.css';

function Popup({ moods, setSelectedMood }) {
  console.log('Popup renderizado'); // Log para depuración
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleSelectMood = (index) => {
    setSelectedIndex(index);
    setSelectedMood(moods[index]);
  };

  return (
    <div className="popup">
      <div className="popup-content">
      <h1 style={{ color: "black" }}>¿Cómo se siente hoy?</h1>
        <div className="mood-meter">
          {/* Flecha del velocímetro */}
          <div className="arrow"
            style={{
              transform: `rotate(${Math.max(
                -90,
                Math.min(selectedIndex * (180 / (moods.length - 1)) - 90, 90)
              )}deg)`,
            }}
          >
            <div className="cube">
            </div>
          </div>

          {/* Contenedor para los emojis con coordenadas personalizadas */}
          <div className="emojis-container">
            {moods.map((mood, index) => {
              const totalAngle = Math.PI; // 180 grados en radianes
              const stepAngle = totalAngle / (moods.length - 1); // Ajuste para que cubra completamente el arco
              const angle = stepAngle * index - Math.PI; // Ajusta para que empiece desde el color rojo
              const radius = 110;
              const x = radius * Math.cos(angle) + 150;
              const y = radius * Math.sin(angle) + 130;

              return (
                <div
                  key={index}
                  className="mood-wrapper"
                  style={{ left: `${x}px`, top: `${y}px` }}
                >
                  <button
                    className="mood-button"
                    onMouseEnter={() => setSelectedIndex(index)} // Actualiza el índice al pasar el mouse
                    onClick={() => handleSelectMood(index)}
                    style={{ color: mood.color }}
                  >
                    {mood.emoji}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

  );
}

export default Popup;
