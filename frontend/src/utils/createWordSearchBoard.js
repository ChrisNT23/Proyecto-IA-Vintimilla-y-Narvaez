// src/utils/createWordSearchBoard.js

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Palabras en español de la vida cotidiana
const SPANISH_WORDS = [
  'CASA', 'GATO', 'MESA', 'SILLA', 'PERRO',
  'NIÑO', 'COCHE', 'CALLE', 'ROPA', 'COMIDA',
  'AGUA', 'LIBRO', 'PAN', 'BOLSA', 'FLOR',
  'ARBOL', 'CARTA', 'CAMA', 'LAPIZ', 'PLATO',
  'CABELLO', 'LIBRO', 'GLOBO', 'HOJA', 'PAPEL',
  'FUNDA', 'BOLSA', 'ARROZ', 'ACEITE', 'LENTES',
  'TELA', 'OJO', 'CABEZA', 'CAFE', 'JUGO',
  'CARNE', 'POLLO', 'LEON', 'FRIO', 'CALOR',
  'JIRAFA', 'PEZ', 'CAMARON', 'CANGUIL', 'CUADRO',
  'OSO', 'GALLETA', 'COCTEL', 'GIRASOL', 'ROSAS',
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Coloca la palabra en el tablero en horizontal o vertical, de izquierda a derecha o de arriba hacia abajo.
 */
function placeWord(board, word) {
    const N = board.length;
    const wordLength = word.length;
    let placed = false;
  
    // Intentar colocar la palabra hasta que se logre
    while (!placed) {
      // 0 => horizontal, 1 => vertical
      const orientation = getRandomInt(0, 2);
      let startRow, startCol;
  
      if (orientation === 0) {
        // Horizontal
        startRow = getRandomInt(0, N);
        startCol = getRandomInt(0, N - wordLength);
  
        // Verificar si la palabra puede colocarse (permitiendo superposición correcta)
        let canPlace = true;
        for (let i = 0; i < wordLength; i++) {
          const charInCell = board[startRow][startCol + i];
          if (charInCell !== '' && charInCell !== word[i]) {
            canPlace = false;
            break;
          }
        }
  
        // Colocar si es posible
        if (canPlace) {
          for (let i = 0; i < wordLength; i++) {
            board[startRow][startCol + i] = word[i];
          }
          placed = true;
        }
      } else {
        // Vertical
        startRow = getRandomInt(0, N - wordLength);
        startCol = getRandomInt(0, N);
  
        // Verificar si la palabra puede colocarse (permitiendo superposición correcta)
        let canPlace = true;
        for (let i = 0; i < wordLength; i++) {
          const charInCell = board[startRow + i][startCol];
          if (charInCell !== '' && charInCell !== word[i]) {
            canPlace = false;
            break;
          }
        }
  
        // Colocar si es posible
        if (canPlace) {
          for (let i = 0; i < wordLength; i++) {
            board[startRow + i][startCol] = word[i];
          }
          placed = true;
        }
      }
    }
  }
  
  
  export function createWordSearchBoard(N = 12) {
    const board = Array.from({ length: N }, () => Array.from({ length: N }, () => ''));
  
    // Seleccionar 10 palabras aleatorias
    const shuffled = [...SPANISH_WORDS].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, 10);
  
    // Insertar todas las palabras en el tablero
    selectedWords.forEach((word) => {
      placeWord(board, word);
    });
  
    // Rellenar las celdas vacías con letras aleatorias
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (board[row][col] === '') {
          board[row][col] = ALPHABET[getRandomInt(0, ALPHABET.length)];
        }
      }
    }
  
    return { board, selectedWords };
  }
  
  
