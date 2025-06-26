// =============================================================================
//  Name: Game Example
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function GameExample() {
  const self = {};

  // General
  const GAME_NAME = 'Game';
  const GAME_VERSION = '1.0.2';

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
  let screenWrapEnabled = false;

  // Block (player controlled)
  const BLOCK_SIZE = 10; // In pixels
  let blockMoved = false;
  let blockX = SCREEN_WIDTH / 2 - BLOCK_SIZE / 2;
  let blockY = SCREEN_HEIGHT / 2 - BLOCK_SIZE / 2;

  // Knobs
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';

  // Buttons
  const BTN_TOP = 'torch';
  const BTN_FRONT = BTN_PLAY;
  const BTN_FRONT_DEBOUNCE = 0.1;
  let lastFrontButtonState = false;
  let lastFrontButtonToggleTime = 0;

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

  function eraseBlock() {
    Theme.set(0, 0, 0).apply(); // Black
    g.fillRect(blockX, blockY, blockX + BLOCK_SIZE, blockY + BLOCK_SIZE);
  }

  function drawBoundaries() {
    Theme.set(0, 1, 0).apply();
    g.drawRect(PLAY_AREA.x1, PLAY_AREA.y1, PLAY_AREA.x2, PLAY_AREA.y2);
    playAreaVisible = true;
  }

  function eraseBoundaries() {
    Theme.set(0, 0, 0).apply();
    g.drawRect(PLAY_AREA.x1, PLAY_AREA.y1, PLAY_AREA.x2, PLAY_AREA.y2);
    playAreaVisible = false;
  }

  function handleFrontButton() {
    const now = getTime();
    const wasPressed = BTN_FRONT.read();

    if (
      wasPressed &&
      !lastFrontButtonState &&
      now - lastFrontButtonToggleTime > BTN_FRONT_DEBOUNCE
    ) {
      lastFrontButtonToggleTime = now;
      screenWrapEnabled = !screenWrapEnabled;
      Pip.audioStart('UI/PREV.wav');

      if (screenWrapEnabled) {
        eraseBoundaries();
      } else {
        drawBoundaries();
      }
    }

    lastFrontButtonState = wasPressed;
  }

  function handleLeftKnob(dir) {
    if (dir !== 0) {
      eraseBlock();

      if (screenWrapEnabled) {
        blockY =
          PLAY_AREA.y1 +
          modulo(
            blockY - PLAY_AREA.y1 - dir * BLOCK_SIZE,
            PLAY_AREA.y2 - PLAY_AREA.y1 - BLOCK_SIZE + 1,
          );
      } else {
        blockY = E.clip(
          blockY - dir * BLOCK_SIZE,
          PLAY_AREA.y1,
          PLAY_AREA.y2 - BLOCK_SIZE,
        );
      }

      blockMoved = true;
    }
  }

  function handlePowerButton() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);

    clearInterval(mainLoopInterval);

    g.clear();
    E.reboot();
  }

  function handleRightKnob(dir) {
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

  function handleTopButton() {
    const brightnessLevels = [1, 5, 10, 15, 20];
    const currentIndex = brightnessLevels.findIndex(
      (level) => level === Pip.brightness,
    );
    const nextIndex = (currentIndex + 1) % brightnessLevels.length;
    Pip.brightness = brightnessLevels[nextIndex];
    Pip.updateBrightness();
  }

  function mainLoop() {
    if (blockMoved) {
      drawBlock();
      if (playAreaVisible) {
        drawBoundaries();
      }
      blockMoved = false;
    }
    handleFrontButton();
  }

  function modulo(a, b) {
    return ((a % b) + b) % b;
  }

  self.run = function () {
    g.clear();
    Theme.set(0, 1, 0).apply();
    drawBoundaries();
    drawBlock();

    Pip.removeAllListeners(KNOB_LEFT);
    Pip.on(KNOB_LEFT, handleLeftKnob);

    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.on(KNOB_RIGHT, handleRightKnob);

    Pip.removeAllListeners(BTN_TOP);
    Pip.on(BTN_TOP, handleTopButton);

    mainLoopInterval = setInterval(mainLoop, MAIN_LOOP_SPEED_MS);

    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: !0,
    });
  };

  return self;
}

GameExample().run();
