// src/components/WordSearch/Cell.jsx

import React from 'react';
import styles from '../assets/styles/Cell.module.css';

const Cell = ({
  letter,
  row,
  col,
  isHighlighted, // Para marcar si la celda forma parte de una palabra encontrada
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
}) => {
  return (
    <div
      className={`${styles.cell} ${isHighlighted ? styles.highlight : ''}`}
      onMouseDown={(e) => handleMouseDown(e, row, col)}
      onMouseEnter={(e) => handleMouseEnter(e, row, col)}
      onMouseUp={(e) => handleMouseUp(e, row, col)}
    >
      {letter}
    </div>
  );
};

export default Cell;
