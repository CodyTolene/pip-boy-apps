// =============================================================================
//  Name: Pip-Snake
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A simple snake game for the Pip-Boy 3000 Mk V.
//  Version: 1.0.0
// =============================================================================

const SCREEN_WIDTH = g.getWidth();
const SCREEN_HEIGHT = g.getHeight();
const TILE_SIZE = 16;
const GRID_WIDTH = Math.floor(SCREEN_WIDTH / TILE_SIZE);
const GRID_HEIGHT = Math.floor(SCREEN_HEIGHT / TILE_SIZE);
const GAME_SPEED = 200;
const PADDING_X = 3;
const PADDING_Y = 0;
const COLOR_GREEN = '#0F0';
const COLOR_RED = '#F00';
const DIRECTIONS = [
  { x: 1, y: 0 }, // Right
  { x: 0, y: 1 }, // Down
  { x: -1, y: 0 }, // Left
  { x: 0, y: -1 }, // Up
];

var snake,
  directionIndex,
  food,
  gameOver,
  gameLoopInterval,
  score = 0;

function stopGame() {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
  }

  gameOver = true;
  g.clear();
  g.setColor(COLOR_RED);

  g.setFont('6x8', 4);
  g.drawString('GAME HALTED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 30);

  g.setFont('6x8', 2);
  g.drawString(
    'Press torch button again',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 10,
  );
  g.drawString(
    'to restart the device.',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 30,
  );

  console.log('GAME HALTED');

  const waitLoop = setInterval(() => {
    if (BTN_TORCH.read()) {
      clearInterval(waitLoop);
      E.reboot();
    }
  }, 100);
}

function resetGame() {
  snake = [{ x: 5, y: 5 }];
  directionIndex = 0; // Start as moving right
  food = { x: 8, y: 5 };
  gameOver = false;
  score = 0;

  spawnFood();
  g.clear();
  drawCell(food.x, food.y, COLOR_RED); // Initial food
  drawScore(); // Initial score
  snake.forEach(
    (
      segment, // Initial snake
    ) => drawCell(segment.x, segment.y, COLOR_GREEN),
  );

  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
  }
  gameLoopInterval = setInterval(gameLoop, GAME_SPEED);
}

function spawnFood() {
  var newX, newY, collision;

  do {
    newX = Math.floor(Math.random() * (GRID_WIDTH - PADDING_X * 2)) + PADDING_X;
    newY =
      Math.floor(Math.random() * (GRID_HEIGHT - PADDING_Y * 2)) + PADDING_Y;
    collision = snake.some(
      (segment) => segment.x === newX && segment.y === newY,
    );
  } while (collision);

  food.x = newX;
  food.y = newY;
}

function drawCell(x, y, color) {
  g.setColor(color);

  const px = x * TILE_SIZE + PADDING_X;
  const py = y * TILE_SIZE + PADDING_Y;

  g.fillRect(px, py, px + TILE_SIZE - 1, py + TILE_SIZE - 1);
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

function updateSnake() {
  if (gameOver) return;

  var head = {
    x: snake[0].x + DIRECTIONS[directionIndex].x,
    y: snake[0].y + DIRECTIONS[directionIndex].y,
  };

  // Wrap around screen
  if (head.x < PADDING_X) head.x = GRID_WIDTH - 1 - PADDING_X;
  if (head.x >= GRID_WIDTH - PADDING_X) head.x = PADDING_X;
  if (head.y < PADDING_Y) head.y = GRID_HEIGHT - 1 - PADDING_Y;
  if (head.y >= GRID_HEIGHT - PADDING_Y) head.y = PADDING_Y;

  const hasCollided = snake.some(
    (segment) => segment.x === head.x && segment.y === head.y,
  );
  if (hasCollided) {
    gameOver = true;
    g.clear();

    g.setColor(COLOR_GREEN);
    g.setFont('6x8', 4);
    g.drawString('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 30);

    g.setFont('6x8', 2);
    g.drawString(
      'Press tuner-play to restart',
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT / 2 + 10,
    );

    return;
  }

  // Move snake
  snake.unshift(head);

  const isFoodEaten = head.x === food.x && head.y === food.y;
  if (isFoodEaten) {
    score++;
    spawnFood();
  } else {
    // Clear old tail position
    const tail = snake.pop();
    drawCell(tail.x, tail.y, '#000');
  }

  drawCell(head.x, head.y, COLOR_GREEN);
  drawCell(food.x, food.y, COLOR_RED);
  drawScore();
}

function handleInput() {
  if (BTN_TUNEDOWN.read()) {
    // Turn left
    directionIndex = (directionIndex + 3) % 4;
  } else if (BTN_TUNEUP.read()) {
    // Turn right
    directionIndex = (directionIndex + 1) % 4;
  } else if (BTN_TORCH.read()) {
    stopGame();
  } else if (BTN_PLAY.read()) {
    resetGame();
  }
}

function gameLoop() {
  handleInput();
  updateSnake();
}

function initializeGame() {
  g.clear();

  g.setColor(COLOR_GREEN);
  g.setFont('6x8', 4);
  g.drawString('PIP-SNAKE', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100);

  g.setFont('6x8', 2);
  g.drawString(
    'Control a Pip-Snake, eat food',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 60,
  );

  g.drawString(
    'Grow as big as you can!',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 40,
  );

  g.setFont('6x8', 2);
  g.setColor(COLOR_RED);
  g.drawString(
    'But dont eat yourself!',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 20,
  );

  g.setColor(COLOR_GREEN);
  g.drawString(
    'Tip: Hitting edges wraps around',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2,
  );

  g.drawString(
    'Use tuner-up/down to turn',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 20,
  );

  g.drawString(
    'Torch: Quit | Tuner-play: Restart',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 40,
  );

  g.drawString(
    'Press tuner-play to START',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 80,
  );

  const waitLoop = setInterval(() => {
    if (BTN_PLAY.read()) {
      clearInterval(waitLoop);
      resetGame();
    }
  }, 100);
}

initializeGame();
