function PipDoom() {
  const self = {};

  // Screen
  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();

  // Viewport constants
  const VIEW_W = 256,
    VIEW_H = 192;
  const VIEW_X = (SCREEN_WIDTH - VIEW_W) >> 1;
  const VIEW_Y = (SCREEN_HEIGHT - VIEW_H) >> 1;
  const HALF_VIEW_H = VIEW_H >> 1;
  const COLUMN_WIDTH = 32;
  const NUM_COLS = (VIEW_W / COLUMN_WIDTH) | 0;

  // Asset files
  const PATH_FOOTSTEP_1 = 'USER/PIP_DOOM/F_STEP_1.wav';
  const PATH_FOOTSTEP_2 = 'USER/PIP_DOOM/F_STEP_2.wav';
  const PATH_PISTOL_0 = 'USER/PIP_DOOM/PISTOL_0.json';
  const PATH_PISTOL_1 = 'USER/PIP_DOOM/PISTOL_1.json';
  const PATH_RELOAD = 'USER/PIP_DOOM/RELOAD.wav';
  const PATH_WALL_HIT = 'USER/PIP_DOOM/OOF.wav';
  const PATH_SHOOT = 'USER/PIP_DOOM/SHOOT.wav';

  // Game constants
  const FOV = Math.PI / 3;
  const ANGLE_STEPS = 16;
  const TILE_SIZE = 64;
  const STEP_SIZE = 4;
  const MAX_RAY_STEPS = 64;
  const MOVE_SPEED = 12;

  // Colors
  const COLOR_BLACK = '#000000';
  const COLOR_THEME = g.theme.fg || '#00FF00';
  const COLOR_THEME_LIGHT = g.blendColor(COLOR_THEME, '#FFFFFF', 0.3);
  const COLOR_THEME_DARK = g.blendColor(COLOR_BLACK, COLOR_THEME, 0.5);
  const COLOR_THEME_DARKEST = g.blendColor(COLOR_BLACK, COLOR_THEME, 0.75);
  const WALL_SHADES = [
    COLOR_THEME_LIGHT,
    COLOR_THEME,
    COLOR_THEME_DARK,
    COLOR_THEME_DARKEST,
  ];

  // Player, enemies, and game state
  let player = { x: 2.5 * TILE_SIZE, y: 2.5 * TILE_SIZE, angleIdx: 0 };
  let turning = false;
  let buttonHandlerInterval;

  // Mapping
  // 8x8
  const MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ];
  const SIN_TABLE = new Float32Array(ANGLE_STEPS);
  const COS_TABLE = new Float32Array(ANGLE_STEPS);
  for (let i = 0; i < ANGLE_STEPS; i++) {
    const rad = (i / ANGLE_STEPS) * 2 * Math.PI;
    SIN_TABLE[i] = Math.sin(rad);
    COS_TABLE[i] = Math.cos(rad);
  }

  const RAY_DIRS_X = Array(ANGLE_STEPS);
  const RAY_DIRS_Y = Array(ANGLE_STEPS);
  for (let a = 0; a < ANGLE_STEPS; a++) {
    const baseAngle = (a / ANGLE_STEPS) * 2 * Math.PI;
    RAY_DIRS_X[a] = new Float32Array(NUM_COLS);
    RAY_DIRS_Y[a] = new Float32Array(NUM_COLS);
    for (let c = 0; c < NUM_COLS; c++) {
      const colAngle = baseAngle - FOV / 2 + (c / NUM_COLS) * FOV;
      RAY_DIRS_X[a][c] = Math.cos(colAngle);
      RAY_DIRS_Y[a][c] = Math.sin(colAngle);
    }
  }

  // Controls
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';

  // Weapons
  const BULLET_PADDING = 2;
  const BULLET_RELOAD_MS = 2378; // Reload sound duration
  const BULLET_SIZE = 8;
  const MAX_BULLETS = 12;
  const PISTOL_FRAMES = [loadImage(PATH_PISTOL_0), loadImage(PATH_PISTOL_1)];
  const SHOOT_ANIM_MS = 60;
  let bullets = MAX_BULLETS;
  let pistolFrame = 0;
  let reloading = false;
  let shooting = false;

  function castRay(dx, dy) {
    let x = player.x;
    let y = player.y;
    for (let i = 0; i < MAX_RAY_STEPS; i++) {
      x += dx * STEP_SIZE;
      y += dy * STEP_SIZE;
      const mx = (x / TILE_SIZE) | 0;
      const my = (y / TILE_SIZE) | 0;
      if (MAP[my] && MAP[my][mx] === 1) return (i + 1) * STEP_SIZE;
    }
    return MAX_RAY_STEPS * STEP_SIZE;
  }

  function drawRemainingBullets() {
    const LEFT_PADDING = 80;
    const BOTTOM_PADDING = 10;
    const BULLET_Y = SCREEN_HEIGHT - BULLET_SIZE - BOTTOM_PADDING;

    // Clear
    g.setColor(COLOR_BLACK);
    g.fillRect(
      LEFT_PADDING - 2,
      BULLET_Y - 2,
      LEFT_PADDING + MAX_BULLETS * (BULLET_SIZE + BULLET_PADDING) + 2,
      SCREEN_HEIGHT,
    );

    // Draw
    for (let i = 0; i < MAX_BULLETS; i++) {
      const x = LEFT_PADDING + i * (BULLET_SIZE + BULLET_PADDING);
      g.setColor(i < bullets ? COLOR_THEME : COLOR_BLACK);
      g.fillRect(x, BULLET_Y, x + BULLET_SIZE, BULLET_Y + BULLET_SIZE);
    }
  }

  function drawFrame() {
    const dirsX = RAY_DIRS_X[player.angleIdx];
    const dirsY = RAY_DIRS_Y[player.angleIdx];

    for (let c = 0; c < NUM_COLS; c++) {
      const x1 = VIEW_X + c * COLUMN_WIDTH;
      const x2 = x1 + COLUMN_WIDTH - 1;

      const dist = castRay(dirsX[c], dirsY[c]);
      let wallHeight = (HALF_VIEW_H * TILE_SIZE) / dist;
      if (wallHeight > VIEW_H) wallHeight = VIEW_H;

      const y1 = VIEW_Y + HALF_VIEW_H - (wallHeight >> 1);
      const y2 = y1 + wallHeight;

      const shadeIdx = Math.min(
        WALL_SHADES.length - 1,
        Math.floor(dist / ((MAX_RAY_STEPS * STEP_SIZE) / WALL_SHADES.length)),
      );

      g.setColor(COLOR_BLACK).fillRect(x1, VIEW_Y, x2, y1 - 1);
      g.setColor(WALL_SHADES[shadeIdx]).fillRect(x1, y1, x2, y2);
      g.setColor(COLOR_BLACK).fillRect(x1, y2 + 1, x2, VIEW_Y + VIEW_H);
    }

    drawPistol();
    drawRemainingBullets();
  }

  function drawPistol() {
    const frame = PISTOL_FRAMES[pistolFrame];
    const scale = 2.5;

    const scaledW = frame.width * scale;
    const scaledH = frame.height * scale;

    const px = (SCREEN_WIDTH - scaledW) >> 1;
    const py = SCREEN_HEIGHT - scaledH - 4 + (shooting ? 3 : 0);

    // Clear
    g.setColor(COLOR_BLACK).fillRect(px, py, px + scaledW, py + scaledH);

    // Draw
    g.setColor(COLOR_THEME);
    g.drawImage(frame, px, py, { scale: scale });
  }

  function handleTurn(dir) {
    if (dir !== 0) {
      if (turning) return;
      turning = true;
      player.angleIdx = (player.angleIdx + dir + ANGLE_STEPS) % ANGLE_STEPS;
      Pip.audioStart(PATH_FOOTSTEP_2);
      drawFrame();
      setTimeout(() => (turning = false), 120);
    } else {
      shoot();
    }
  }

  function loadImage(path) {
    try {
      let file = fs.readFile(path);
      let data = JSON.parse(file);
      return {
        bpp: data.bpp,
        buffer: atob(data.buffer),
        height: data.height,
        transparent: data.transparent,
        width: data.width,
      };
    } catch (e) {
      // Failed to load image
      console.log(path, e);
      return null;
    }
  }

  function move(dir) {
    const nx = player.x + COS_TABLE[player.angleIdx] * MOVE_SPEED * dir;
    const ny = player.y + SIN_TABLE[player.angleIdx] * MOVE_SPEED * dir;
    const mx = (ny / TILE_SIZE) | 0;
    const my = (nx / TILE_SIZE) | 0;

    if (!MAP[mx][my]) {
      player.x = nx;
      player.y = ny;
    } else {
      Pip.audioStop();
      Pip.audioStart(PATH_WALL_HIT);
    }

    drawFrame();
  }

  function reloadBullets() {
    if (reloading) {
      return;
    }

    reloading = true;
    Pip.audioStop();
    Pip.audioStart(PATH_RELOAD);

    // Clear
    drawRemainingBullets();

    // Simulate reloading time
    setTimeout(() => {
      bullets = MAX_BULLETS;
      reloading = false;
      drawRemainingBullets();
    }, BULLET_RELOAD_MS);
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
  }

  function shoot() {
    if (shooting || reloading) {
      return;
    }

    if (bullets <= 0) {
      // Empty, reload
      reloadBullets();
      return;
    }

    // Fire
    bullets--;
    drawRemainingBullets();

    Pip.audioStop();
    Pip.audioStart(PATH_SHOOT);

    shooting = true;
    pistolFrame = 1;
    drawFrame();

    setTimeout(() => {
      pistolFrame = 0;
      shooting = false;
      drawFrame();
    }, SHOOT_ANIM_MS);
  }

  self.run = function () {
    drawFrame();
    removeListeners();
    Pip.on(KNOB_LEFT, handleTurn);
    Pip.on(KNOB_RIGHT, handleTurn);

    buttonHandlerInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        Pip.audioStart(PATH_FOOTSTEP_1);
        move(1);
      }
    }, 120);

    setWatch(
      () => {
        if (buttonHandlerInterval) {
          clearInterval(buttonHandlerInterval);
          buttonHandlerInterval = null;
        }
        removeListeners();
        E.reboot();
      },
      BTN_POWER,
      { debounce: 50, edge: 'rising', repeat: true },
    );
  };

  return self;
}

PipDoom().run();
