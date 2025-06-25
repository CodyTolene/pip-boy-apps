// =============================================================================
//  Name: Dice Roller
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
//  Description: A simple dice rolling app for the Pip-Boy 3000 Mk V.
// =============================================================================

function DiceRoller() {
  const self = {};

  const APP_NAME = 'Dice Roller';
  const APP_VERSION = '1.0.0';

  // General constants
  const DICE_TYPES = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];
  const ELASTICITY = 0.95;
  const FRICTION = 0.98;
  const THROW_POWER = 8.0;

  // States
  let currentDiceIndex = 5; // D20
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
  const BLACK = '#000000';
  const GREEN = '#00ff00';
  const GREEN_DARK = '#007f00';

  function animateDice() {
    dice.x += dice.vx;
    dice.y += dice.vy;

    const radius = 30;
    const padding = 5;

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

    dice.vx *= FRICTION;
    dice.vy *= FRICTION;

    const speed = Math.sqrt(dice.vx * dice.vx + dice.vy * dice.vy);
    const max = getSidesFromDiceType(DICE_TYPES[currentDiceIndex]);

    if (faceTimer) {
      clearTimeout(faceTimer);
    }

    const nextDelay = Math.max(50, 600 - speed * 80);
    faceTimer = setTimeout(() => {
      face = Math.floor(Math.random() * max) + 1;
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

      face = Math.floor(Math.random() * max) + 1;
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
    g.setColor(BLACK);
    g.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  function drawBoundaries(area) {
    g.setColor(GREEN).drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function drawDice() {
    g.setColor(BLACK);
    g.fillRect(
      lastDraw.x,
      lastDraw.y,
      lastDraw.x + lastDraw.w,
      lastDraw.y + lastDraw.h,
    );

    const size = 60;
    const radius = size / 2;
    const sides = getDrawSidesFromDiceType(DICE_TYPES[currentDiceIndex]);

    g.setColor(GREEN);

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

    g.setFont('6x8', 3);
    g.setFontAlign(0, 0);
    g.drawString(face + '', dice.x, dice.y);

    lastDraw = {
      x: dice.x - radius - 2,
      y: dice.y - radius - 2,
      w: size + 4,
      h: size + 4,
    };
  }

  function drawDiceLabel() {
    const name = DICE_TYPES[currentDiceIndex];

    g.setColor(GREEN)
      .setFontMonofonto23()
      .setFontAlign(1, -1, 0) // Align right-top
      .drawString(name, SCREEN_VISIBLE_AREA.x2 - 5, SCREEN_VISIBLE_AREA.y1 + 5);
  }

  function drawTitle() {
    g.setColor(GREEN)
      .setFontMonofonto23()
      .setFontAlign(-1, -1, 0)
      .drawString(
        APP_NAME,
        SCREEN_VISIBLE_AREA.x1 + 5,
        SCREEN_VISIBLE_AREA.y1 + 5,
      );

    const appNameWidth = g.stringWidth(APP_NAME);
    g.setColor(GREEN_DARK)
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
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }

    lastLeftKnobTime = now;
    rollDice();
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
    clearIntervals();
    clearScreen();
    removeListeners();

    bC.clear(1).flip();
    E.reboot();
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

    interval = setInterval(animateDice, 100);
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
  };

  return self;
}

DiceRoller().run();
