// =============================================================================
//  Name: Piptris
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A simple Tetris inspired game for the Pip-Boy 3000 Mk V.
// =============================================================================

class Piptris {
  constructor() {
    this.GAME_NAME = 'Piptris';
    this.GAME_VERSION = '1.1.0';

    this.blockSize = 10;
    this.currentPiece = null;
    this.dropInterval = 800;
    this.dropTimer = null;
    this.fieldHeight = 20;
    this.fieldWidth = 16;
    this.fieldX = 120;
    this.fieldY = 0;
    this.field = new Uint8Array(this.fieldWidth * this.fieldHeight);
    this.gameOverFlag = false;
    this.inputInterval = null;
    this.nextPiece = null;
    this.score = 0;
    this.softDropInterval = null;

    this.KNOB_DEBOUNCE = 100;
    this.LEFT_KNOB = 'knob1';
    this.RIGHT_KNOB = 'knob2';
    this.lastLeftKnobTime = 0;
    this.lastRightKnobTime = 0;

    this.SHAPES = [
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
  }

  clearLines() {
    for (let y = this.fieldHeight - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < this.fieldWidth; x++) {
        if (!this.getField(x, y)) {
          full = false;
          break;
        }
      }
      if (full) {
        for (let ty = y; ty > 0; ty--) {
          for (let x = 0; x < this.fieldWidth; x++) {
            this.setField(x, ty, this.getField(x, ty - 1));
          }
        }
        for (let x = 0; x < this.fieldWidth; x++) {
          this.setField(x, 0, 0);
        }
        this.score += 100;
        y++;
      }
    }
  }

  collides(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const fx = piece.x + x;
          const fy = piece.y + y;
          if (
            fx < 0 ||
            fx >= this.fieldWidth ||
            fy >= this.fieldHeight ||
            (fy >= 0 && this.getField(fx, fy))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  drawBlock(x, y) {
    bC.setColor(3);
    bC.fillRect(
      this.fieldX + x * this.blockSize,
      this.fieldY + y * this.blockSize,
      this.fieldX + (x + 1) * this.blockSize - 1,
      this.fieldY + (y + 1) * this.blockSize - 1,
    );
  }

  drawBorder() {
    bC.setColor(2);
    bC.drawRect(
      this.fieldX,
      this.fieldY,
      this.fieldX + this.fieldWidth * this.blockSize - 1,
      this.fieldY + this.fieldHeight * this.blockSize - 1,
    );
  }

  drawField() {
    if (this.gameOverFlag) {
      return;
    }

    bC.clear(1);
    this.drawBorder();
    this.drawScore();
    this.drawNextPiece();
    this.drawVersion();
    this.drawTitle();

    for (let y = 0; y < this.fieldHeight; y++) {
      for (let x = 0; x < this.fieldWidth; x++) {
        if (this.getField(x, y)) {
          this.drawBlock(x, y);
        }
      }
    }

    if (this.currentPiece) {
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        const row = this.currentPiece.shape[y];
        for (let x = 0; x < row.length; x++) {
          if (row[x]) {
            this.drawBlock(this.currentPiece.x + x, this.currentPiece.y + y);
          }
        }
      }
    }
    bC.flip();
  }

  drawGearIcon(x, y, scale) {
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

  drawNextPiece() {
    if (!this.nextPiece) {
      return;
    }

    bC.setColor(3);
    bC.setFontMonofonto18();
    const nx = this.fieldX + this.fieldWidth * this.blockSize + 10;
    bC.drawString('Next:', nx, this.fieldY);
    for (let y = 0; y < this.nextPiece.shape.length; y++) {
      const row = this.nextPiece.shape[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          bC.fillRect(
            nx + x * this.blockSize,
            this.fieldY + 20 + y * this.blockSize,
            nx + (x + 1) * this.blockSize - 1,
            this.fieldY + 20 + (y + 1) * this.blockSize - 1,
          );
        }
      }
    }
  }

  drawScore() {
    bC.setColor(3);
    bC.setFontMonofonto18();
    bC.drawString('Score:', this.fieldX - 80, this.fieldY);
    bC.drawString(this.score.toString(), this.fieldX - 80, this.fieldY + 20);
  }

  drawTitle() {
    bC.setColor(3);
    bC.setFontMonofonto16();
    bC.drawString(this.GAME_NAME, this.fieldX - 80, bC.getHeight() - 30);
  }

  drawVersion() {
    bC.setColor(3);
    bC.setFontMonofonto16();
    const nx = this.fieldX + this.fieldWidth * this.blockSize + 10;
    bC.drawString('v' + this.GAME_VERSION, nx, bC.getHeight() - 30);
  }

  drop() {
    if (!this.currentPiece || this.gameOverFlag) return;
    this.currentPiece.y++;
    if (this.collides(this.currentPiece)) {
      this.currentPiece.y--;
      this.merge(this.currentPiece);
      this.clearLines();
      this.spawnPiece();
    }
    this.drawField();
  }

  dropToBottom() {
    if (!this.currentPiece || this.gameOverFlag) return;
    while (true) {
      this.currentPiece.y++;
      if (this.collides(this.currentPiece)) {
        this.currentPiece.y--;
        break;
      }
    }
    this.merge(this.currentPiece);
    this.clearLines();
    this.spawnPiece();
    this.drawField();
  }

  endGame() {
    clearInterval(this.dropTimer);
    clearInterval(this.softDropInterval);

    this.gameOverFlag = true;
    bC.clear(1);
    bC.setColor(3);
    bC.setFontMonofonto23();
    bC.drawString('GAME OVER', 120, 40);
    bC.setFontMonofonto18();
    bC.drawString('Score: ' + this.score, 120, 70);
    bC.setFontMonofonto16();
    bC.drawString('Press    to restart', 120, 100);
    this.drawGearIcon(175, 110, 2);
    bC.flip();

    if (this.inputInterval) clearInterval(this.inputInterval);
    this.inputInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        clearInterval(this.inputInterval);
        this.restartGame();
      }
    }, 100);
  }

  getField(x, y) {
    return this.field[y * this.fieldWidth + x];
  }

  getRandomPiece() {
    const shape = this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)];
    const centerOffset = Math.floor((this.fieldWidth - shape[0].length) / 2);
    return { shape, x: centerOffset, y: 0 };
  }

  merge(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      const row = piece.shape[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          this.setField(piece.x + x, piece.y + y, 1);
        }
      }
    }
  }

  move(dir) {
    if (this.gameOverFlag || !this.currentPiece) {
      return;
    }
    const newX = this.currentPiece.x + dir;
    if (
      newX < 0 ||
      newX + this.currentPiece.shape[0].length > this.fieldWidth
    ) {
      return;
    }

    this.currentPiece.x = newX;
    if (this.collides(this.currentPiece)) {
      this.currentPiece.x -= dir;
    }

    this.drawField();
  }

  resetPlayfield() {
    for (let i = 0; i < this.field.length; i++) {
      this.field[i] = 0;
    }
  }

  restartGame() {
    if (this.inputInterval) {
      clearInterval(this.inputInterval);
    }
    if (this.dropTimer) {
      clearInterval(this.dropTimer);
    }
    if (this.softDropInterval) {
      clearInterval(this.softDropInterval);
    }

    this.gameOverFlag = false;
    this.score = 0;
    this.resetPlayfield();
    this.nextPiece = this.getRandomPiece();
    this.spawnPiece();
    this.drawField();

    this.dropTimer = setInterval(() => this.drop(), this.dropInterval);
    this.softDropInterval = setInterval(() => {
      if (!this.gameOverFlag && BTN_PLAY.read()) {
        this.drop();
      }
    }, 100);
  }

  rotate(dir) {
    if (this.gameOverFlag) {
      return;
    }

    const shape = this.currentPiece.shape;
    const newShape =
      dir > 0
        ? shape[0].map((_, i) => shape.map((row) => row[row.length - 1 - i]))
        : shape[0].map((_, i) => shape.map((row) => row[i]).reverse());

    const oldShape = this.currentPiece.shape;
    this.currentPiece.shape = newShape;
    if (this.collides(this.currentPiece)) this.currentPiece.shape = oldShape;
    this.drawField();
  }

  run() {
    Pip.removeAllListeners(this.LEFT_KNOB);
    Pip.removeAllListeners(this.RIGHT_KNOB);

    Pip.on(this.LEFT_KNOB, (dir) => {
      const now = Date.now();
      if (now - this.lastLeftKnobTime < this.KNOB_DEBOUNCE) {
        return;
      }
      this.lastLeftKnobTime = now;

      if (dir === 0) {
        if (this.gameOverFlag) {
          this.restartGame();
        } else {
          this.dropToBottom();
        }
      } else {
        this.rotate(dir);
      }
    });

    Pip.on(this.RIGHT_KNOB, (dir) => {
      const now = Date.now();
      if (now - this.lastRightKnobTime < this.KNOB_DEBOUNCE) {
        return;
      }
      this.lastRightKnobTime = now;

      if (this.gameOverFlag && dir === 0) {
        this.restartGame();
      } else {
        this.move(dir > 0 ? 1 : -1);
      }
    });

    setWatch(
      () => {
        clearInterval(this.dropTimer);
        if (this.inputInterval) clearInterval(this.inputInterval);
        bC.clear(1).flip();
        E.reboot();
      },
      BTN_TORCH,
      { repeat: true, edge: 'rising', debounce: 10 },
    );

    this.restartGame();
  }

  setField(x, y, val) {
    this.field[y * this.fieldWidth + x] = val;
  }

  spawnPiece() {
    this.currentPiece = this.nextPiece || this.getRandomPiece();
    this.nextPiece = this.getRandomPiece();
    if (this.collides(this.currentPiece)) this.endGame();
  }
}

const piptris = new Piptris();
piptris.run();
