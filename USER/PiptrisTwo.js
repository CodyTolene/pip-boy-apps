function PipTris() {
  const self = {};

  const GAME_NAME = 'Piptris';
  const GAME_VERSION = '2.0.0';

  // Game State
  let blockCurrent = null;
  let blockDropSpeed = 800;
  let blockNext = null;
  let blockSize = 10;
  let isGameOver = false;
  let mainLoopInterval = null;
  let musicFiles = [];
  let score = 0;

  // Screen
  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();
  const SCREEN_AREA = {
    x1: 60,
    x2: SCREEN_WIDTH - 60,
    y1: 10,
    y2: SCREEN_HEIGHT - 10,
  };

  // Play Area
  const PLAY_AREA_WIDTH = 10;
  const PLAY_AREA_HEIGHT = 20;
  const PLAY_AREA_BLOCKS = new Uint8Array(PLAY_AREA_WIDTH * PLAY_AREA_HEIGHT);
  const PLAY_AREA_X =
    (SCREEN_AREA.x1 + SCREEN_AREA.x2) / 2 - (blockSize * PLAY_AREA_WIDTH) / 2;
  const PLAY_AREA_Y =
    SCREEN_AREA.y1 +
    (SCREEN_AREA.y2 - SCREEN_AREA.y1) / 2 -
    (blockSize * PLAY_AREA_HEIGHT) / 2;
  const PLAY_AREA = {
    x1: PLAY_AREA_X - 1,
    y1: PLAY_AREA_Y - 1,
    x2: PLAY_AREA_X + PLAY_AREA_WIDTH * blockSize,
    y2: PLAY_AREA_Y + PLAY_AREA_HEIGHT * blockSize,
  };

  // Knobs and Buttons
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 100;
  let lastLeftKnobTime = 0;

  // Audio/music
  const MUSIC_STOPPED = 'audioStopped';
  const MUSIC_FOLDER = 'USER/Piptris';

  // Shapes (game pieces)
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
      g.setColor(this.self[0], this.self[1], this.self[2]);
    },
    get: function () {
      return this.self;
    },
    set: function (rV, gV, bV, system) {
      if (rV === undefined || gV === undefined || bV === undefined || system) {
        const hex = g.getColor().toString(16);
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
    // print('[clearLines] Clearing lines');

    for (let y = PLAY_AREA_HEIGHT - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
        if (!PLAY_AREA_BLOCKS[y * PLAY_AREA_WIDTH + x]) {
          full = false;
          break;
        }
      }

      if (full) {
        for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
          eraseBlock(x, y);
        }

        for (let ty = y; ty > 0; ty--) {
          for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
            PLAY_AREA_BLOCKS[ty * PLAY_AREA_WIDTH + x] =
              PLAY_AREA_BLOCKS[(ty - 1) * PLAY_AREA_WIDTH + x];
          }
        }

        for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
          PLAY_AREA_BLOCKS[x] = 0;
        }

        score += 100;
        y++;
      }
    }
  }

  function collides(piece) {
    // print('[collides] Checking collision for piece', piece);

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (!piece.shape[y][x]) {
          continue;
        }
        let fx = piece.x + x,
          fy = piece.y + y;
        if (
          fx < 0 ||
          fx >= PLAY_AREA_WIDTH ||
          fy >= PLAY_AREA_HEIGHT ||
          (fy >= 0 && PLAY_AREA_BLOCKS[fy * PLAY_AREA_WIDTH + fx])
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function drawBlock(x, y) {
    // print('[drawBlock] Drawing block at', x, y);

    Theme.apply();
    g.fillRect(
      PLAY_AREA_X + x * blockSize,
      PLAY_AREA_Y + y * blockSize,
      PLAY_AREA_X + (x + 1) * blockSize - 1,
      PLAY_AREA_Y + (y + 1) * blockSize - 1,
    );
  }

  function drawBoundaries(area) {
    // print('[drawBoundaries] Drawing boundaries');

    Theme.set(0, 1, 0).apply();
    g.drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function drawCurrentPiece(erase) {
    // print('[drawCurrentPiece] Drawing current piece', blockCurrent);

    for (let y = 0; y < blockCurrent.shape.length; y++) {
      for (let x = 0; x < blockCurrent.shape[y].length; x++) {
        if (blockCurrent.shape[y][x]) {
          if (erase) {
            eraseBlock(blockCurrent.x + x, blockCurrent.y + y);
          } else {
            drawBlock(blockCurrent.x + x, blockCurrent.y + y);
          }
        }
      }
    }
  }

  function drawField() {
    // print('[drawField] Drawing field');

    Theme.apply();
    for (let y = 0; y < PLAY_AREA_HEIGHT; y++) {
      for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
        if (PLAY_AREA_BLOCKS[y * PLAY_AREA_WIDTH + x]) {
          drawBlock(x, y);
        } else {
          eraseBlock(x, y);
        }
      }
    }
  }

  function dropPiece() {
    // print('[dropPiece] Dropping piece');

    if (!blockCurrent || isGameOver) {
      return;
    }

    drawCurrentPiece(true);
    blockCurrent.y++;

    if (collides(blockCurrent)) {
      blockCurrent.y--;
      drawCurrentPiece(false);
      merge(blockCurrent);
      clearLines();
      drawField();
      spawnPiece();
    }

    drawCurrentPiece(false);
    drawBoundaries(PLAY_AREA);
  }

  function dropToBottom() {
    // print('[dropToBottom] Dropping piece to bottom');

    if (!blockCurrent || isGameOver) {
      return;
    }

    drawCurrentPiece(true);

    while (!collides(blockCurrent)) {
      blockCurrent.y++;
    }
    blockCurrent.y--;

    drawCurrentPiece(false);
    merge(blockCurrent);
    clearLines();
    drawField();
    spawnPiece();
    drawCurrentPiece(false);
  }

  function eraseBlock(x, y) {
    // print('[eraseBlock] Erasing block at', x, y);

    g.setColor(0, 0, 0);
    g.fillRect(
      PLAY_AREA_X + x * blockSize,
      PLAY_AREA_Y + y * blockSize,
      PLAY_AREA_X + (x + 1) * blockSize - 1,
      PLAY_AREA_Y + (y + 1) * blockSize - 1,
    );
  }

  function getRandomPiece() {
    // print('[getRandomPiece] Getting random piece');

    let picked = Math.floor(Math.random() * SHAPES.length);
    let shapeData = SHAPES[picked];
    let offset = Math.floor((PLAY_AREA_WIDTH - shapeData[0].length) / 2);
    return { shape: shapeData, x: offset, y: 0 };
  }

  function handleMusicStopped() {
    playMusic();
  }

  function handleLeftKnob(dir) {
    // print('[handleLeftKnob] Handling left knob', dir);

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
    // print('[handleRightKnob] Handling right knob', dir);

    move(dir > 0 ? 1 : -1);
  }

  function handleTopButton() {
    // print('[handleTopButton] Handling top button');

    removeListeners();

    clearInterval(mainLoopInterval);

    bC.clear(1).flip();
    E.reboot();
  }

  function loadMusicFiles() {
    try {
      musicFiles = fs
        .readdir(MUSIC_FOLDER)
        .filter((f) => f.endsWith('.wav'))
        .sort();
      // print('[Piptris] Loaded music files:', musicFiles);
    } catch (e) {
      print('Failed to load Piptris music files:', e);
      musicFiles = [];
    }
  }

  function merge(piece) {
    // print('[merge] Merging piece into play area', piece);

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          PLAY_AREA_BLOCKS[(piece.y + y) * PLAY_AREA_WIDTH + piece.x + x] = 1;
        }
      }
    }
  }

  function move(dir) {
    // print('[move] Moving piece', dir);

    if (isGameOver || !blockCurrent) {
      return;
    }

    let oldX = blockCurrent.x;
    blockCurrent.x += dir;
    if (collides(blockCurrent)) {
      blockCurrent.x = oldX;
      return;
    }

    for (let y = 0; y < blockCurrent.shape.length; y++) {
      for (let x = 0; x < blockCurrent.shape[y].length; x++) {
        if (blockCurrent.shape[y][x]) {
          eraseBlock(oldX + x, blockCurrent.y + y);
        }
      }
    }

    drawCurrentPiece(false);
    drawBoundaries(SCREEN_AREA);
    drawBoundaries(PLAY_AREA);
  }

  function playMusic() {
    // print('[playMusic] Playing music');

    if (!musicFiles.length) return;

    const track = musicFiles[Math.floor(Math.random() * musicFiles.length)];
    Pip.audioStop();
    Pip.audioStart(MUSIC_FOLDER + '/' + track);
    rd.setVol(0.5);
  }

  function resetField() {
    // print('[resetField] Resetting field');

    for (let i = 0; i < PLAY_AREA_BLOCKS.length; i++) {
      PLAY_AREA_BLOCKS[i] = 0;
    }

    g.setColor(0, 0, 0);
    g.fillRect(
      PLAY_AREA_X,
      PLAY_AREA_Y,
      PLAY_AREA_X + PLAY_AREA_WIDTH * blockSize - 1,
      PLAY_AREA_Y + PLAY_AREA_HEIGHT * blockSize - 1,
    );
  }

  function rotate(dir) {
    // print('[rotate] Rotating piece', dir);

    if (isGameOver || !blockCurrent) {
      return;
    }

    const shape = blockCurrent.shape;
    const newShape =
      dir > 0
        ? shape[0].map((_, i) => shape.map((row) => row[row.length - 1 - i]))
        : shape[0].map((_, i) => shape.map((row) => row[i]).reverse());

    const oldShape = blockCurrent.shape;
    blockCurrent.shape = newShape;

    if (collides(blockCurrent)) {
      blockCurrent.shape = oldShape;
      return;
    }

    // Erase old shape
    for (let y = 0; y < oldShape.length; y++) {
      for (let x = 0; x < oldShape[y].length; x++) {
        if (oldShape[y][x]) {
          eraseBlock(blockCurrent.x + x, blockCurrent.y + y);
        }
      }
    }

    drawCurrentPiece(false);
    drawBoundaries(SCREEN_AREA);
    drawBoundaries(PLAY_AREA);
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
    Pip.removeAllListeners(MUSIC_STOPPED);
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
    Pip.on(MUSIC_STOPPED, handleMusicStopped);
  }

  function spawnPiece() {
    // print('[spawnPiece] Spawning new piece');

    blockCurrent = blockNext || getRandomPiece();
    blockNext = getRandomPiece();
    if (collides(blockCurrent)) {
      isGameOver = true;
      Theme.set(0, 1, 0).apply();
      g.setFontMonofonto18();
      g.drawString('GAME OVER', PLAY_AREA_X, PLAY_AREA_Y + 40);
      clearInterval(mainLoopInterval);
    }
  }

  self.run = function () {
    // print('[run] Starting game');

    loadMusicFiles();
    playMusic();

    bC.clear();
    drawBoundaries(PLAY_AREA);
    resetField();

    score = 0;
    isGameOver = false;
    blockNext = getRandomPiece();

    spawnPiece();
    drawField();
    drawBoundaries(SCREEN_AREA);

    mainLoopInterval = setInterval(dropPiece, blockDropSpeed);

    removeListeners();
    setListeners();

    // print('[run] Game started');
  };

  return self;
}

PipTris().run();
