// =============================================================================
// Name: Wasteland
// License: CC-BY-NC-4.0
// Repository: https://github.com/CodyTolene/pip-apps
// Description: A DOOM inspired RPG engine for the Pip-Boy 3000 Mk V.
// Version: 1.0.0
// =============================================================================

const MAP = [
  '###################',
  '#                 #',
  '#                 #',
  '#   ####   ####   #',
  '#                 #',
  '#        V        #',
  '#                 #',
  '#   ###########   #',
  '#                 #',
  '#                 #',
  '###################',
];

const NUM_RAYS = 13;
const FOV = Math.PI / 3;
const MAX_DEPTH = 8;
const STEP = 0.2;

const PADDING = 150;
const WIDTH = g.getWidth() - PADDING;
const HEIGHT = g.getHeight();
const STRIP_SPACING = Math.floor(WIDTH / NUM_RAYS);
const OFFSET_X = PADDING / 3;

const player = { x: 1, y: 1, angle: 0, speed: 1 };

// Spawn at "V"
for (let j = 0; j < MAP.length; j++) {
  const i = MAP[j].indexOf('V');
  if (i !== -1) {
    player.x = i + 0.5;
    player.y = j + 0.5;
    MAP[j] = MAP[j].substring(0, i) + ' ' + MAP[j].substring(i + 1);
    break;
  }
}

function isWall(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  return MAP[j] && MAP[j][i] === '#';
}

function drawFrame() {
  bC.clear(1);

  for (let i = 0; i < NUM_RAYS; i++) {
    const angleOffset = ((i - NUM_RAYS / 2) / NUM_RAYS) * FOV;
    const rayAngle = player.angle + angleOffset;
    const dx = Math.cos(rayAngle);
    const dy = Math.sin(rayAngle);

    let depth = 0;
    let rx = player.x;
    let ry = player.y;

    while (depth < MAX_DEPTH && !isWall(rx, ry)) {
      rx += dx * STEP;
      ry += dy * STEP;
      depth += STEP;
    }

    const height = Math.min(HEIGHT, HEIGHT / (depth + 0.1));
    const shade = depth < 2 ? 3 : depth < 4 ? 2 : 1;
    const x = OFFSET_X + i * STRIP_SPACING;

    bC.setColor(shade);
    bC.drawLine(x, (HEIGHT - height) / 2, x, (HEIGHT + height) / 2);
  }
  bC.flip();
}

function moveForward() {
  const dx = Math.cos(player.angle);
  const dy = Math.sin(player.angle);
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!isWall(nx, ny)) {
    player.x = nx;
    player.y = ny;
    Pip.audioStart('USER/DoomLite/F_STEP.wav');
    console.log('Moved forward');
  } else {
    Pip.audioStart('USER/DoomLite/OOF.wav');
    console.log('Hit a wall!');
  }

  drawFrame();
}

function moveBackward() {
  const dx = Math.cos(player.angle);
  const dy = Math.sin(player.angle);
  const nx = player.x - dx;
  const ny = player.y - dy;

  if (!isWall(nx, ny)) {
    player.x = nx;
    player.y = ny;
    Pip.audioStart('USER/DoomLite/F_STEP.wav');
    console.log('Moved backward');
  } else {
    Pip.audioStart('USER/DoomLite/OOF.wav');
    console.log('Hit a wall!');
  }

  drawFrame();
}

function rotate(dir) {
  player.angle += (Math.PI / 4) * dir;

  if (player.angle < 0) {
    player.angle += Math.PI * 2;
    console.log('Rotated left');
  } else if (player.angle > Math.PI * 2) {
    player.angle -= Math.PI * 2;
    console.log('Rotated right');
  }

  Pip.audioStart('USER/DoomLite/F_STEP_2.wav');
  drawFrame();
}

Pip.removeAllListeners('knob1');
Pip.on('knob1', function (dir) {
  if (dir === 0) {
    moveBackward();
  } else {
    rotate(dir);
  }
});

Pip.removeAllListeners('knob2');
Pip.on('knob2', function (dir) {
  rotate(dir);
});

const watch = setInterval(() => {
  if (BTN_PLAY.read()) {
    moveForward();
  } else if (BTN_TORCH.read()) {
    clearInterval(watch);
    bC.clear(1).flip();
    E.reboot();
  }
}, 100);

drawFrame();
