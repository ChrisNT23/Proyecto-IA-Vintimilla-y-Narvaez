// src/components/FloatingMessage.jsx

import React from 'react';
import '../assets/styles/FloatingMessage.css';

const MedicationReminder = ({ count, onClick }) => {
  return (
    <div className="medication-reminder" onClick={onClick}>
      <p>Tienes {count} medicamento(s) para tomar hoy. Haz clic para ver detalles.</p>
    </div>
  );
};

export default MedicationReminder;
