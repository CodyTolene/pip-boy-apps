function GameExample() {
  const self = {};

  // General
  const GAME_NAME = 'Game';
  const GAME_VERSION = '1.0.0';

  // Intervals
  const MAIN_LOOP_SPEED_MS = 1000 / 60; // 60 FPS
  let mainLoopInterval = null;

  // Screen
  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();

  // Block
  const BLOCK_SIZE = 10; // In pixels
  let blockMoved = false;
  let blockX = SCREEN_WIDTH / 2 - BLOCK_SIZE / 2;
  let blockY = SCREEN_HEIGHT / 2 - BLOCK_SIZE / 2;

  // Field
  const FIELD_HEIGHT = 20;
  const FIELD_WIDTH = 10;
  const FIELD = new Uint8Array(FIELD_WIDTH * FIELD_HEIGHT);

  // User Input
  const LEFT_KNOB = 'knob1';
  const RIGHT_KNOB = 'knob2';
  const BTN_TORCH = 'torch';

  function drawBlock() {
    Theme.apply();
    g.fillRect(blockX, blockY, blockX + BLOCK_SIZE, blockY + BLOCK_SIZE);
  }

  function eraseBlock() {
    g.setColor(0, 0, 0); // Black
    g.fillRect(blockX, blockY, blockX + BLOCK_SIZE, blockY + BLOCK_SIZE);
  }

  function handleLeftKnob(dir) {
    if (dir < 0 && blockX > 0) {
      eraseBlock();
      blockX -= BLOCK_SIZE;
      blockMoved = true;
    } else if (dir > 0 && blockX < SCREEN_WIDTH - BLOCK_SIZE) {
      eraseBlock();
      blockX += BLOCK_SIZE;
      blockMoved = true;
    }
  }

  function handleRightKnob(dir) {
    if (dir < 0 && blockY > 0) {
      eraseBlock();
      blockY -= BLOCK_SIZE;
      blockMoved = true;
    } else if (dir > 0 && blockY < SCREEN_WIDTH - BLOCK_SIZE) {
      eraseBlock();
      blockY += BLOCK_SIZE;
      blockMoved = true;
    }
  }

  function handleTorchButton() {
    Pip.removeAllListeners(LEFT_KNOB);
    Pip.removeAllListeners(RIGHT_KNOB);
    Pip.removeAllListeners(BTN_TORCH);

    clearInterval(mainLoopInterval);

    g.clear();
    E.reboot();
  }

  function mainLoop() {
    if (blockMoved) {
      drawBlock();
      blockMoved = false;
    }
  }

  self.run = function () {
    g.clear();
    Theme.set().apply();
    drawBlock();

    Pip.removeAllListeners(LEFT_KNOB);
    Pip.on(LEFT_KNOB, handleLeftKnob);

    Pip.removeAllListeners(RIGHT_KNOB);
    Pip.on(RIGHT_KNOB, handleRightKnob);

    Pip.removeAllListeners(BTN_TORCH);
    Pip.on(BTN_TORCH, handleTorchButton);

    mainLoopInterval = setInterval(mainLoop, MAIN_LOOP_SPEED_MS);
  };

  const Theme = {
    self: [0, 1, 0], // Start with green
    apply: function () {
      g.setColor(this.self[0], this.self[1], this.self[2]);
    },
    get: function () {
      return this.self;
    },
    set: function (red, grn, blu, system) {
      if (system === undefined || system === true) {
        const c = g.getColor();
        red = (c >> 16) & 0xff;
        grn = (c >> 8) & 0xff;
        blu = c & 0xff;
        red /= 255;
        grn /= 255;
        blu /= 255;
      }

      this.self[0] = red;
      this.self[1] = grn;
      this.self[2] = blu;
      return this;
    },
  };

  return self;
}

GameExample().run();
