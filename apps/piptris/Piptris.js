// =============================================================================
//  Name: Piptris
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
//  Description: A simple Tetris inspired game for the Pip-Boy 3000 Mk V.
// =============================================================================

function Piptris() {
  const self = {};

  const GAME_NAME = 'Piptris';
  const GAME_VERSION = '2.2.0';

  // Game State
  let blockCurrent = null;
  let blockDropSpeed = 800;
  let blockNext = null;
  let blockSize = 10;
  let inputInterval = null;
  let isGameOver = false;
  let linesCleared = 0;
  let mainLoopInterval = null;
  let score = 0;
  let useHollowBlocks = false;

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
  const MUSIC = ['USER/piptris.wav'];

  // Icons
  const ICON_GEAR = 'USER/gear.json';

  // prettier-ignore
  const T_SHAPE = [[0, 1, 0],[1, 1, 1]];

  // Shapes (game pieces)
  // prettier-ignore
  const SHAPES = [
    [[1, 1, 1, 1]],         // I
    [[1, 1, 1, 1]],         // I (extra)
    [[1, 1, 0],[0, 1, 1]],  // Z
    [[0, 1, 1],[1, 1, 0]],  // S
    [[1, 0, 0],[1, 1, 1]],  // J
    [[0, 0, 1],[1, 1, 1]],  // L
    T_SHAPE,
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

  function clearGameArea() {
    g.setColor('#000');
    g.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  function clearLines() {
    let linesRemoved = 0;
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

        linesRemoved++;
        linesCleared++;
        y++;
      }
    }

    switch (linesRemoved) {
      case 1:
        score += 100;
        break;
      case 2:
        score += 300;
        break;
      case 3:
        score += 500;
        break;
      case 4:
        score += 800;
        break;
    }
  }

  function collides(piece) {
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
    Theme.apply();
    const block = [
      PLAY_AREA_X + x * blockSize,
      PLAY_AREA_Y + y * blockSize,
      PLAY_AREA_X + (x + 1) * blockSize - 1,
      PLAY_AREA_Y + (y + 1) * blockSize - 1,
    ];
    if (useHollowBlocks) {
      g.drawRect(block[0], block[1], block[2], block[3]);
    } else {
      g.fillRect(block[0], block[1], block[2], block[3]);
    }
  }

  function drawBoundaries(area) {
    Theme.set(0, 1, 0).apply();
    g.drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function drawCurrentPiece(erase) {
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
    drawScore();
    drawLinesCleared();
    drawNextPiece();
  }

  function drawGameOverScreen() {
    clearGameArea();

    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    g.clear();

    g.setColor('#0F0');
    g.setFont('6x8', 4);
    g.drawString('GAME OVER', centerX, centerY - 20);

    g.setColor('#FFF');
    g.setFont('6x8', 2);
    g.drawString('Press    to RESTART', centerX, centerY + 15);

    drawImageFromJSON(ICON_GEAR, centerX - 45, centerY + 1);

    g.setColor('#0F0');
    g.setFont('6x8', 2);
    g.drawString('Score: ' + score, centerX, centerY + 50);

    inputInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        clearInterval(inputInterval);
        startGame();
      }
    }, 100);
  }

  function drawImageFromJSON(path, x, y) {
    try {
      let jsonStr = fs.readFileSync(path);
      let json = JSON.parse(jsonStr);
      let image = {
        bpp: json.bpp,
        buffer: atob(json.buffer),
        height: json.height,
        transparent: json.transparent,
        width: json.width,
      };

      Theme.apply();
      g.drawImage(image, x, y);
    } catch (e) {
      console.log('Failed to load image:', e);
    }
  }

  function drawLinesCleared() {
    const linesX = PLAY_AREA.x1 - 65;
    const linesY = PLAY_AREA.y2 - 60;
    const fontHeight = 20;

    g.setFont('6x8', 2);
    const text = linesCleared.toString();
    const textWidth = g.stringWidth(text);
    const textHeight = 16;

    g.setColor('#000');
    g.fillRect(
      linesX - textWidth / 2 - 2,
      linesY + fontHeight - 6,
      linesX + textWidth / 2 + 2,
      linesY + fontHeight + textHeight - 4,
    );

    g.setColor('#FFF');
    g.drawString('LINES', linesX, linesY);

    Theme.apply();
    g.drawString(text, linesX, linesY + fontHeight);
  }

  function drawGameName() {
    const fontHeight = 20;
    const startX = PLAY_AREA.x1 - 65;
    const startY = PLAY_AREA.y1 + 25;

    g.setColor('#FFF');
    g.setFont('6x8', 2);
    g.drawString(GAME_NAME, startX, startY);

    Theme.apply();
    g.setFont('6x8', 1);
    g.drawString('v' + GAME_VERSION, startX, startY + fontHeight);
  }

  function drawNextPiece() {
    if (!blockNext) {
      return;
    }

    const startX = PLAY_AREA.x2 + 65;
    const startY = PLAY_AREA.y2 - 60;
    const previewWidth = 40;
    const previewHeight = 40;

    g.setColor('#000');
    g.fillRect(
      startX - previewWidth / 2 - 2,
      startY + 15,
      startX + previewWidth / 2,
      startY + 15 + previewHeight,
    );

    g.setFont('6x8', 2);
    g.setColor('#FFF');
    g.drawString('NEXT', startX, startY);

    Theme.apply();
    const piece = blockNext.shape;
    const piecePixelWidth = piece[0].length * blockSize;
    const offsetX = startX - piecePixelWidth / 2 - 2;

    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x]) {
          const block = [
            offsetX + x * blockSize,
            startY + 20 + y * blockSize,
            offsetX + (x + 1) * blockSize - 1,
            startY + 20 + (y + 1) * blockSize - 1,
          ];
          if (useHollowBlocks) {
            g.drawRect(block[0], block[1], block[2], block[3]);
          } else {
            g.fillRect(block[0], block[1], block[2], block[3]);
          }
        }
      }
    }
  }

  function dropPiece() {
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
      spawnPiece();

      // Game over sanity check
      if (collides(blockCurrent)) {
        isGameOver = true;
        clearInterval(mainLoopInterval);
        setTimeout(drawGameOverScreen, 50);
        return;
      }
    }

    drawCurrentPiece(false);
    drawBoundaries(PLAY_AREA);

    const fastDrop = BTN_PLAY.read();
    const desiredInterval = fastDrop ? 100 : blockDropSpeed;
    if (mainLoopInterval._interval !== desiredInterval) {
      clearInterval(mainLoopInterval);
      mainLoopInterval = setInterval(dropPiece, desiredInterval);
    }
  }

  function drawScore() {
    const scoreX = PLAY_AREA.x2 + 65;
    const scoreY = PLAY_AREA.y1 + 25;
    const fontHeight = 20;

    g.setFont('6x8', 2);
    const text = score.toString();
    const textWidth = g.stringWidth(text);
    const textHeight = 16;

    g.setColor('#000');
    g.fillRect(
      scoreX - textWidth / 2 - 2,
      scoreY + fontHeight - 6,
      scoreX + textWidth / 2 + 2,
      scoreY + fontHeight + textHeight - 4,
    );

    g.setColor('#FFF');
    g.drawString('SCORE', scoreX, scoreY);

    Theme.apply();
    g.drawString(text, scoreX, scoreY + fontHeight);
  }

  function drawStartScreen() {
    clearGameArea();

    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    g.clear();

    g.setColor('#0F0');
    g.setFont('6x8', 4);
    g.drawString(GAME_NAME, centerX + 10, centerY - 50);

    g.setColor('#FFF');
    g.setFont('6x8', 2);
    g.drawString('Press    to START', centerX + 10, centerY - 15);

    drawImageFromJSON(ICON_GEAR, centerX - 24, centerY - 29);

    drawStartScreenPreviewBlock();
  }

  function drawStartScreenPreviewBlock() {
    const centerX = SCREEN_WIDTH / 2;
    const blockSize = 10;

    const labelY = SCREEN_AREA.y2 - 15;
    const blockHeight = T_SHAPE.length * blockSize;
    const blockWidth = T_SHAPE[0].length * blockSize;
    const startY = labelY - blockHeight - 10;
    const startX = centerX - blockWidth / 2;

    g.setFont('6x8', 1);
    g.setColor('#FFF');
    g.drawString('<- BLOCK TYPE ->', centerX, labelY);

    g.setColor('#000');
    g.fillRect(
      startX - 2,
      startY - 2,
      startX + blockWidth + 2,
      startY + blockHeight + 2,
    );

    Theme.apply();
    for (let y = 0; y < T_SHAPE.length; y++) {
      for (let x = 0; x < T_SHAPE[y].length; x++) {
        if (T_SHAPE[y][x]) {
          const x1 = startX + x * blockSize;
          const y1 = startY + y * blockSize;
          const x2 = x1 + blockSize - 1;
          const y2 = y1 + blockSize - 1;
          if (useHollowBlocks) {
            g.drawRect(x1, y1, x2, y2);
          } else {
            g.fillRect(x1, y1, x2, y2);
          }
        }
      }
    }
  }

  function dropToBottom() {
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
    g.setColor('#000');
    g.fillRect(
      PLAY_AREA_X + x * blockSize,
      PLAY_AREA_Y + y * blockSize,
      PLAY_AREA_X + (x + 1) * blockSize - 1,
      PLAY_AREA_Y + (y + 1) * blockSize - 1,
    );
  }

  function getRandomPiece() {
    let picked = Math.floor(Math.random() * SHAPES.length);
    let shapeData = SHAPES[picked];
    let offset = Math.floor((PLAY_AREA_WIDTH - shapeData[0].length) / 2);
    return { shape: shapeData, x: offset, y: 0 };
  }

  function handleMusicStopped() {
    playMusic();
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
    removeListeners();

    clearInterval(mainLoopInterval);

    bC.clear(1).flip();
    E.reboot();
  }

  function merge(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          PLAY_AREA_BLOCKS[(piece.y + y) * PLAY_AREA_WIDTH + piece.x + x] = 1;
        }
      }
    }
  }

  function move(dir) {
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
    // drawBoundaries(SCREEN_AREA);
    drawBoundaries(PLAY_AREA);
  }

  function playMusic() {
    if (!MUSIC.length) return;

    const track = MUSIC[Math.floor(Math.random() * MUSIC.length)];
    Pip.audioStop();
    Pip.audioStart(track);
    rd.setVol(0.5);
  }

  function resetField() {
    PLAY_AREA_BLOCKS.fill(0);
    g.setColor('#000');
    g.fillRect(
      PLAY_AREA_X,
      PLAY_AREA_Y,
      PLAY_AREA_X + PLAY_AREA_WIDTH * blockSize - 1,
      PLAY_AREA_Y + PLAY_AREA_HEIGHT * blockSize - 1,
    );
  }

  function rotate(dir) {
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

    for (let y = 0; y < oldShape.length; y++) {
      for (let x = 0; x < oldShape[y].length; x++) {
        if (oldShape[y][x]) {
          eraseBlock(blockCurrent.x + x, blockCurrent.y + y);
        }
      }
    }

    drawCurrentPiece(false);
    // drawBoundaries(SCREEN_AREA);
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
    if (!blockNext) {
      blockNext = getRandomPiece();
    }

    blockCurrent = blockNext;
    blockNext = getRandomPiece();
    drawField();

    if (collides(blockCurrent)) {
      isGameOver = true;
      clearInterval(mainLoopInterval);
      setTimeout(() => {
        drawGameOverScreen();
      }, 50);
    }
  }

  function startGame() {
    clearInterval(mainLoopInterval);
    removeListeners();
    playMusic();

    score = 0;
    linesCleared = 0;
    isGameOver = false;
    blockCurrent = null;
    blockNext = getRandomPiece();

    clearGameArea();
    resetField();
    drawBoundaries(PLAY_AREA);
    // drawBoundaries(SCREEN_AREA);
    spawnPiece();
    drawField();
    drawGameName();

    setListeners();
    mainLoopInterval = setInterval(dropPiece, blockDropSpeed);
  }

  self.run = function () {
    bC.clear(); // Clear any previous screen

    drawStartScreen();

    function togglePreviewStyle() {
      useHollowBlocks = !useHollowBlocks;
      drawStartScreenPreviewBlock();
    }

    Pip.on(KNOB_LEFT, togglePreviewStyle);
    Pip.on(KNOB_RIGHT, togglePreviewStyle);

    inputInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        clearInterval(inputInterval);
        Pip.removeListener(KNOB_LEFT, togglePreviewStyle);
        Pip.removeListener(KNOB_RIGHT, togglePreviewStyle);
        startGame();
      }
    }, 100);
  };

  return self;
}

Piptris().run();
