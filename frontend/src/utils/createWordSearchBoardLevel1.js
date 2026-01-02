const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Lista de palabras para el nivel 1
const SPANISH_WORDS = [
  'LUNA', 'FUEGO', 'TIERRA', 'AGUA', 'NIEVE',
  'VIDA', 'ROSA', 'VIENTO', 'MONTE', 'LLAMA',
  'PIEDRA', 'RAYO', 'NUBES', 'ARENA', 'TRUENO',
  'HOJAS', 'RUMBO', 'PESCA', 'CLAVE', 'VIAJE',
  'FUENTE', 'PLAZA', 'MANGO', 'CORAL', 'GRANO',
  'VISTA', 'RUMOR', 'RAMAS', 'VELAS', 'AVION',
  'BAILE', 'BOSQUE', 'FAMILIA', 'HORIZONTE', 'SUAVE',
  'RUTA', 'CASTILLO', 'SELVA', 'FARO', 'NIEVE',
  'CIERVO', 'HIELO', 'BRISA', 'CAMPO', 'ESPADA',
  'FELIZ', 'SONAR', 'SUEÑO', 'REINA', 'TORRE',
  'BOTAS', 'PLUMA', 'SUELO', 'BARCO', 'CALOR',
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function placeWord(board, word) {
  const N = board.length;
  const wordLength = word.length;
  let placed = false;

  while (!placed) {
    const orientation = getRandomInt(0, 2); // 0 = horizontal, 1 = vertical
    let startRow, startCol;

    if (orientation === 0) {
      // Horizontal
      startRow = getRandomInt(0, N);
      startCol = getRandomInt(0, N - wordLength);

      let canPlace = true;
      for (let i = 0; i < wordLength; i++) {
        const charInCell = board[startRow][startCol + i];
        if (charInCell !== '' && charInCell !== word[i]) {
          canPlace = false;
          break;
        }
      }

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

      let canPlace = true;
      for (let i = 0; i < wordLength; i++) {
        const charInCell = board[startRow + i][startCol];
        if (charInCell !== '' && charInCell !== word[i]) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        for (let i = 0; i < wordLength; i++) {
          board[startRow + i][startCol] = word[i];
        }
        placed = true;
      }
    }
  }
}

export function createWordSearchBoardLevel1(N = 10) {
  const board = Array.from({ length: N }, () => Array.from({ length: N }, () => ''));

  // Seleccionar 5 palabras aleatorias
  const shuffled = [...SPANISH_WORDS].sort(() => 0.5 - Math.random());
  const selectedWords = shuffled.slice(0, 5);

  // Insertar las palabras en el tablero
  selectedWords.forEach((word) => {
    placeWord(board, word);
  });

  // Rellenar celdas vacías con letras aleatorias
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      if (board[row][col] === '') {
        board[row][col] = ALPHABET[getRandomInt(0, ALPHABET.length)];
      }
    }
  }

  return { board, selectedWords };
}
