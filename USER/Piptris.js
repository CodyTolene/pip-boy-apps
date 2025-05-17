// =============================================================================
//  Name: Piptris
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A simple Tetris inspired game for the Pip-Boy 3000 Mk V.
// =============================================================================

function Piptris() {
  const self = {};

  self.GAME_NAME = 'Piptris';
  self.GAME_VERSION = '1.1.0';

  self.blockSize = 10;
  self.currentPiece = null;
  self.dropInterval = 800;
  self.dropTimer = null;
  self.fieldHeight = 20;
  self.fieldWidth = 16;
  self.fieldX = 120;
  self.fieldY = 0;
  self.field = new Uint8Array(self.fieldWidth * self.fieldHeight);
  self.gameOverFlag = false;
  self.inputInterval = null;
  self.nextPiece = null;
  self.score = 0;
  self.softDropInterval = null;

  self.KNOB_DEBOUNCE = 100;
  self.LEFT_KNOB = 'knob1';
  self.RIGHT_KNOB = 'knob2';
  self.lastLeftKnobTime = 0;
  self.lastRightKnobTime = 0;

  self.SHAPES = [
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

  self.clearLines = function () {
    for (let y = self.fieldHeight - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < self.fieldWidth; x++) {
        if (!self.getField(x, y)) {
          full = false;
          break;
        }
      }
      if (full) {
        for (let ty = y; ty > 0; ty--) {
          for (let x = 0; x < self.fieldWidth; x++) {
            self.setField(x, ty, self.getField(x, ty - 1));
          }
        }
        for (let x = 0; x < self.fieldWidth; x++) {
          self.setField(x, 0, 0);
        }
        self.score += 100;
        y++;
      }
    }
  };

  self.collides = function (piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const fx = piece.x + x;
          const fy = piece.y + y;
          if (
            fx < 0 ||
            fx >= self.fieldWidth ||
            fy >= self.fieldHeight ||
            (fy >= 0 && self.getField(fx, fy))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  self.drawBlock = function (x, y) {
    bC.setColor(3);
    bC.fillRect(
      self.fieldX + x * self.blockSize,
      self.fieldY + y * self.blockSize,
      self.fieldX + (x + 1) * self.blockSize - 1,
      self.fieldY + (y + 1) * self.blockSize - 1,
    );
  };

  self.drawBorder = function () {
    bC.setColor(2);
    bC.drawRect(
      self.fieldX,
      self.fieldY,
      self.fieldX + self.fieldWidth * self.blockSize - 1,
      self.fieldY + self.fieldHeight * self.blockSize - 1,
    );
  };

  self.drawField = function () {
    if (self.gameOverFlag) {
      return;
    }

    bC.clear(1);
    self.drawBorder();
    self.drawScore();
    self.drawNextPiece();
    self.drawVersion();
    self.drawTitle();

    for (let y = 0; y < self.fieldHeight; y++) {
      for (let x = 0; x < self.fieldWidth; x++) {
        if (self.getField(x, y)) {
          self.drawBlock(x, y);
        }
      }
    }

    if (self.currentPiece) {
      for (let y = 0; y < self.currentPiece.shape.length; y++) {
        const row = self.currentPiece.shape[y];
        for (let x = 0; x < row.length; x++) {
          if (row[x]) {
            self.drawBlock(self.currentPiece.x + x, self.currentPiece.y + y);
          }
        }
      }
    }
    bC.flip();
  };

  self.drawGearIcon = function (x, y, scale) {
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
  };

  self.drawNextPiece = function () {
    if (!self.nextPiece) {
      return;
    }

    bC.setColor(3);
    bC.setFontMonofonto18();
    const nx = self.fieldX + self.fieldWidth * self.blockSize + 10;
    bC.drawString('Next:', nx, self.fieldY);
    for (let y = 0; y < self.nextPiece.shape.length; y++) {
      const row = self.nextPiece.shape[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          bC.fillRect(
            nx + x * self.blockSize,
            self.fieldY + 20 + y * self.blockSize,
            nx + (x + 1) * self.blockSize - 1,
            self.fieldY + 20 + (y + 1) * self.blockSize - 1,
          );
        }
      }
    }
  };

  self.drawScore = function () {
    bC.setColor(3);
    bC.setFontMonofonto18();
    bC.drawString('Score:', self.fieldX - 80, self.fieldY);
    bC.drawString(self.score.toString(), self.fieldX - 80, self.fieldY + 20);
  };

  self.drawTitle = function () {
    bC.setColor(3);
    bC.setFontMonofonto16();
    bC.drawString(self.GAME_NAME, self.fieldX - 80, bC.getHeight() - 30);
  };

  self.drawVersion = function () {
    bC.setColor(3);
    bC.setFontMonofonto16();
    const nx = self.fieldX + self.fieldWidth * self.blockSize + 10;
    bC.drawString('v' + self.GAME_VERSION, nx, bC.getHeight() - 30);
  };

  self.drop = function () {
    if (!self.currentPiece || self.gameOverFlag) return;
    self.currentPiece.y++;
    if (self.collides(self.currentPiece)) {
      self.currentPiece.y--;
      self.merge(self.currentPiece);
      self.clearLines();
      self.spawnPiece();
    }
    self.drawField();
  };

  self.dropToBottom = function () {
    if (!self.currentPiece || self.gameOverFlag) return;
    while (true) {
      self.currentPiece.y++;
      if (self.collides(self.currentPiece)) {
        self.currentPiece.y--;
        break;
      }
    }
    self.merge(self.currentPiece);
    self.clearLines();
    self.spawnPiece();
    self.drawField();
  };

  self.endGame = function () {
    clearInterval(self.dropTimer);
    clearInterval(self.softDropInterval);

    self.gameOverFlag = true;
    bC.clear(1);
    bC.setColor(3);
    bC.setFontMonofonto23();
    bC.drawString('GAME OVER', 120, 40);
    bC.setFontMonofonto18();
    bC.drawString('Score: ' + self.score, 120, 70);
    bC.setFontMonofonto16();
    bC.drawString('Press    to restart', 120, 100);
    self.drawGearIcon(175, 110, 2);
    bC.flip();

    if (self.inputInterval) clearInterval(self.inputInterval);
    self.inputInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        clearInterval(self.inputInterval);
        self.restartGame();
      }
    }, 100);
  };

  self.getField = function (x, y) {
    return self.field[y * self.fieldWidth + x];
  };

  self.getRandomPiece = function () {
    const shape = self.SHAPES[Math.floor(Math.random() * self.SHAPES.length)];
    const centerOffset = Math.floor((self.fieldWidth - shape[0].length) / 2);
    return { shape: shape, x: centerOffset, y: 0 };
  };

  self.merge = function (piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      const row = piece.shape[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          self.setField(piece.x + x, piece.y + y, 1);
        }
      }
    }
  };

  self.move = function (dir) {
    if (self.gameOverFlag || !self.currentPiece) {
      return;
    }
    const newX = self.currentPiece.x + dir;
    if (
      newX < 0 ||
      newX + self.currentPiece.shape[0].length > self.fieldWidth
    ) {
      return;
    }

    self.currentPiece.x = newX;
    if (self.collides(self.currentPiece)) {
      self.currentPiece.x -= dir;
    }

    self.drawField();
  };

  self.resetPlayfield = function () {
    for (let i = 0; i < self.field.length; i++) {
      self.field[i] = 0;
    }
  };

  self.restartGame = function () {
    if (self.inputInterval) {
      clearInterval(self.inputInterval);
    }
    if (self.dropTimer) {
      clearInterval(self.dropTimer);
    }
    if (self.softDropInterval) {
      clearInterval(self.softDropInterval);
    }

    self.gameOverFlag = false;
    self.score = 0;
    self.resetPlayfield();
    self.nextPiece = self.getRandomPiece();
    self.spawnPiece();
    self.drawField();

    self.dropTimer = setInterval(() => self.drop(), self.dropInterval);
    self.softDropInterval = setInterval(() => {
      if (!self.gameOverFlag && BTN_PLAY.read()) {
        self.drop();
      }
    }, 100);
  };

  self.rotate = function (dir) {
    if (self.gameOverFlag) {
      return;
    }

    const shape = self.currentPiece.shape;
    const newShape =
      dir > 0
        ? shape[0].map((_, i) => shape.map((row) => row[row.length - 1 - i]))
        : shape[0].map((_, i) => shape.map((row) => row[i]).reverse());

    const oldShape = self.currentPiece.shape;
    self.currentPiece.shape = newShape;
    if (self.collides(self.currentPiece)) self.currentPiece.shape = oldShape;
    self.drawField();
  };

  self.run = function () {
    Pip.removeAllListeners(self.LEFT_KNOB);
    Pip.removeAllListeners(self.RIGHT_KNOB);

    Pip.on(self.LEFT_KNOB, (dir) => {
      const now = Date.now();
      if (now - self.lastLeftKnobTime < self.KNOB_DEBOUNCE) {
        return;
      }
      self.lastLeftKnobTime = now;

      if (dir === 0) {
        if (self.gameOverFlag) {
          self.restartGame();
        } else {
          self.dropToBottom();
        }
      } else {
        self.rotate(dir);
      }
    });

    Pip.on(self.RIGHT_KNOB, (dir) => {
      const now = Date.now();
      if (now - self.lastRightKnobTime < self.KNOB_DEBOUNCE) {
        return;
      }
      self.lastRightKnobTime = now;

      if (self.gameOverFlag && dir === 0) {
        self.restartGame();
      } else {
        self.move(dir > 0 ? 1 : -1);
      }
    });

    setWatch(
      () => {
        clearInterval(self.dropTimer);
        if (self.inputInterval) clearInterval(self.inputInterval);
        bC.clear(1).flip();
        E.reboot();
      },
      BTN_TORCH,
      { repeat: true, edge: 'rising', debounce: 10 },
    );

    self.restartGame();
  };

  self.setField = function (x, y, val) {
    self.field[y * self.fieldWidth + x] = val;
  };

  self.spawnPiece = function () {
    self.currentPiece = self.nextPiece || self.getRandomPiece();
    self.nextPiece = self.getRandomPiece();
    if (self.collides(self.currentPiece)) self.endGame();
  };

  return self;
}

Piptris().run();
