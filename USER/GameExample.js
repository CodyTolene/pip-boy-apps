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
  const PLAY_AREA = {
    x1: 50,
    x2: SCREEN_WIDTH - 50,
    y1: 10,
    y2: SCREEN_HEIGHT - 10,
  };
  let screenWrapEnabled = true;

  // Block (player controlled)
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

  // Theme
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

  function drawBlock() {
    Theme.set(0, 1, 0).apply();
    // g.fillRect(blockX, blockY, blockX + BLOCK_SIZE, blockY + BLOCK_SIZE);
    g.drawRect(blockX, blockY, blockX + BLOCK_SIZE, blockY + BLOCK_SIZE);
  }

  function drawBorder() {
    g.drawRect(PLAY_AREA.x1, PLAY_AREA.y1, PLAY_AREA.x2, PLAY_AREA.y2);
  }

  function eraseBlock() {
    Theme.set(0, 0, 0).apply(); // Black
    g.fillRect(blockX, blockY, blockX + BLOCK_SIZE, blockY + BLOCK_SIZE);
  }

  function handleLeftKnob(dir) {
    if (dir !== 0) {
      eraseBlock();

      if (screenWrapEnabled) {
        blockX =
          PLAY_AREA.x1 +
          modulo(
            blockX - PLAY_AREA.x1 + dir * BLOCK_SIZE,
            PLAY_AREA.x2 - PLAY_AREA.x1 - BLOCK_SIZE + 1,
          );
      } else {
        blockX = E.clip(
          blockX + dir * BLOCK_SIZE,
          PLAY_AREA.x1,
          PLAY_AREA.x2 - BLOCK_SIZE,
        );
      }

      blockMoved = true;
    }
  }

  function handleRightKnob(dir) {
    if (dir !== 0) {
      eraseBlock();

      if (screenWrapEnabled) {
        blockY =
          PLAY_AREA.y1 +
          modulo(
            blockY - PLAY_AREA.y1 + dir * BLOCK_SIZE,
            PLAY_AREA.y2 - PLAY_AREA.y1 - BLOCK_SIZE + 1,
          );
      } else {
        blockY = E.clip(
          blockY + dir * BLOCK_SIZE,
          PLAY_AREA.y1,
          PLAY_AREA.y2 - BLOCK_SIZE,
        );
      }

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

  function modulo(a, b) {
    return ((a % b) + b) % b;
  }

  self.run = function () {
    g.clear();
    Theme.set(0, 1, 0).apply();
    drawBorder();
    drawBlock();

    Pip.removeAllListeners(LEFT_KNOB);
    Pip.on(LEFT_KNOB, handleLeftKnob);

    Pip.removeAllListeners(RIGHT_KNOB);
    Pip.on(RIGHT_KNOB, handleRightKnob);

    Pip.removeAllListeners(BTN_TORCH);
    Pip.on(BTN_TORCH, handleTorchButton);

    mainLoopInterval = setInterval(mainLoop, MAIN_LOOP_SPEED_MS);
  };

  return self;
}

GameExample().run();
