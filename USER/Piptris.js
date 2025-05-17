// =============================================================================
//  Name: Piptris
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A simple Tetris inspired game for the Pip-Boy 3000 Mk V.
// =============================================================================

function Piptris() {
  const self = {};

  const GAME_NAME = 'Piptris';
  const GAME_VERSION = '1.1.1';

  const BLOCK_SIZE = 10;
  const DROP_INTERVAL = 800;
  const FIELD_HEIGHT = 20;
  const FIELD_WIDTH = 16;
  const FIELD = new Uint8Array(FIELD_WIDTH * FIELD_HEIGHT);
  const FIELD_X = 120;
  const FIELD_Y = 0;

  let inputInterval = null;
  let softDropInterval = null;

  let currentPiece = null;
  let dropTimer = null;
  let gameOverFlag = false;
  let nextPiece = null;
  let score = 0;

  const KNOB_DEBOUNCE = 100;
  const LEFT_KNOB = 'knob1';
  const RIGHT_KNOB = 'knob2';
  let lastLeftKnobTime = 0;
  let lastRightKnobTime = 0;

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

  function clearLines() {
    for (let y = FIELD_HEIGHT - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < FIELD_WIDTH; x++) {
        if (!getField(x, y)) {
          full = false;
          break;
        }
      }
      if (full) {
        for (let ty = y; ty > 0; ty--) {
          for (let x = 0; x < FIELD_WIDTH; x++) {
            setField(x, ty, getField(x, ty - 1));
          }
        }
        for (let x = 0; x < FIELD_WIDTH; x++) {
          setField(x, 0, 0);
        }
        score += 100;
        y++;
      }
    }
  }

  function collides(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const fx = piece.x + x;
          const fy = piece.y + y;
          if (
            fx < 0 ||
            fx >= FIELD_WIDTH ||
            fy >= FIELD_HEIGHT ||
            (fy >= 0 && getField(fx, fy))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function drawBlock(x, y) {
    bC.setColor(3);
    bC.fillRect(
      FIELD_X + x * BLOCK_SIZE,
      FIELD_Y + y * BLOCK_SIZE,
      FIELD_X + (x + 1) * BLOCK_SIZE - 1,
      FIELD_Y + (y + 1) * BLOCK_SIZE - 1,
    );
  }

  function drawBorder() {
    bC.setColor(2);
    bC.drawRect(
      FIELD_X,
      FIELD_Y,
      FIELD_X + FIELD_WIDTH * BLOCK_SIZE - 1,
      FIELD_Y + FIELD_HEIGHT * BLOCK_SIZE - 1,
    );
  }

  function drawField() {
    if (gameOverFlag) {
      return;
    }

    bC.clear(1);
    drawBorder();
    drawScore();
    drawNextPiece();
    drawVersion();
    drawTitle();

    for (let y = 0; y < FIELD_HEIGHT; y++) {
      for (let x = 0; x < FIELD_WIDTH; x++) {
        if (getField(x, y)) {
          drawBlock(x, y);
        }
      }
    }

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        const row = currentPiece.shape[y];
        for (let x = 0; x < row.length; x++) {
          if (row[x]) {
            drawBlock(currentPiece.x + x, currentPiece.y + y);
          }
        }
      }
    }
    bC.flip();
  }

  function drawGearIcon(x, y, scale) {
    bC.setColor(3);
    const toothLength = 2 * scale;
    const toothOffset = 4 * scale;
    const radius = 3 * scale;
    const hole = 1 * scale;
    const diag = toothOffset * 0.707;

    const f = (dx, dy) =>
      bC.fillRect(
        x + dx - toothLength / 2,
        y + dy - toothLength / 2,
        x + dx + toothLength / 2,
        y + dy + toothLength / 2,
      );
    f(-toothOffset, 0);
    f(toothOffset, 0);
    f(0, -toothOffset);
    f(0, toothOffset);
    f(-diag, -diag);
    f(diag, -diag);
    f(-diag, diag);
    f(diag, diag);
    bC.fillCircle(x, y, radius);
    bC.setColor(0);
    bC.fillCircle(x, y, hole);
  }

  function drawNextPiece() {
    if (!nextPiece) {
      return;
    }

    bC.setColor(3);
    bC.setFontMonofonto18();
    const nx = FIELD_X + FIELD_WIDTH * BLOCK_SIZE + 10;
    bC.drawString('Next:', nx, FIELD_Y);
    for (let y = 0; y < nextPiece.shape.length; y++) {
      const row = nextPiece.shape[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          bC.fillRect(
            nx + x * BLOCK_SIZE,
            FIELD_Y + 20 + y * BLOCK_SIZE,
            nx + (x + 1) * BLOCK_SIZE - 1,
            FIELD_Y + 20 + (y + 1) * BLOCK_SIZE - 1,
          );
        }
      }
    }
  }

  function drawScore() {
    bC.setColor(3);
    bC.setFontMonofonto18();
    bC.drawString('Score:', FIELD_X - 80, FIELD_Y);
    bC.drawString(score.toString(), FIELD_X - 80, FIELD_Y + 20);
  }

  function drawTitle() {
    bC.setColor(3);
    bC.setFontMonofonto16();
    bC.drawString(GAME_NAME, FIELD_X - 80, bC.getHeight() - 30);
  }

  function drawVersion() {
    bC.setColor(3);
    bC.setFontMonofonto16();
    const nx = FIELD_X + FIELD_WIDTH * BLOCK_SIZE + 10;
    bC.drawString('v' + GAME_VERSION, nx, bC.getHeight() - 30);
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

  function dropToBottom() {
    if (!currentPiece || gameOverFlag) return;
    while (true) {
      currentPiece.y++;
      if (collides(currentPiece)) {
        currentPiece.y--;
        break;
      }
    }
    merge(currentPiece);
    clearLines();
    spawnPiece();
    drawField();
  }

  function endGame() {
    clearInterval(dropTimer);
    clearInterval(softDropInterval);

    gameOverFlag = true;
    bC.clear(1);
    bC.setColor(3);
    bC.setFontMonofonto23();
    bC.drawString('GAME OVER', 120, 40);
    bC.setFontMonofonto18();
    bC.drawString('Score: ' + score, 120, 70);
    bC.setFontMonofonto16();
    bC.drawString('Press    to restart', 120, 100);
    drawGearIcon(175, 110, 2);
    bC.flip();

    if (inputInterval) clearInterval(inputInterval);
    inputInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        clearInterval(inputInterval);
        restartGame();
      }
    }, 100);
  }

  function getField(x, y) {
    return FIELD[y * FIELD_WIDTH + x];
  }

  function getRandomPiece() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const centerOffset = Math.floor((FIELD_WIDTH - shape[0].length) / 2);
    return { shape: shape, x: centerOffset, y: 0 };
  }

  function merge(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      const row = piece.shape[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          setField(piece.x + x, piece.y + y, 1);
        }
      }
    }
  }

  function move(dir) {
    if (gameOverFlag || !currentPiece) {
      return;
    }
    const newX = currentPiece.x + dir;
    if (newX < 0 || newX + currentPiece.shape[0].length > FIELD_WIDTH) {
      return;
    }

    currentPiece.x = newX;
    if (collides(currentPiece)) {
      currentPiece.x -= dir;
    }

    drawField();
  }

  function resetPlayfield() {
    for (let i = 0; i < FIELD.length; i++) {
      FIELD[i] = 0;
    }
  }

  function restartGame() {
    if (inputInterval) {
      clearInterval(inputInterval);
    }
    if (dropTimer) {
      clearInterval(dropTimer);
    }
    if (softDropInterval) {
      clearInterval(softDropInterval);
    }

    gameOverFlag = false;
    score = 0;
    resetPlayfield();
    nextPiece = getRandomPiece();
    spawnPiece();
    drawField();

    dropTimer = setInterval(() => drop(), DROP_INTERVAL);
    softDropInterval = setInterval(() => {
      if (!gameOverFlag && BTN_PLAY.read()) {
        drop();
      }
    }, 100);
  }

  function rotate(dir) {
    if (gameOverFlag) {
      return;
    }

    const shape = currentPiece.shape;
    const newShape =
      dir > 0
        ? shape[0].map((_, i) => shape.map((row) => row[row.length - 1 - i]))
        : shape[0].map((_, i) => shape.map((row) => row[i]).reverse());

    const oldShape = currentPiece.shape;
    currentPiece.shape = newShape;
    if (collides(currentPiece)) currentPiece.shape = oldShape;
    drawField();
  }

  self.run = function () {
    Pip.removeAllListeners(LEFT_KNOB);
    Pip.removeAllListeners(RIGHT_KNOB);

    Pip.on(LEFT_KNOB, (dir) => {
      const now = Date.now();
      if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
        return;
      }
      lastLeftKnobTime = now;

      if (dir === 0) {
        if (gameOverFlag) {
          restartGame();
        } else {
          dropToBottom();
        }
      } else {
        rotate(dir);
      }
    });

    Pip.on(RIGHT_KNOB, (dir) => {
      const now = Date.now();
      if (now - lastRightKnobTime < KNOB_DEBOUNCE) {
        return;
      }
      lastRightKnobTime = now;

      if (gameOverFlag && dir === 0) {
        restartGame();
      } else {
        move(dir > 0 ? 1 : -1);
      }
    });

    setWatch(
      () => {
        clearInterval(dropTimer);
        if (inputInterval) clearInterval(inputInterval);
        bC.clear(1).flip();
        E.reboot();
      },
      BTN_TORCH,
      { repeat: true, edge: 'rising', debounce: 10 },
    );

    restartGame();
  };

  function setField(x, y, val) {
    FIELD[y * FIELD_WIDTH + x] = val;
  }

  function spawnPiece() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    if (collides(currentPiece)) endGame();
  }

  return self;
}

Piptris().run();
