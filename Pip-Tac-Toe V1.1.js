//PIP-TAC-TOE 
//First espruino project I've made for the Wand Company Pip-Boy Mk.V, hope you enjoy! 
//github.com/Pip-4111
let currentPlayer = "X";
let board = [["", "", ""], ["", "", ""], ["", "", ""]];
let cursorX = 0, cursorY = 0;
let gameOver = false;
let inMenu = true;
let menuOptions = ["2 PLAYER", "VS CPU"];
let menuSelection = 0;
let vsCPU = false;


var screenWidth = bC.getWidth();
var screenHeight = bC.getHeight();

const spacing = 10, cellWidth = 50, cellHeight = 50;
const boardWidth = 3 * cellWidth + 2 * spacing;
const boardHeight = 3 * cellHeight + 2 * spacing;
const offsetX = ((screenWidth - boardWidth) / 2) + 10;
const offsetY = ((screenHeight - boardHeight) / 2) - 16;

function drawBoard() {
  bC.clear();
  bC.setFont("6x8", 2.5);
  bC.setColor(10);

  const thickness = 3;
  for (let i = 1; i < 3; i++) {
    let x = offsetX + i * (cellWidth + spacing) - spacing / 2;
    let y = offsetY + i * (cellHeight + spacing) - spacing / 2;
    for (let dx = -Math.floor(thickness / 2); dx <= Math.floor(thickness / 2); dx++) {
      bC.drawLine(
        x + dx,
        offsetY,
        x + dx,
        offsetY + boardHeight
      );
    }

    for (let dy = -Math.floor(thickness / 2); dy <= Math.floor(thickness / 2); dy++) {
      bC.drawLine(
        offsetX,
        y + dy,
        offsetX + boardWidth,
        y + dy
      );
    }
  }

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      let val = board[y][x] || " ";
      let drawX = offsetX + x * (cellWidth + spacing) + cellWidth / 2 - 8;
      let drawY = offsetY + y * (cellHeight + spacing) + cellHeight / 2 - 8;
      bC.drawString(val, drawX, drawY);
    }
  }

  let boxX1 = offsetX + cursorX * (cellWidth + spacing) - 2;
  let boxY1 = offsetY + cursorY * (cellHeight + spacing) - 2;
  let boxX2 = boxX1 + cellWidth + 4;
  let boxY2 = boxY1 + cellHeight + 4;
  bC.drawRect(boxX1, boxY1, boxX2, boxY2);

  if (!gameOver) {
    let turnMsg = `Player ${currentPlayer}'s turn.`;
    let msgY = screenHeight - 16;
    bC.drawString(turnMsg, (screenWidth - bC.stringWidth(turnMsg)) / 2, msgY);
  }

  bC.flip();
}

function checkWin() {
  const lines = [
    board[0], board[1], board[2],
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]]
  ];
  for (let line of lines) {
    if (line.every(cell => cell === "X")) return "X";
    if (line.every(cell => cell === "O")) return "O";
  }
  for (let row of board) {
    if (row.includes("")) return null;
  }
  return "Draw";
}

function checkWinner(b) {
  const lines = [
    b[0], b[1], b[2],
    [b[0][0], b[1][0], b[2][0]],
    [b[0][1], b[1][1], b[2][1]],
    [b[0][2], b[1][2], b[2][2]],
    [b[0][0], b[1][1], b[2][2]],
    [b[0][2], b[1][1], b[2][0]]
  ];
  for (let line of lines) {
    if (line.every(cell => cell === "X")) return "X";
    if (line.every(cell => cell === "O")) return "O";
  }
  for (let row of b) {
    if (row.includes("")) return null;
  }
  return "Draw";
}

function checkWin() {
  const lines = [
    board[0], board[1], board[2],
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]]
  ];
  for (let line of lines) {
    if (line.every(cell => cell === "X")) return "X";
    if (line.every(cell => cell === "O")) return "O";
  }
  for (let row of board) {
    if (row.includes("")) return null;
  }
  return "Draw";
}
function minimax(b, depth, isMaximizing) {
  let result = checkWinner(b);
  if (result !== null) {
    if (result === "O") return 10 - depth;
    else if (result === "X") return depth - 10;
    return 0;
  }

  if (depth >= 2) return 0;

  let bestScore = isMaximizing ? -Infinity : Infinity;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (b[i][j] === "") {
        b[i][j] = isMaximizing ? "O" : "X";
        let score = minimax(b, depth + 1, !isMaximizing);
        b[i][j] = "";
        bestScore = isMaximizing ? Math.max(score, bestScore) : Math.min(score, bestScore);
      }
    }
  }

  return bestScore;
}

function getBestMove() {
  let bestScore = -Infinity;
  let bestMove = null;

  let availableMoves = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      if (board[y][x] === "") {
        availableMoves.push({ x, y });
      }
    }
  }

  if (availableMoves.length === 0) return null;

  for (let move of availableMoves) {
    board[move.y][move.x] = "O";
    let score = minimax(board, 0, false);
    board[move.y][move.x] = "";

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function showGameOverMessage(result) {
  let msg = (result === "Draw") ? "It's a draw!" : `Player ${result} wins!`;
  bC.clear();
  bC.setFont("6x8", 2.5);
  bC.setColor(10);
  bC.drawString(msg, (screenWidth - bC.stringWidth(msg)) / 2, screenHeight / 2);
  bC.flip();

  setTimeout(() => {
    showMainMenu();
  }, 2000);
}

function placeMark() {
  if (gameOver || board[cursorY][cursorX] !== "") return;

  board[cursorY][cursorX] = currentPlayer;
  drawBoard();

  let result = checkWin();
  if (result) {
    gameOver = true;
    showGameOverMessage(result);
    return;
  }

  currentPlayer = (currentPlayer === "X") ? "O" : "X";

  if (!gameOver && vsCPU && currentPlayer === "O") {
    cpuMove();
  }
}

function cpuMove() {
  if (gameOver || !vsCPU) return;

  let move;
  
  if (board[1][1] === "") {
    move = { x: 1, y: 1 };
  } else {
    move = getBestMove();
  }

  if (!move) return;

  setTimeout(() => {
    board[move.y][move.x] = "O";
    drawBoard();

    let result = checkWin();
    if (result) {
      gameOver = true;
      showGameOverMessage(result);
      return;
    }

    currentPlayer = "X"; 
    drawBoard();
  }, 30);
}

function resetGame() {
  currentPlayer = "X";
  board = [["", "", ""], ["", "", ""], ["", "", ""]];
  cursorX = 0;
  cursorY = 0;
  gameOver = false;
  bindGameControls();
  drawBoard();
}

function bindGameControls() {
  Pip.removeAllListeners("knob1");
  Pip.on("knob1", val => {
    if (val === 0) placeMark();
    else {
      cursorY = (val > 0) ? (cursorY + 2) % 3 : (cursorY + 1) % 3;
      drawBoard();
    }
  });

  Pip.removeAllListeners("knob2");
  Pip.on("knob2", val => {
    cursorX = (val > 0) ? (cursorX + 1) % 3 : (cursorX + 2) % 3;
    drawBoard();
  });

  Pip.removeAllListeners("torch");
  Pip.on("torch", exitGame);
}

function exitGame() {
  gameOver = true;
  inMenu = true;
  Pip.removeAllListeners();
  showMainMenu();
}

function showMainMenu() {
  inMenu = true;
  function drawMenu() {
    bC.clear();
    bC.setFont("6x8", 2.5);
    bC.setColor(10);
    let title = "PIP-TAC-TOE";
    bC.drawString(title, (screenWidth - bC.stringWidth(title)) / 2, 20);
    for (let i = 0; i < menuOptions.length; i++) {
      let y = 60 + i * 30;
      let opt = menuOptions[i];
      if (i === menuSelection) bC.drawRect(50, y - 4, 50 + bC.stringWidth(opt) + 8, y + 20);
      bC.drawString(opt, 54, y);
    }
    bC.flip();
  }
  drawMenu();

  Pip.removeAllListeners();
  Pip.on("knob1", val => {
    if (val === 0) {
      inMenu = false;
      vsCPU = menuSelection === 1;
      resetGame();
    } else if (val > 0) {
      menuSelection = (menuSelection + 1) % menuOptions.length;
      drawMenu();
    } else if (val < 0) {
      menuSelection = (menuSelection + menuOptions.length - 1) % menuOptions.length;
      drawMenu();
    }
  });

  Pip.on("torch", () => {
    bC.clear();
    E.reboot();
  });
}

setTimeout(showMainMenu, 100);