// =============================================================================
// Name: Pip2048
// License: CC-BY-NC-4.0
// Repository: https://github.com/CodyTolene/pip-apps
// Description: Classic 2048 game for the Pip-Boy 3000 Mk V.
// Version: 1.0.0
// =============================================================================

var board = [];
var screenWidth = 400;
var screenHeight = 320;
var tileSize = 75;
var tilePadding = 5;
var offsetX = Math.floor((screenWidth - tileSize * 4) / 2);
var offsetY = Math.floor((screenHeight - tileSize * 4) / 2);
var tileColors = {
  0: '#888',
  2: '#EEE',
  4: '#EDD',
  8: '#F48',
  16: '#F96',
  32: '#F75',
  64: '#F53',
  128: '#ED7',
  256: '#EC6',
  512: '#EB5',
  1024: '#EA4',
  2048: '#E93',
  4096: '#332',
  8192: '#221',
};

function initGame() {
  board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  addRandomTile();
  addRandomTile();
  g.clear();
  drawBoard();
}

function addRandomTile() {
  var empty = [];
  for (var y = 0; y < 4; y++) {
    for (var x = 0; x < 4; x++) {
      if (board[y][x] === 0) empty.push({ x: x, y: y });
    }
  }
  if (empty.length === 0) return;
  var r = empty[Math.floor(Math.random() * empty.length)];
  board[r.y][r.x] = Math.random() < 0.9 ? 2 : 4;
}

function drawBoard() {
  for (var y = 0; y < 4; y++) {
    for (var x = 0; x < 4; x++) {
      var val = board[y][x];
      var color = tileColors[val] || '#888';
      var tx = x * tileSize + offsetX + tilePadding;
      var ty = y * tileSize + offsetY + tilePadding;

      g.setColor(color);
      g.fillRect(
        tx,
        ty,
        tx + tileSize - tilePadding * 2,
        ty + tileSize - tilePadding * 2,
      );

      if (val !== 0) {
        g.setColor(0, 0, 0);
        var fontSize = val >= 1024 ? 26 : val >= 128 ? 30 : 36;
        g.setFontVector(fontSize);
        var str = val.toString();
        var strWidth = str.length * fontSize * 0.5;
        g.drawString(
          str,
          tx + tileSize / 2 - tilePadding / 2,
          ty + tileSize / 2 - tilePadding / 2,
        );
      }
    }
  }
  if (isGameOver()) {
    g.setColor('#CCC');
    g.fillRect(
      screenWidth / 2 - 100,
      screenHeight / 2 - 20,
      screenWidth / 2 + 100,
      screenHeight / 2 + 20,
    );
    g.setColor(255, 0, 0);
    g.setFontVector(28);
    g.drawString('GAME OVER', screenWidth / 2, screenHeight / 2);
  }
}

function moveLeft(add) {
  var moved = false;
  for (var y = 0; y < 4; y++) {
    var row = board[y].filter((n) => n);
    for (var i = 0; i < row.length - 1; i++) {
      if (row[i] === row[i + 1]) {
        row[i] *= 2;
        row[i + 1] = 0;
        moved = true;
      }
    }
    row = row.filter((n) => n);
    while (row.length < 4) row.push(0);
    if (board[y].join() !== row.join()) moved = true;
    board[y] = row;
  }
  if (moved && add) {
    addRandomTile();
    drawBoard();
  }
  return moved;
}

function moveRight() {
  reverseBoardRows();
  var moved = moveLeft();
  reverseBoardRows();
  if (moved) {
    addRandomTile();
    drawBoard();
  }
}

function moveUp() {
  transposeBoard();
  var moved = moveLeft();
  transposeBoard();
  if (moved) {
    addRandomTile();
    drawBoard();
  }
}

function moveDown() {
  transposeBoard();
  reverseBoardRows();
  var moved = moveLeft();
  reverseBoardRows();
  transposeBoard();
  if (moved) {
    addRandomTile();
    drawBoard();
  }
}

function transposeBoard() {
  var newBoard = [];
  for (var y = 0; y < 4; y++) {
    newBoard[y] = [];
    for (var x = 0; x < 4; x++) {
      newBoard[y][x] = board[x][y];
    }
  }
  board = newBoard;
}

function reverseBoardRows() {
  for (var y = 0; y < 4; y++) {
    board[y].reverse();
  }
}

function isGameOver() {
  for (var y = 0; y < 4; y++) {
    for (var x = 0; x < 4; x++) {
      if (board[y][x] === 0) return false;
      if (x < 3 && board[y][x] === board[y][x + 1]) return false;
      if (y < 3 && board[y][x] === board[y + 1][x]) return false;
    }
  }
  return true;
}

Pip.removeAllListeners('knob1');
Pip.on('knob1', function (dir) {
  Pip.knob1Click(dir);
  if (dir < 0) moveDown();
  else if (dir > 0) moveUp();
  else initGame();
});

Pip.removeAllListeners('knob2');
Pip.on('knob2', function (dir) {
  Pip.knob2Click(dir);
  if (dir < 0) moveLeft(1);
  else if (dir > 0) moveRight();
});

Pip.removeAllListeners('torch');
Pip.on('torch', function () {
  console.log('Game stopping');
  g.clear();
  E.reboot();
});

initGame();
