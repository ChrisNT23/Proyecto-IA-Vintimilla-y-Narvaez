import { createCell } from "./createCell.js";
const couples=[
    ["B", "D"],
    ["C", "D"],
    ["g", "q"],
    ["G", "6"],
    ["L", "I"],
    ["O", "0"],
    ["V", "U"],
    ["Z", "2"],
    ["F", "E"],
    ["K", "X"],
    ["p", "q"],
    ["B", "8"],
    ["W", "M"],
    ["S", "5"],

];

export function createBoard(level = 1) {
    const board = [];
    let randomRow = 5;  // Tablero 5x5
    let randomCol = 5;
    
    // Solo usar 5 combinaciones fáciles
    const couplesLevel = [
      ["B", "D"],
      ["C", "D"],
      ["L", "I"],
      ["O", "0"],
      ["V", "U"],
    ];
  
    const randomIdx = Math.floor(Math.random() * couplesLevel.length);
    const randomCouple = couplesLevel[randomIdx];
    const randomLetter = Math.random() > 0.5 ? 1 : 0;
    const hiddenLetter = randomLetter === 1 ? 0 : 1;
  
    for (let row = 0; row < randomRow; row++) {
      const newRow = [];
      for (let col = 0; col < randomCol; col++) {
        newRow.push(createCell(row, col, randomCouple[randomLetter]));
      }
      board.push(newRow);
    }
  
    // Insertar letra oculta
    insertRandomHidden(board, randomCouple[hiddenLetter], randomRow, randomCol);
    return board;
  }
  

function insertRandomHidden(board,letter,r,c){
    const row=Math.floor(Math.random()*r);
    const col=Math.floor(Math.random()*c);
    if(board[row][col]){
        board[row][col].letter=letter;
        board[row][col].isHidden=letter;
    }
}
