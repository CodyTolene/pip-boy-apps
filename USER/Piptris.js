// =============================================================================
//  Name: Piptris
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A simple Tetris inspired game for the Pip-Boy 3000 Mk V.
// =============================================================================

const GAME_NAME = 'Piptris';
const GAME_VERSION = '1.0.1';

let fieldWidth = 16;
let fieldHeight = 20;
let blockSize = 10;
let fieldX = 120;
let fieldY = 0;
let dropInterval = 600;

let score = 0;
let nextPiece = null;
let gameOverFlag = false;

function resetPlayfield() {
  for (let i = 0; i < field.length; i++) {
    field[i] = 0;
  }
}

let field = new Uint8Array(fieldWidth * fieldHeight);
function getField(x, y) {
  return field[y * fieldWidth + x];
}
function setField(x, y, val) {
  field[y * fieldWidth + x] = val;
}
let currentPiece = null;
let dropTimer = null;
let inputInterval = null;

const SHAPES = [
  // Z
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  // L
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  // J
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  // T
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  // I
  [[1, 1, 1, 1]],
  // O
  [
    [1, 1],
    [1, 1],
  ],
];

function getRandomPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const centerOffset = Math.floor((fieldWidth - shape[0].length) / 2);
  return { shape, x: centerOffset, y: 0 };
}

function spawnPiece() {
  currentPiece = nextPiece || getRandomPiece();
  nextPiece = getRandomPiece();
  if (collides(currentPiece)) endGame();
}

function collides(piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const fx = piece.x + x;
        const fy = piece.y + y;
        if (
          fx < 0 ||
          fx >= fieldWidth ||
          fy >= fieldHeight ||
          (fy >= 0 && getField(fx, fy))
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge(piece) {
  piece.shape.forEach((row, y) =>
    row.forEach((val, x) => {
      if (val) setField(piece.x + x, piece.y + y, 1);
    }),
  );
}

function clearLines() {
  for (let y = fieldHeight - 1; y >= 0; y--) {
    let full = true;
    for (let x = 0; x < fieldWidth; x++) {
      if (!getField(x, y)) {
        full = false;
        break;
      }
    }
    if (full) {
      for (let ty = y; ty > 0; ty--) {
        for (let x = 0; x < fieldWidth; x++) {
          setField(x, ty, getField(x, ty - 1));
        }
      }
      for (let x = 0; x < fieldWidth; x++) {
        setField(x, 0, 0);
      }
      score += 100;
      y++;
    }
  }
}

function drawField() {
  if (gameOverFlag) return;
  bC.clear(1);
  drawBorder();
  drawScore();
  drawNextPiece();
  drawVersion();
  drawTitle();

  for (let y = 0; y < fieldHeight; y++) {
    for (let x = 0; x < fieldWidth; x++) {
      if (getField(x, y)) drawBlock(x, y);
    }
  }

  if (currentPiece) {
    currentPiece.shape.forEach((row, y) =>
      row.forEach((val, x) => {
        if (val) drawBlock(currentPiece.x + x, currentPiece.y + y);
      }),
    );
  }
  bC.flip();
}

function drawBlock(x, y) {
  bC.setColor(3);
  bC.fillRect(
    fieldX + x * blockSize,
    fieldY + y * blockSize,
    fieldX + (x + 1) * blockSize - 1,
    fieldY + (y + 1) * blockSize - 1,
  );
}

function drawBorder() {
  bC.setColor(2);
  bC.drawRect(
    fieldX,
    fieldY,
    fieldX + fieldWidth * blockSize - 1,
    fieldY + fieldHeight * blockSize - 1,
  );
}

function drawScore() {
  bC.setColor(3);
  bC.setFontMonofonto18();
  bC.drawString('Score:', fieldX - 80, fieldY);
  bC.drawString(score.toString(), fieldX - 80, fieldY + 20);
}

function drawNextPiece() {
  if (!nextPiece) return;
  bC.setColor(3);
  bC.setFontMonofonto18();
  const nx = fieldX + fieldWidth * blockSize + 10;
  bC.drawString('Next:', nx, fieldY);
  nextPiece.shape.forEach((row, y) =>
    row.forEach((val, x) => {
      if (val)
        bC.fillRect(
          nx + x * blockSize,
          fieldY + 20 + y * blockSize,
          nx + (x + 1) * blockSize - 1,
          fieldY + 20 + (y + 1) * blockSize - 1,
        );
    }),
  );
}

function drawVersion() {
  bC.setColor(3);
  bC.setFontMonofonto16();
  const nx = fieldX + fieldWidth * blockSize + 10;
  bC.drawString('v' + GAME_VERSION, nx, bC.getHeight() - 30);
}

function drawTitle() {
  bC.setColor(3);
  bC.setFontMonofonto16();
  bC.drawString(GAME_NAME, fieldX - 80, bC.getHeight() - 30);
}

function drop() {
  if (!currentPiece || gameOverFlag) return;
  currentPiece.y++;
  if (collides(currentPiece)) {
    currentPiece.y--;
    merge(currentPiece);
    clearLines();
    spawnPiece();
  }
  drawField();
}

function move(dir) {
  if (gameOverFlag) return;
  currentPiece.x += dir;
  if (collides(currentPiece)) currentPiece.x -= dir;
  drawField();
}

function rotate() {
  if (gameOverFlag) return;
  const shape = currentPiece.shape;
  const newShape = shape[0].map((_, i) => shape.map((row) => row[i]).reverse());
  const oldShape = currentPiece.shape;
  currentPiece.shape = newShape;
  if (collides(currentPiece)) currentPiece.shape = oldShape;
  drawField();
}

function drawGearIcon(x, y, scale) {
  bC.setColor(3);
  const toothLength = 2 * scale;
  const toothOffset = 4 * scale;
  const radius = 3 * scale;
  const hole = 1 * scale;
  const diag = toothOffset * 0.707;

  bC.fillRect(
    x - toothOffset - toothLength / 2,
    y - toothLength / 2,
    x - toothOffset + toothLength / 2,
    y + toothLength / 2,
  );
  bC.fillRect(
    x + toothOffset - toothLength / 2,
    y - toothLength / 2,
    x + toothOffset + toothLength / 2,
    y + toothLength / 2,
  );
  bC.fillRect(
    x - toothLength / 2,
    y - toothOffset - toothLength / 2,
    x + toothLength / 2,
    y - toothOffset + toothLength / 2,
  );
  bC.fillRect(
    x - toothLength / 2,
    y + toothOffset - toothLength / 2,
    x + toothLength / 2,
    y + toothOffset + toothLength / 2,
  );

  bC.fillRect(
    x - diag - toothLength / 2,
    y - diag - toothLength / 2,
    x - diag + toothLength / 2,
    y - diag + toothLength / 2,
  );
  bC.fillRect(
    x + diag - toothLength / 2,
    y - diag - toothLength / 2,
    x + diag + toothLength / 2,
    y - diag + toothLength / 2,
  );
  bC.fillRect(
    x - diag - toothLength / 2,
    y + diag - toothLength / 2,
    x - diag + toothLength / 2,
    y + diag + toothLength / 2,
  );
  bC.fillRect(
    x + diag - toothLength / 2,
    y + diag - toothLength / 2,
    x + diag + toothLength / 2,
    y + diag + toothLength / 2,
  );

  bC.fillCircle(x, y, radius);
  bC.setColor(0);
  bC.fillCircle(x, y, hole);
}

function endGame() {
  clearInterval(dropTimer);
  gameOverFlag = true;
  bC.clear(1);
  bC.setColor(3);
  bC.setFontMonofonto23();
  bC.drawString('GAME OVER', 120, 40);
  bC.setFontMonofonto18();
  bC.drawString('Score: ' + score, 120, 70);
  bC.setFontMonofonto16();
  bC.drawString('Press   to restart', 120, 100);
  drawGearIcon(172, 110, 2);
  bC.flip();

  if (inputInterval) clearInterval(inputInterval);
  inputInterval = setInterval(() => {
    if (BTN_PLAY.read()) {
      clearInterval(inputInterval);
      restartGame();
    }
  }, 100);
}

function restartGame() {
  if (inputInterval) clearInterval(inputInterval);
  gameOverFlag = false;
  score = 0;
  resetPlayfield();
  nextPiece = getRandomPiece();
  spawnPiece();
  drawField();
  dropTimer = setInterval(drop, dropInterval);
}

Pip.removeAllListeners('knob1');
Pip.on('knob1', (dir) => {
  if (gameOverFlag && dir === 0) restartGame();
  else if (dir !== 0) move(dir > 0 ? 1 : -1);
});
Pip.removeAllListeners('knob2');
Pip.on('knob2', (dir) => {
  if (gameOverFlag && dir === 0) restartGame();
  else rotate();
});

const watch = setInterval(() => {
  if (BTN_PLAY.read()) {
    if (!gameOverFlag) drop();
  } else if (BTN_TORCH.read()) {
    clearInterval(watch);
    clearInterval(dropTimer);
    if (inputInterval) clearInterval(inputInterval);
    bC.clear(1).flip();
    E.reboot();
  }
}, 100);

restartGame();
