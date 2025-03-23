// =============================================================================
//  Name: Pip-Pong
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A simple pong game for the Pip-Boy 3000 Mk V.
//  Version: 1.0.0
// =============================================================================

const SCREEN_WIDTH = g.getWidth();
const SCREEN_HEIGHT = g.getHeight();
const TILE_SIZE = 8;
const PADDLE_HEIGHT = 5;
const PADDLE_WIDTH = 4;
const BALL_SIZE = 1;
const GAME_SPEED = 100;
const COLOR_GREEN = '#0F0';
const COLOR_RED = '#F00';
const COLOR_BLACK = '#000';
const COLOR_WHITE = '#FFF';

const GRID_WIDTH = Math.floor(SCREEN_WIDTH / TILE_SIZE);
const GRID_HEIGHT = Math.floor(SCREEN_HEIGHT / TILE_SIZE);

let ball,
  playerPaddle,
  aiPaddle,
  ballVelocity,
  gameLoopInterval,
  inputInterval,
  gameOver = false,
  playerScore = 0;

function drawRect(x, y, w, h, color) {
  g.setColor(color);
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  g.fillRect(px, py, px + w * TILE_SIZE - 1, py + h * TILE_SIZE - 1);
}

function resetBall() {
  ball = {
    x: Math.floor(GRID_WIDTH / 2),
    y: Math.floor(GRID_HEIGHT / 2),
  };
  const dx = Math.random() > 0.5 ? 1 : -1;
  const dy = Math.random() > 0.5 ? 1 : -1;
  ballVelocity = { x: dx, y: dy };
}

function resetGame() {
  g.clear();
  playerScore = 0;
  gameOver = false;

  playerPaddle = {
    x: 4,
    y: Math.floor(GRID_HEIGHT / 2) - Math.floor(PADDLE_HEIGHT / 2),
  };

  aiPaddle = {
    x: GRID_WIDTH - 8,
    y: Math.floor(GRID_HEIGHT / 2) - Math.floor(PADDLE_HEIGHT / 2),
  };

  resetBall();
  drawScene();

  if (gameLoopInterval) clearInterval(gameLoopInterval);
  gameLoopInterval = setInterval(gameLoop, GAME_SPEED);
}

function drawScene() {
  g.clear();
  drawPaddle(playerPaddle, COLOR_WHITE);
  drawPaddle(aiPaddle, COLOR_WHITE);
  drawBall();
  drawScore();
}

function drawPaddle(paddle, color) {
  drawRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT, color);
}

function drawBall() {
  drawRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE, COLOR_RED);
}

function drawScore() {
  const fixedWidth = 120;
  const rectX = (SCREEN_WIDTH - fixedWidth) / 2;
  const rectY = SCREEN_HEIGHT - 26;
  g.clearRect(rectX, rectY, rectX + fixedWidth, SCREEN_HEIGHT);
  g.setColor(COLOR_GREEN);
  g.setFont('6x8', 2);
  g.drawString('Score: ' + playerScore, SCREEN_WIDTH / 2, SCREEN_HEIGHT - 20);
}

function moveBall() {
  drawRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE, COLOR_BLACK);

  ball.x += ballVelocity.x;
  ball.y += ballVelocity.y;

  if (ball.y <= 0 || ball.y >= GRID_HEIGHT - 1) {
    ballVelocity.y *= -1;
    ball.y = E.clip(ball.y, 0, GRID_HEIGHT - 1);
  }

  if (
    ball.x >= playerPaddle.x &&
    ball.x < playerPaddle.x + PADDLE_WIDTH &&
    ball.y >= playerPaddle.y &&
    ball.y < playerPaddle.y + PADDLE_HEIGHT
  ) {
    ballVelocity.x = 1;
    playerScore++;
    drawScore();
  } else if (
    ball.x >= aiPaddle.x - BALL_SIZE + 1 &&
    ball.x < aiPaddle.x + PADDLE_WIDTH &&
    ball.y >= aiPaddle.y &&
    ball.y < aiPaddle.y + PADDLE_HEIGHT
  ) {
    ballVelocity.x = -1;
  }

  if (ball.x < 0 || ball.x >= GRID_WIDTH) {
    gameOver = true;
    endGame();
    return;
  }

  drawBall();
}

function moveAI() {
  drawPaddle(aiPaddle, COLOR_BLACK);

  if (ball.y > aiPaddle.y + 1) {
    aiPaddle.y = Math.min(GRID_HEIGHT - PADDLE_HEIGHT, aiPaddle.y + 1);
  } else if (ball.y < aiPaddle.y) {
    aiPaddle.y = Math.max(0, aiPaddle.y - 1);
  }

  drawPaddle(aiPaddle, COLOR_WHITE);
}

function movePlayer(dy) {
  drawRect(
    playerPaddle.x,
    playerPaddle.y,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    COLOR_BLACK,
  );
  playerPaddle.y += dy;
  playerPaddle.y = E.clip(playerPaddle.y, 0, GRID_HEIGHT - PADDLE_HEIGHT);
  drawPaddle(playerPaddle, COLOR_WHITE);
}

function handleInput() {
  if (BTN_TUNEUP.read()) {
    movePlayer(-1);
  } else if (BTN_TUNEDOWN.read()) {
    movePlayer(1);
  } else if (BTN_TORCH.read()) {
    stopGame();
  }
}

function gameLoop() {
  if (gameOver) return;
  handleInput();
  moveAI();
  moveBall();
}

function endGame() {
  clearInterval(gameLoopInterval);
  g.clear();
  g.setColor(COLOR_GREEN);
  g.setFont('6x8', 4);
  g.drawString('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 30);
  g.setFont('6x8', 2);
  g.drawString('Score: ' + playerScore, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
  g.drawString(
    'Press tuner-play to restart',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 30,
  );

  inputInterval = setInterval(() => {
    if (BTN_PLAY.read()) {
      clearInterval(inputInterval);
      resetGame();
    }
  }, 100);
}

function stopGame() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  if (inputInterval) clearInterval(inputInterval);

  gameOver = true;
  g.clear();

  g.setColor(COLOR_RED);
  g.setFont('6x8', 4);
  g.drawString('GAME HALTED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 30);
  g.setFont('6x8', 2);
  g.drawString(
    'Press torch again to reboot',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 10,
  );

  const waitLoop = setInterval(() => {
    if (BTN_TORCH.read()) {
      clearInterval(waitLoop);
      E.reboot();
    }
  }, 100);
}

function initializeGame() {
  g.clear();
  g.setColor(COLOR_GREEN);
  g.setFont('6x8', 4);
  g.drawString('PIP-PONG', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 80);

  g.setFont('6x8', 2);
  g.drawString(
    'Use tuner-up/down to move',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 40,
  );
  g.drawString(
    'Torch: Quit | Tuner-play: Start',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 10,
  );

  g.setColor(COLOR_RED);
  g.drawString(
    "Don't let the ball pass!",
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 20,
  );

  g.setColor(COLOR_GREEN);
  g.drawString(
    'Press tuner-play to START',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 50,
  );

  const waitLoop = setInterval(() => {
    if (BTN_PLAY.read()) {
      clearInterval(waitLoop);
      resetGame();
    }
  }, 100);
}

initializeGame();
