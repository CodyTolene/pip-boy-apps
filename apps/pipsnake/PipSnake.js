// =============================================================================
//  Name: Pip-Snake
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function PipSnake() {
  const self = {};

  const GAME_NAME = 'Pip-Snake';
  const GAME_VERSION = '1.2.1';

  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();

  const TILE_SIZE = 16;
  const GRID_WIDTH = Math.floor(SCREEN_WIDTH / TILE_SIZE);
  const GRID_HEIGHT = Math.floor(SCREEN_HEIGHT / TILE_SIZE);

  const PADDING_X = 3;
  const PADDING_Y = 0;
  const GAME_SPEED = 200;

  const COLOR_GREEN = '#0F0';
  const COLOR_RED = '#F00';
  const COLOR_WHITE = '#FFF';

  const DIRECTIONS = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ];

  let snake = 0;
  let directionIndex = 0;
  let food = 0;
  let gameOver = 0;
  let gameLoopInterval = 0;
  let score = 0;

  function adjustBrightness() {
    const brightnessLevels = [1, 5, 10, 15, 20];
    const currentIndex = brightnessLevels.findIndex(
      (level) => level === Pip.brightness,
    );
    const nextIndex = (currentIndex + 1) % brightnessLevels.length;
    Pip.brightness = brightnessLevels[nextIndex];
    Pip.updateBrightness();
  }

  function drawCell(x, y, color) {
    g.setColor(color);
    const px = x * TILE_SIZE + PADDING_X;
    const py = y * TILE_SIZE + PADDING_Y;
    g.fillRect(px, py, px + TILE_SIZE - 1, py + TILE_SIZE - 1);
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

  function drawScore() {
    const fixedWidth = 120;
    const rectX = (SCREEN_WIDTH - fixedWidth) / 2;
    const rectY = SCREEN_HEIGHT - 26;
    g.clearRect(rectX, rectY, rectX + fixedWidth, SCREEN_HEIGHT);
    g.setColor(COLOR_GREEN);
    g.setFont('6x8', 2);
    g.drawString('Score: ' + score, SCREEN_WIDTH / 2, SCREEN_HEIGHT - 20);
  }

  function gameLoop() {
    handleInput();
    updateSnake();
  }

  function handleInput() {
    if (BTN_TUNEDOWN.read()) {
      directionIndex = (directionIndex + 3) % 4;
    } else if (BTN_TUNEUP.read()) {
      directionIndex = (directionIndex + 1) % 4;
    } else if (BTN_PLAY.read()) {
      resetGame();
    }
  }

  function resetGame() {
    snake = [{ x: 5, y: 5 }];
    directionIndex = 0;
    food = { x: 8, y: 5 };
    gameOver = false;
    score = 0;
    spawnFood();
    g.clear();
    drawCell(food.x, food.y, COLOR_RED);
    drawScore();
    snake.forEach((segment) => drawCell(segment.x, segment.y, COLOR_GREEN));
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, GAME_SPEED);
  }

  function spawnFood() {
    let newX, newY, collision;
    do {
      newX =
        Math.floor(Math.random() * (GRID_WIDTH - PADDING_X * 2)) + PADDING_X;
      newY =
        Math.floor(Math.random() * (GRID_HEIGHT - PADDING_Y * 2)) + PADDING_Y;
      collision = snake.some(
        (segment) => segment.x === newX && segment.y === newY,
      );
    } while (collision);
    food.x = newX;
    food.y = newY;
  }

  function stopGame() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameOver = true;
    g.clear();
    E.reboot();
  }

  function updateSnake() {
    if (gameOver) return;
    const head = {
      x: snake[0].x + DIRECTIONS[directionIndex].x,
      y: snake[0].y + DIRECTIONS[directionIndex].y,
    };
    if (head.x < PADDING_X) head.x = GRID_WIDTH - 1 - PADDING_X;
    if (head.x >= GRID_WIDTH - PADDING_X) head.x = PADDING_X;
    if (head.y < PADDING_Y) head.y = GRID_HEIGHT - 1 - PADDING_Y;
    if (head.y >= GRID_HEIGHT - PADDING_Y) head.y = PADDING_Y;

    if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      gameOver = true;
      g.clear();
      g.setColor(COLOR_GREEN);
      g.setFont('6x8', 4);
      g.drawString('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 30);
      g.setColor(COLOR_WHITE);
      g.setFont('6x8', 2);
      g.drawString(
        'Press  to restart',
        SCREEN_WIDTH / 2,
        SCREEN_HEIGHT / 2 + 10,
      );
      drawGearIcon(SCREEN_WIDTH / 2 - 31, SCREEN_HEIGHT / 2 + 10, 1.5);
      return;
    }

    snake.unshift(head);
    const isFoodEaten = head.x === food.x && head.y === food.y;
    if (isFoodEaten) {
      score++;
      spawnFood();
    } else {
      const tail = snake.pop();
      drawCell(tail.x, tail.y, '#000');
    }

    drawCell(head.x, head.y, COLOR_GREEN);
    drawCell(food.x, food.y, COLOR_RED);
    drawScore();
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
        resetGame();
      }
    }, 100);

    Pip.removeAllListeners('knob1');
    Pip.on('knob1', function (dir) {
      if (gameOver && dir === 0) return resetGame();
      if (dir < 0) directionIndex = (directionIndex + 3) % 4;
      else if (dir > 0) directionIndex = (directionIndex + 1) % 4;
    });

    Pip.removeAllListeners('knob2');
    Pip.on('knob2', function (dir) {
      if (gameOver) return;
      if (dir < 0) directionIndex = (directionIndex + 3) % 4;
      else if (dir > 0) directionIndex = (directionIndex + 1) % 4;
    });

    Pip.removeAllListeners('torch');
    Pip.on('torch', function () {
      adjustBrightness();
    });

    setWatch(() => stopGame(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: !0,
    });
  };

  return self;
}

PipSnake().run();
