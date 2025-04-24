// =============================================================================
// Name: Vault Breaker
// License: CC-BY-NC-4.0
// Repository: https://github.com/CodyTolene/pip-apps
// Description: A breakout clone for the Pip-Boy 3000 Mk V.
// Version: 1.0.0
// =============================================================================

const themeSettingsFolder = 'USER/ThemePicker';
const themeSettingsFile = 'USER/ThemePicker/theme.json';
const screenWidth = g.getWidth();
const screenHeight = g.getHeight();
const leftWall = 60;
const rightWall = 420;
const gameSpeed = 80;
const paddleWidth = 30;
const paddleY = 290;
const ballRad = 5;
const brickWidth = 40;
const brickHeight = 20;
const brickGap = 5;

const bricks = [];
let theme = [0, 1, 0];

let paddleX = 240,
  ballX = 240,
  ballY = 270,
  ballSpeed = 15,
  velX = 0,
  velY = 0,
  velYsquared = 0,
  perX = 0,
  brickColor = 0,
  lives = 3,
  level = 0,
  sysColor = 0,
  integer = 0,
  perCol = 0,
  hex = '',
  moved = false,
  begun = false;

const level1 = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [4, 4, 4, 4, 4, 4, 4, 4],
  [2, 2, 2, 2, 2, 2, 2, 2],
  [4, 4, 4, 4, 4, 4, 4, 4],
  [3, 3, 3, 3, 3, 3, 3, 3],
];
const level2 = [
  [4, 1, 1, 4, 4, 1, 1, 4],
  [4, 1, 1, 1, 1, 1, 1, 4],
  [4, 4, 4, 4, 4, 4, 4, 4],
  [3, 3, 3, 3, 3, 3, 3, 3],
  [3, 3, 3, 3, 3, 3, 3, 3],
];
const level3 = [
  [4, 2, 2, 2, 2, 2, 2, 4],
  [3, 0, 0, 0, 0, 0, 0, 3],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [4, 3, 3, 3, 3, 3, 3, 4],
];
const level4 = [
  [4, 2, 4, 2, 4, 2, 4, 2],
  [2, 4, 2, 4, 2, 4, 2, 4],
  [4, 2, 4, 2, 4, 2, 4, 2],
  [2, 4, 2, 4, 2, 4, 2, 4],
  [4, 2, 4, 2, 4, 2, 4, 2],
];
const level5 = [
  [4, 1, 1, 1, 1, 1, 1, 4],
  [1, 1, 4, 1, 1, 4, 1, 1],
  [2, 2, 2, 2, 2, 2, 2, 2],
  [4, 4, 0, 4, 4, 0, 4, 4],
  [4, 0, 4, 0, 0, 4, 0, 4],
];
const level6 = [
  [4, 4, 4, 2, 2, 4, 4, 4],
  [1, 1, 1, 4, 4, 1, 1, 1],
  [1, 4, 1, 4, 4, 1, 4, 1],
  [1, 4, 4, 1, 1, 4, 4, 1],
  [4, 4, 4, 1, 1, 4, 4, 4],
  [4, 4, 1, 4, 4, 1, 4, 4],
];
const level7 = [
  [4, 0, 4, 0, 4, 0, 4, 0],
  [0, 4, 0, 4, 0, 4, 0, 4],
  [4, 0, 4, 0, 4, 0, 4, 0],
  [0, 4, 0, 4, 0, 4, 0, 4],
  [4, 0, 4, 0, 4, 0, 4, 0],
];
const level8 = [
  [4, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [2, 2, 4, 4, 4, 4, 1, 1],
  [2, 2, 4, 4, 4, 4, 4, 4],
];
const level9 = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
];

function gameLoop() {
  // clear paddle and ball
  g.setColor('#000');

  if (moved == true) {
    g.fillRect(leftWall, paddleY, rightWall, 300);
    moved = false;
  }

  g.fillCircle(ballX, ballY, ballRad);

  if (begun) {
    // calculate ball's movement
    if (ballY < 0 + ballRad) {
      velY = Math.abs(velY);
      ballY = ballRad;
    } else if (ballY > paddleY - ballRad) {
      if (
        ballX > paddleX - paddleWidth - ballRad &&
        ballX < paddleX + paddleWidth + ballRad
      ) {
        // calculate exit angle
        perX = (ballX - paddleX) / (paddleWidth + 2);
        velX = perX * ballSpeed;
        velYsquared = Math.pow(ballSpeed, 2) - Math.pow(velX, 2);
        velY = Math.sqrt(velYsquared);
        velY = -velY;

        ballY = paddleY - ballRad;

        Pip.audioStart('UI/COLUMN.wav');
      } else {
        g.clear();
        lives -= 1;
        begun = false;
      }
    } else if (ballX < leftWall + ballRad) {
      //bounce off side walls
      velX = Math.abs(velX);
    } else if (ballX > rightWall - ballRad) {
      velX = Math.abs(velX);
      velX = -velX;
    }
  } else {
    // ball still attached to paddle
    ballX = paddleX;
    ballY = paddleY - 10;
    velX = 0;
    velY = 0;
  }

  // move ball
  ballY += velY;
  ballX += velX;

  // draw stuff onto screen
  bricks.forEach(function (brick, i) {
    // check bricks for collision
    if (ballY + ballRad > brick.y && ballY - ballRad < brick.y + brickHeight) {
      if (ballX + ballRad > brick.x && ballX - ballRad < brick.x + brickWidth) {
        brick.hits += 1;
        Pip.audioStart('UI/PREV.wav');
        // ball  has collided with this brick, find which side

        if (ballY - velY <= brick.y || ballY - velY >= brick.y + brickHeight) {
          velY = -velY;
        } else {
          velX = -velX;
        }
      }
    }

    // draw bricks
    if (brick.hits >= 4) {
      g.clear();
      bricks.splice(i, 1);
      return;
    }
    if (brick.hits > 0) {
      brickColor = brick.hits / 5;
    } else if (brick.hits == 0) {
      brickColor = 0;
    }

    g.setColor(
      theme[0] - brickColor,
      theme[1] - brickColor,
      theme[2] - brickColor,
    );
    g.fillRect(brick.x, brick.y, brick.x + brickWidth, brick.y + brickHeight);
  });

  g.setColor(theme[0], theme[1], theme[2]);

  g.drawRect(0, 0, leftWall - 5, 320);
  g.drawRect(rightWall + 5, 0, 480, 320);

  g.drawRect(paddleX - paddleWidth, paddleY, paddleX + paddleWidth, 300);
  g.drawCircle(ballX, ballY, ballRad);

  g.drawString('Lives:' + lives, 100, 20);
  g.drawString('Level:' + level, 380, 20);

  // next level
  if (bricks.length == 0) {
    begun = false;
    level += 1;
    if (level == 2) {
      pushLevel(level2);
    } else if (level == 3) {
      pushLevel(level3);
    } else if (level == 4) {
      pushLevel(level4);
    } else if (level == 5) {
      pushLevel(level5);
    } else if (level == 6) {
      ballSpeed = 18;
      pushLevel(level6);
    } else if (level == 7) {
      pushLevel(level7);
    } else if (level == 8) {
      pushLevel(level8);
    } else if (level == 9) {
      pushLevel(level9);
    } else if (level == 10) {
      stopGame();
    }
  }

  // LOSER!!!
  if (lives < 0) {
    stopGame();
  }

  // bug fix
  if (isNaN(velY)) {
    g.clear();
    lives -= 1;
    begun = false;
  }

  if (BTN_PLAY.read() && begun == false) {
    begun = true;
    velY = -ballSpeed;
  }
}

function initializeGame() {
  g.clear();
  g.setColor(theme[0], theme[1], theme[2]);
  g.setFont('6x8', 1);

  level = 1;
  pushLevel(level1);

  gameLoopInterval = setInterval(gameLoop, gameSpeed);
  gameLoop();
}

function stopGame() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  g.clear();

  if (lives < 0) {
    Pip.typeText('Game Over!').then(() => {
      setTimeout(() => {
        // 3 seconds after that, return to the apps menu
        E.reboot();
      }, 3000);
    });
  } else if (level == 10) {
    Pip.typeText('You Win!').then(() => {
      setTimeout(() => {
        // 3 seconds after that, return to the apps menu
        E.reboot();
      }, 3000);
    });
  } else {
    Pip.typeText('Goodbye!').then(() => {
      setTimeout(() => {
        // 3 seconds after that, return to the apps menu
        E.reboot();
      }, 3000);
    });
  }
}

function getTheme() {
  sysColor = g.getColor();
  sysColor = sysColor.toString(16);

  for (let i = 0; i < 3; i++) {
    hex = sysColor.charAt(i);
    integer = parseInt(hex, 16);
    perCol = integer / 15;
    theme[i] = perCol;
  }

  return;
}

function pushLevel(array) {
  for (let row = 0; row < array.length; row++) {
    for (let col = 0; col < array[row].length; col++) {
      let hit = array[row][col];

      bricks.push({
        x: leftWall + (brickWidth + brickGap) * col,
        y: 40 + (brickHeight + brickGap) * row,
        hits: hit,
      });
    }
  }
}

function handleKnob1(dir) {
  if (dir == 0 && begun == false) {
    begun = true;
    velY = -ballSpeed;
  }
}

function handleKnob2(dir) {
  // move paddle
  paddleX += dir * 10;
  if (paddleX - paddleWidth < leftWall) {
    paddleX = leftWall + paddleWidth;
  } else if (paddleX + paddleWidth > rightWall) {
    paddleX = rightWall - paddleWidth;
  }

  if (dir != 0) {
    moved = true;
  }
}

function handleTorch() {
  stopGame();
}

getTheme();

g.clear();

Pip.typeText(
  'Welcome to Vault Breaker!\nYou have 3 lives to beat 9 levels.',
).then(() =>
  setTimeout(() => {
    Pip.typeText(
      'Press the radio knob to launch the ball.\nControl the paddle with the top-right knob.\nPress the torch button to exit. Good luck.',
    ).then(() =>
      setTimeout(() => {
        initializeGame();
      }, 3000),
    );
  }, 2000),
);

Pip.on('knob1', handleKnob1);
Pip.on('knob2', handleKnob2);
Pip.on('torch', handleTorch);
