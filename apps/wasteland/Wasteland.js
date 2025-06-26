// =============================================================================
// Name: Wasteland
// License: CC-BY-NC-4.0
// Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function Wasteland() {
  const self = {};

  const GAME_NAME = 'Wasteland';
  const GAME_VERSION = '1.2.0';

  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();

  const COLOR_GREEN = '#0F0';
  const COLOR_WHITE = '#FFF';

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

  for (let j = 0; j < MAP.length; j++) {
    const i = MAP[j].indexOf('V');
    if (i !== -1) {
      player.x = i + 0.5;
      player.y = j + 0.5;
      MAP[j] = MAP[j].substring(0, i) + ' ' + MAP[j].substring(i + 1);
      break;
    }
  }

  function drawFrame() {
    bC.clear(1);
    for (let i = 0; i < NUM_RAYS; i++) {
      const angleOffset = ((i - NUM_RAYS / 2) / NUM_RAYS) * FOV;
      const rayAngle = player.angle + angleOffset;
      const dx = Math.cos(rayAngle);
      const dy = Math.sin(rayAngle);
      let depth = 0,
        rx = player.x,
        ry = player.y;
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

  function drawGearIcon(x, y, scale) {
    g.setColor('#FFF');
    const toothLength = 2 * scale;
    const toothOffset = 4 * scale;
    const radius = 3 * scale;
    const hole = 1 * scale;
    const diag = toothOffset * 0.707;
    const f = (dx, dy) =>
      g.fillRect(
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
    g.fillCircle(x, y, radius);
    g.setColor('#000');
    g.fillCircle(x, y, hole);
  }

  function isWall(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    return MAP[j] && MAP[j][i] === '#';
  }

  function moveBackward() {
    const dx = Math.cos(player.angle);
    const dy = Math.sin(player.angle);
    const nx = player.x - dx;
    const ny = player.y - dy;
    if (!isWall(nx, ny)) {
      player.x = nx;
      player.y = ny;
      Pip.audioStart('USER/F_STEP.wav');
    } else {
      Pip.audioStart('USER/OOF.wav');
    }
    drawFrame();
  }

  function moveForward() {
    const dx = Math.cos(player.angle);
    const dy = Math.sin(player.angle);
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (!isWall(nx, ny)) {
      player.x = nx;
      player.y = ny;
      Pip.audioStart('USER/F_STEP.wav');
    } else {
      Pip.audioStart('USER/OOF.wav');
    }
    drawFrame();
  }

  function rotate(dir) {
    player.angle += (Math.PI / 4) * dir;
    if (player.angle < 0) player.angle += Math.PI * 2;
    else if (player.angle > Math.PI * 2) player.angle -= Math.PI * 2;
    Pip.audioStart('USER/F_STEP_2.wav');
    drawFrame();
  }

  self.run = function () {
    g.clear();
    g.setColor(COLOR_GREEN);
    g.setFont('6x8', 4);
    g.drawString(GAME_NAME, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20);
    g.setColor(COLOR_WHITE);
    g.setFont('6x8', 2);
    g.drawString('Press   to START', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 15);
    g.setFont('6x8', 1);
    g.drawString(' v' + GAME_VERSION, SCREEN_WIDTH / 2 - 5, SCREEN_HEIGHT - 20);
    drawGearIcon(SCREEN_WIDTH / 2 - 20, SCREEN_HEIGHT / 2 + 15, 2.5);
    g.setFont('6x8', 1);

    const waitLoop = setInterval(() => {
      if (BTN_PLAY.read()) {
        clearInterval(waitLoop);
        drawFrame();

        Pip.removeAllListeners('knob1');
        Pip.on('knob1', function (dir) {
          if (dir === 0) moveBackward();
          else rotate(dir);
        });

        Pip.removeAllListeners('knob2');
        Pip.on('knob2', function (dir) {
          rotate(dir);
        });

        const watch = setInterval(() => {
          if (BTN_PLAY.read()) moveForward();
          else if (BTN_TORCH.read()) {
            clearInterval(watch);
            bC.clear(1).flip();
            E.reboot();
          }
        }, 100);
      }
    }, 100);
  };

  return self;
}

Wasteland().run();
