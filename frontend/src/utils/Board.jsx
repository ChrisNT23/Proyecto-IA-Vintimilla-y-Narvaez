// src/components/WordSearch/Board.jsx

import React from 'react';
import Cell from './Cell';
import styles from '../assets/styles/Board.module.css';

const Board = ({
  board,
  highlightedPositions, // array de {row, col} que ya están encontradas
  onCellMouseDown,
  onCellMouseEnter,
  onCellMouseUp,
}) => {
  return (
    <div className={styles.board}>
      {board.map((rowArr, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {rowArr.map((letter, colIndex) => {
            // Chequear si esta celda está resaltada
            const isHighlighted = highlightedPositions.some(
              (pos) => pos.row === rowIndex && pos.col === colIndex
            );

            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                letter={letter}
                row={rowIndex}
                col={colIndex}
                isHighlighted={isHighlighted}
                handleMouseDown={onCellMouseDown}
                handleMouseEnter={onCellMouseEnter}
                handleMouseUp={onCellMouseUp}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Board;
