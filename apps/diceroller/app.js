// =============================================================================
//  Name: Dice Roller
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function DiceRoller() {
  const self = {};

  const APP_NAME = 'Dice Roller';
  const APP_VERSION = '1.1.1';

  // General constants
  const DICE_TYPES = ['D2', 'D4', 'D6', 'D8', 'D10', 'D12', 'D20'];
  const ELASTICITY = 0.95;
  const FRICTION = 0.98;
  const THROW_POWER = 8.0;

  // States
  let currentDiceIndex = DICE_TYPES.indexOf('D20');
  let dice = { x: 100, y: 100, vx: 2, vy: 3 };
  let face = 1;
  let faceTimer = null;
  let interval = null;
  let isRolling = false;
  let lastDraw = { x: 0, y: 0, w: 0, h: 0 };
  let rollCount = 0;

  // Positions
  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();
  const SCREEN_VISIBLE_AREA = {
    x1: 60,
    x2: SCREEN_WIDTH - 60,
    y1: 10,
    y2: SCREEN_HEIGHT - 10,
  };
  const HEADER_HEIGHT = 35;
  const DICE_BOX_XY = {
    x1: SCREEN_VISIBLE_AREA.x1,
    x2: SCREEN_VISIBLE_AREA.x2,
    y1: SCREEN_VISIBLE_AREA.y1 + HEADER_HEIGHT,
    y2: SCREEN_VISIBLE_AREA.y2,
  };

  // Knobs and Buttons
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 100;
  let lastLeftKnobTime = 0;

  // Colors
  const COLOR_BLACK = '#000000';
  const COLOR_THEME = g.theme.fg;
  const COLOR_THEME_DARK = g.blendColor(COLOR_BLACK, COLOR_THEME, 0.5);

  // Sounds
  const SOUNDS = {
    coinDrop: 'USER/DICEROLLER/coin-drop.wav',
    coinFlip: 'USER/DICEROLLER/coin-flip.wav',
    diceThrow: 'USER/DICEROLLER/dice-throw.wav',
  };

  function animateDice() {
    const type = DICE_TYPES[currentDiceIndex];
    const isCoin = type === 'D2';
    const radius = 30;
    const padding = 5;

    if (isCoin) {
      // Keep D2 coin centered during flip
      dice.x = (DICE_BOX_XY.x1 + DICE_BOX_XY.x2) / 2;
      dice.y = (DICE_BOX_XY.y1 + DICE_BOX_XY.y2) / 2;
    } else {
      // Update dice position
      dice.x += dice.vx;
      dice.y += dice.vy;

      // Bounce off walls
      if (
        dice.x < DICE_BOX_XY.x1 + radius + padding ||
        dice.x > DICE_BOX_XY.x2 - radius - padding
      ) {
        dice.vx = -dice.vx * ELASTICITY;
        dice.x = Math.max(
          DICE_BOX_XY.x1 + radius + padding,
          Math.min(dice.x, DICE_BOX_XY.x2 - radius - padding),
        );
      }

      // Bounce off floor/ceiling
      if (
        dice.y < DICE_BOX_XY.y1 + radius + padding ||
        dice.y > DICE_BOX_XY.y2 - radius - padding
      ) {
        dice.vy = -dice.vy * ELASTICITY;
        dice.y = Math.max(
          DICE_BOX_XY.y1 + radius + padding,
          Math.min(dice.y, DICE_BOX_XY.y2 - radius - padding),
        );
      }

      // Apply friction
      dice.vx *= FRICTION;
      dice.vy *= FRICTION;
    }

    const speed = Math.sqrt(dice.vx * dice.vx + dice.vy * dice.vy);
    const max = getSidesFromDiceType(type);

    if (faceTimer) {
      clearTimeout(faceTimer);
    }

    const nextDelay = Math.max(50, 600 - speed * 80);
    faceTimer = setTimeout(() => {
      // Alternate D2 face using rollCount
      face = isCoin ? (rollCount % 2) + 1 : Math.floor(Math.random() * max) + 1;
      drawDice();
    }, nextDelay);

    rollCount++;
    drawDice();

    if (rollCount >= 40 || speed < 0.5) {
      if (interval) {
        clearInterval(interval);
      }
      if (faceTimer) {
        clearTimeout(faceTimer);
      }

      if (isCoin) {
        if (rollCount % 2 === 0) {
          // Make sure coin doesn't land on edge
          rollCount++;
        }

        face = Math.random() < 0.5 ? 1 : 2;
        // Play the coin drop sound
        Pip.audioStart(SOUNDS.coinDrop);
      } else {
        face = Math.floor(Math.random() * max) + 1;
      }

      drawDice();
      isRolling = false;
    }
  }

  function clearIntervals() {
    if (interval) {
      clearInterval(interval);
    }
    if (faceTimer) {
      clearTimeout(faceTimer);
    }

    interval = null;
    faceTimer = null;
  }

  function clearScreen() {
    g.setColor(COLOR_BLACK);
    g.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  function drawBoundaries(area) {
    g.setColor(COLOR_THEME).drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function drawDice() {
    g.setColor(COLOR_BLACK);
    g.fillRect(
      lastDraw.x,
      lastDraw.y,
      lastDraw.x + lastDraw.w,
      lastDraw.y + lastDraw.h,
    );

    const size = 60;
    const radius = size / 2;
    const type = DICE_TYPES[currentDiceIndex];
    let result = face.toString();
    const isCoin = type === 'D2';
    const flipPhase = rollCount % 2;

    g.setColor(COLOR_THEME);

    if (isCoin) {
      if (isRolling && flipPhase === 0) {
        // Coin edge
        g.fillRect(dice.x - radius, dice.y - 2, dice.x + radius, dice.y + 2);
        result = ''; // No label when on edge
      } else {
        // Coin face
        g.drawCircle(dice.x, dice.y, radius);
        result = face === 1 ? 'H' : 'T';
      }
    } else {
      // Draw polygonal dice
      const sides = getDrawSidesFromDiceType(type);
      const points = [];
      for (let i = 0; i < sides; i++) {
        const angle = Math.PI / 2 + (i * Math.PI * 2) / sides;
        points.push([
          dice.x + radius * Math.cos(angle),
          dice.y + radius * Math.sin(angle),
        ]);
      }
      for (let i = 0; i < sides; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % sides];
        g.drawLine(p1[0], p1[1], p2[0], p2[1]);
      }
    }

    if (result) {
      g.setFont('6x8', 3);
      g.setFontAlign(-1, -1, 0);
      const textWidth = g.stringWidth(result);
      const textHeight = g.getFontHeight();
      g.drawString(result, dice.x - textWidth / 2 + 2, dice.y - textHeight / 2);
    }

    lastDraw = {
      x: dice.x - radius - 2,
      y: dice.y - radius - 2,
      w: size + 4,
      h: size + 4,
    };
  }

  function drawDiceLabel() {
    const name = DICE_TYPES[currentDiceIndex];

    g.setColor(COLOR_THEME)
      .setFontMonofonto23()
      .setFontAlign(1, -1, 0) // Align right-top
      .drawString(name, SCREEN_VISIBLE_AREA.x2 - 5, SCREEN_VISIBLE_AREA.y1 + 5);
  }

  function drawTitle() {
    g.setColor(COLOR_THEME)
      .setFontMonofonto23()
      .setFontAlign(-1, -1, 0)
      .drawString(
        APP_NAME,
        SCREEN_VISIBLE_AREA.x1 + 5,
        SCREEN_VISIBLE_AREA.y1 + 5,
      );

    const appNameWidth = g.stringWidth(APP_NAME);
    g.setColor(COLOR_THEME_DARK)
      .setFontMonofonto16()
      .setFontAlign(-1, -1, 0) // Align left-top
      .drawString(
        'v' + APP_VERSION,
        SCREEN_VISIBLE_AREA.x1 + 10 + appNameWidth,
        SCREEN_VISIBLE_AREA.y1 + 5 + 8,
      );
  }

  function getDrawSidesFromDiceType(type) {
    switch (type) {
      case 'D2':
        return 0;
      case 'D4':
        return 3;
      case 'D6':
        return 4;
      case 'D8':
        return 5;
      case 'D10':
        return 6;
      case 'D12':
        return 6;
      case 'D20':
        return 6;
      default:
        return 6;
    }
  }

  function getSidesFromDiceType(type) {
    return parseInt(type.substring(1));
  }

  function handleLeftKnob(dir) {
    if (isRolling) {
      // Still rolling, ignore left knob
      return;
    }

    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    rollDice();
  }

  function handlePowerButton() {
    clearIntervals();
    clearScreen();
    removeListeners();

    bC.clear(1).flip();
    E.reboot();
  }

  function handleRightKnob(dir) {
    if (isRolling) {
      return;
    }

    currentDiceIndex += dir;
    if (currentDiceIndex < 0) {
      currentDiceIndex = DICE_TYPES.length - 1;
    }
    if (currentDiceIndex >= DICE_TYPES.length) {
      currentDiceIndex = 0;
    }

    face =
      Math.floor(
        Math.random() * getSidesFromDiceType(DICE_TYPES[currentDiceIndex]),
      ) + 1;

    clearScreen();
    drawDiceLabel();
    drawTitle();
    drawBoundaries(DICE_BOX_XY);
    drawDice();
  }

  function handleTopButton() {
    // Adjust brightness
    const brightnessLevels = [1, 5, 10, 15, 20];
    const currentIndex = brightnessLevels.findIndex(
      (level) => level === Pip.brightness,
    );
    const nextIndex = (currentIndex + 1) % brightnessLevels.length;
    Pip.brightness = brightnessLevels[nextIndex];
    Pip.updateBrightness();
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
  }

  function rollDice() {
    isRolling = true;
    const max = getSidesFromDiceType(DICE_TYPES[currentDiceIndex]);
    face = Math.floor(Math.random() * max) + 1;
    dice.vx = (Math.random() * 6 - 3) * THROW_POWER;
    dice.vy = (Math.random() * 6 - 3) * THROW_POWER;
    rollCount = 0;

    if (interval) {
      clearInterval(interval);
    }

    const isCoin = DICE_TYPES[currentDiceIndex] === 'D2';
    let frameRate = 100;

    if (isCoin) {
      // For D2 coin flip, we want a slightly slower animation
      frameRate = 150;
      // Play the coin flip sound
      Pip.audioStart(SOUNDS.coinFlip);
    } else {
      // Play the dice throw sound
      Pip.audioStart(SOUNDS.diceThrow);
    }

    interval = setInterval(animateDice, frameRate);
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
  }

  self.run = function () {
    bC.clear();
    clearScreen();
    setListeners();
    drawTitle();
    drawDiceLabel();
    drawBoundaries(DICE_BOX_XY);
    drawDice();

    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: true,
    });
  };

  return self;
}

DiceRoller().run();
