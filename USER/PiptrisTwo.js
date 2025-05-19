function PipTrisTwo() {
  const self = {};

  const GAME_NAME = 'PiptrisTwo';
  const GAME_VERSION = '2.0.0';

  const BLOCK_SIZE = 10;
  const BLOCK_DROP_SPEED = 800;

  const FIELD_WIDTH = 16;
  const FIELD_HEIGHT = 20;
  const FIELD = new Uint8Array(FIELD_WIDTH * FIELD_HEIGHT);
  const FIELD_X = 120;
  const FIELD_Y = 0;

  let currentPiece = null;
  let nextPiece = null;
  let dropTimer = null;
  let gameOverFlag = false;
  let score = 0;

  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 100;
  let lastLeftKnobTime = 0;

  // prettier-ignore
  const SHAPES = [
    [[1, 1, 1, 1]],         // I
    [[1, 1, 0],[0, 1, 1]],  // Z
    [[0, 1, 1],[1, 1, 0]],  // S
    [[1, 0, 0],[1, 1, 1]],  // J
    [[0, 0, 1],[1, 1, 1]],  // L
    [[0, 1, 0],[1, 1, 1]],  // T
    [[1, 1],[1, 1]],        // O
  ];

  const Theme = {
    self: [0, 1, 0], // Default color (green)
    apply: function () {
      bC.setColor(this.self[0], this.self[1], this.self[2]);
    },
    get: function () {
      return this.self;
    },
    set: function (rV, gV, bV, system) {
      if (rV === undefined || gV === undefined || bV === undefined || system) {
        const hex = bC.getColor().toString(16);
        for (let i = 0; i < 3; i++) {
          this.self[i] = parseInt(hex.charAt(i), 16) / 15;
        }
      } else {
        this.self[0] = rV;
        this.self[1] = gV;
        this.self[2] = bV;
      }
      return this;
    },
  };

  function clearLines() {
    for (let y = FIELD_HEIGHT - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < FIELD_WIDTH; x++) {
        if (!FIELD[y * FIELD_WIDTH + x]) {
          full = false;
          break;
        }
      }

      if (full) {
        for (let x = 0; x < FIELD_WIDTH; x++) {
          eraseBlock(x, y);
        }

        for (let ty = y; ty > 0; ty--) {
          for (let x = 0; x < FIELD_WIDTH; x++) {
            FIELD[ty * FIELD_WIDTH + x] = FIELD[(ty - 1) * FIELD_WIDTH + x];
          }
        }

        for (let x = 0; x < FIELD_WIDTH; x++) {
          FIELD[x] = 0;
        }

        score += 100;
        y++;
      }
    }
  }

  function collides(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (!piece.shape[y][x]) {
          continue;
        }
        let fx = piece.x + x;
        let fy = piece.y + y;
        if (
          fx < 0 ||
          fx >= FIELD_WIDTH ||
          fy >= FIELD_HEIGHT ||
          (fy >= 0 && FIELD[fy * FIELD_WIDTH + fx])
        )
          return true;
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

  function drawCurrentPiece(erase) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          if (erase) {
            eraseBlock(currentPiece.x + x, currentPiece.y + y);
          } else {
            drawBlock(currentPiece.x + x, currentPiece.y + y);
          }
        }
      }
    }
  }

  function drawField() {
    Theme.apply();
    for (let y = 0; y < FIELD_HEIGHT; y++) {
      for (let x = 0; x < FIELD_WIDTH; x++) {
        if (FIELD[y * FIELD_WIDTH + x]) {
          drawBlock(x, y);
        } else {
          eraseBlock(x, y);
        }
      }
    }
    bC.flip();
  }

  function dropPiece() {
    if (!currentPiece || gameOverFlag) {
      return;
    }

    drawCurrentPiece(true);
    currentPiece.y++;

    if (collides(currentPiece)) {
      currentPiece.y--;
      drawCurrentPiece(false);
      merge(currentPiece);
      clearLines();
      drawField();
      spawnPiece();
    }

    drawCurrentPiece(false);
    bC.flip();
  }

  function dropToBottom() {
    if (!currentPiece || gameOverFlag) {
      return;
    }

    drawCurrentPiece(true);

    while (!collides(currentPiece)) {
      currentPiece.y++;
    }
    currentPiece.y--;

    drawCurrentPiece(false);
    merge(currentPiece);
    clearLines();
    drawField();
    spawnPiece();
    drawCurrentPiece(false);
    bC.flip();
  }

  function eraseBlock(x, y) {
    bC.setColor(0, 0, 0);
    bC.fillRect(
      FIELD_X + x * BLOCK_SIZE,
      FIELD_Y + y * BLOCK_SIZE,
      FIELD_X + (x + 1) * BLOCK_SIZE - 1,
      FIELD_Y + (y + 1) * BLOCK_SIZE - 1,
    );
  }

  function getRandomPiece() {
    let picked = Math.floor(Math.random() * SHAPES.length);
    let shapeData = SHAPES[picked];
    let offset = Math.floor((FIELD_WIDTH - shapeData[0].length) / 2);
    return { shape: shapeData, x: offset, y: 0 };
  }

  function handleLeftKnob(dir) {
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir === 0) {
      dropToBottom();
    } else {
      rotate(dir);
    }
  }

  function handleRightKnob(dir) {
    move(dir > 0 ? 1 : -1);
  }

  function handleTopButton() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);

    clearInterval(dropTimer);

    bC.clear(1).flip();
    E.reboot();
  }

  function merge(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          FIELD[(piece.y + y) * FIELD_WIDTH + piece.x + x] = 1;
        }
      }
    }
  }

  function move(dir) {
    if (gameOverFlag || !currentPiece) {
      return;
    }

    drawCurrentPiece(true);

    currentPiece.x += dir;
    if (collides(currentPiece)) {
      currentPiece.x -= dir;
    }

    drawCurrentPiece(false);
    bC.flip();
  }

  function resetField() {
    for (let i = 0; i < FIELD.length; i++) {
      FIELD[i] = 0;
    }

    bC.clear(1).flip();
  }

  function rotate(dir) {
    if (gameOverFlag || !currentPiece) {
      return;
    }

    let shape = currentPiece.shape;
    let newShape =
      dir > 0
        ? shape[0].map((_, i) => shape.map((row) => row[row.length - 1 - i]))
        : shape[0].map((_, i) => shape.map((row) => row[i]).reverse());
    drawCurrentPiece(true);

    let oldShape = currentPiece.shape;
    currentPiece.shape = newShape;
    if (collides(currentPiece)) {
      currentPiece.shape = oldShape;
    }
    drawCurrentPiece(false);

    bC.flip();
  }

  function spawnPiece() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    if (collides(currentPiece)) {
      gameOverFlag = true;
      Theme.set(0, 1, 0).apply();
      bC.setFontMonofonto18();
      bC.drawString('GAME OVER', FIELD_X, FIELD_Y + 40);
      bC.flip();
      clearInterval(dropTimer);
    }
  }

  self.run = function () {
    resetField();

    score = 0;
    gameOverFlag = false;
    nextPiece = getRandomPiece();

    spawnPiece();
    drawField();

    dropTimer = setInterval(dropPiece, BLOCK_DROP_SPEED);

    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);

    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
  };

  return self;
}

PipTrisTwo().run();
