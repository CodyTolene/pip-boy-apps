function PipDoom() {
  const self = {};

  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();

  const VIEW_W = 256,
    VIEW_H = 192;
  const VIEW_X = (SCREEN_WIDTH - VIEW_W) >> 1;
  const VIEW_Y = (SCREEN_HEIGHT - VIEW_H) >> 1;
  const HALF_VIEW_H = VIEW_H >> 1;
  const COLUMN_WIDTH = 32;
  const NUM_COLS = (VIEW_W / COLUMN_WIDTH) | 0;

  const FOV = Math.PI / 3;
  const ANGLE_STEPS = 16;
  const TILE_SIZE = 64;
  const STEP_SIZE = 4;
  const MAX_RAY_STEPS = 64;
  const MOVE_SPEED = 12;

  const COLOR_BLACK = '#000000';
  const COLOR_THEME = g.theme.fg || '#00FF00';
  const COLOR_THEME_LIGHT = g.blendColor(COLOR_THEME, '#FFFFFF', 0.3);
  const COLOR_THEME_DARK = g.blendColor(COLOR_BLACK, COLOR_THEME, 0.5);
  const COLOR_THEME_DARKEST = g.blendColor(COLOR_BLACK, COLOR_THEME, 0.75);

  const wallShades = [
    COLOR_THEME_LIGHT,
    COLOR_THEME,
    COLOR_THEME_DARK,
    COLOR_THEME_DARKEST,
  ];

  let player = { x: 2.5 * TILE_SIZE, y: 2.5 * TILE_SIZE, angleIdx: 0 };

  // 8x8 map
  const map = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ];

  const sinTable = new Float32Array(ANGLE_STEPS);
  const cosTable = new Float32Array(ANGLE_STEPS);
  for (let i = 0; i < ANGLE_STEPS; i++) {
    const rad = (i / ANGLE_STEPS) * 2 * Math.PI;
    sinTable[i] = Math.sin(rad);
    cosTable[i] = Math.cos(rad);
  }

  const rayDirsX = Array(ANGLE_STEPS);
  const rayDirsY = Array(ANGLE_STEPS);
  for (let a = 0; a < ANGLE_STEPS; a++) {
    const baseAngle = (a / ANGLE_STEPS) * 2 * Math.PI;
    rayDirsX[a] = new Float32Array(NUM_COLS);
    rayDirsY[a] = new Float32Array(NUM_COLS);
    for (let c = 0; c < NUM_COLS; c++) {
      const colAngle = baseAngle - FOV / 2 + (c / NUM_COLS) * FOV;
      rayDirsX[a][c] = Math.cos(colAngle);
      rayDirsY[a][c] = Math.sin(colAngle);
    }
  }

  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';

  let turning = false;
  let buttonHandlerInterval;
  let shooting = false;
  let pistolFrame = 0;

  // Asset files
  const IMG_PISTOL_0 = 'USER/PIP_DOOM/pistol_0.json';
  const IMG_PISTOL_1 = 'USER/PIP_DOOM/pistol_1.json';
  const SND_FOOTSTEP_1 = 'USER/PIP_DOOM/F_STEP.wav';
  const SND_FOOTSTEP_2 = 'USER/PIP_DOOM/F_STEP_2.wav';
  const SND_WALL_HIT = 'USER/PIP_DOOM/OOF.wav';

  // Pistol
  const pistolFrames = [loadImage(IMG_PISTOL_0), loadImage(IMG_PISTOL_1)];

  function castRay(dx, dy) {
    let x = player.x,
      y = player.y;
    for (let i = 0; i < MAX_RAY_STEPS; i++) {
      x += dx * STEP_SIZE;
      y += dy * STEP_SIZE;
      const mx = (x / TILE_SIZE) | 0;
      const my = (y / TILE_SIZE) | 0;
      if (map[my] && map[my][mx] === 1) return (i + 1) * STEP_SIZE;
    }
    return MAX_RAY_STEPS * STEP_SIZE;
  }

  function drawFrame() {
    const dirsX = rayDirsX[player.angleIdx];
    const dirsY = rayDirsY[player.angleIdx];

    for (let c = 0; c < NUM_COLS; c++) {
      const x1 = VIEW_X + c * COLUMN_WIDTH;
      const x2 = x1 + COLUMN_WIDTH - 1;

      const dist = castRay(dirsX[c], dirsY[c]);
      let wallHeight = (HALF_VIEW_H * TILE_SIZE) / dist;
      if (wallHeight > VIEW_H) wallHeight = VIEW_H;

      const y1 = VIEW_Y + HALF_VIEW_H - (wallHeight >> 1);
      const y2 = y1 + wallHeight;

      const shadeIdx = Math.min(
        wallShades.length - 1,
        Math.floor(dist / ((MAX_RAY_STEPS * STEP_SIZE) / wallShades.length)),
      );

      g.setColor(COLOR_BLACK).fillRect(x1, VIEW_Y, x2, y1 - 1);
      g.setColor(wallShades[shadeIdx]).fillRect(x1, y1, x2, y2);
      g.setColor(COLOR_BLACK).fillRect(x1, y2 + 1, x2, VIEW_Y + VIEW_H);
    }

    drawPistol();
  }

  function drawPistol() {
    const frame = pistolFrames[pistolFrame];
    const scale = 2.5;

    const scaledW = frame.width * scale;
    const scaledH = frame.height * scale;

    // Bottom center position
    const px = (SCREEN_WIDTH - scaledW) >> 1;
    const py = SCREEN_HEIGHT - scaledH - 4 + (shooting ? 3 : 0);

    // Clear the old frame area
    g.setColor(COLOR_BLACK).fillRect(px, py, px + scaledW, py + scaledH);

    // Draw scaled frame
    g.setColor(COLOR_THEME);
    g.drawImage(frame, px, py, { scale: scale });
  }

  function handleTurn(dir) {
    if (dir !== 0) {
      if (turning) return;
      turning = true;
      player.angleIdx = (player.angleIdx + dir + ANGLE_STEPS) % ANGLE_STEPS;
      Pip.audioStart(SND_FOOTSTEP_2);
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
    const nx = player.x + cosTable[player.angleIdx] * MOVE_SPEED * dir;
    const ny = player.y + sinTable[player.angleIdx] * MOVE_SPEED * dir;
    const mx = (ny / TILE_SIZE) | 0;
    const my = (nx / TILE_SIZE) | 0;

    if (!map[mx][my]) {
      player.x = nx;
      player.y = ny;
    } else {
      Pip.audioStop();
      Pip.audioStart(SND_WALL_HIT);
    }

    drawFrame();
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
  }

  function shoot() {
    if (shooting) {
      return;
    }

    Pip.audioStop();
    Pip.audioStart('USER/PIP_DOOM/SHOOT.wav');

    shooting = true;
    pistolFrame = 1;
    drawFrame();

    setTimeout(() => {
      pistolFrame = 0;
      shooting = false;
      drawFrame();
    }, 60);
  }

  self.run = function () {
    drawFrame();
    removeListeners();
    Pip.on(KNOB_LEFT, handleTurn);
    Pip.on(KNOB_RIGHT, handleTurn);

    buttonHandlerInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        Pip.audioStart(SND_FOOTSTEP_1);
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
