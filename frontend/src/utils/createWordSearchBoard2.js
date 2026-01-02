const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Lista de palabras para el nivel 3
const SPANISH_WORDS = [
  'CONSTRUCCION', 'DESARROLLO', 'IMPLEMENTACION', 'ORGANIZACION', 'PROGRAMACION',
  'INTERACCION', 'CALIFICACION', 'COMUNICACION', 'ADMINISTRACION', 'INFORMACION',
  'PLANIFICACION', 'ESTRATEGIAS', 'PARTICIPACION', 'AUTENTIFICACION', 'AUTORIZACION',
  'SUSCRIPCIONES', 'RECOMENDACIONES', 'CONFIGURACIONES', 'ESTADISTICAS', 'DOCUMENTACION',
  'PROCEDIMIENTOS', 'ALMACENAMIENTO', 'INTELIGENCIA', 'DISPONIBILIDAD', 'ACTUALIZACION',
  'AUTOMATIZACION', 'OPTIMIZACION', 'FUNDAMENTACION', 'CONTRIBUCIONES', 'DESCRIPCIONES',
  'PERSONALIZACION', 'VISUALIZACIONES', 'FLEXIBILIDAD', 'ESTANDARIZACION', 'TRANSPARENCIA',
  'REPRESENTACION', 'COLABORACIONES', 'EVALUACIONES', 'VERIFICACIONES', 'CONFIRMACIONES',
  'CARACTERISTICAS', 'IMPLEMENTACIONES', 'EXPERIMENTACION', 'RECONOCIMIENTOS', 'TRADUCCIONES',
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

export function createWordSearchBoardLevel3(N = 20) {
  const board = Array.from({ length: N }, () => Array.from({ length: N }, () => ''));

  // Seleccionar 15 palabras aleatorias
  const shuffled = [...SPANISH_WORDS].sort(() => 0.5 - Math.random());
  const selectedWords = shuffled.slice(0, 15);

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
