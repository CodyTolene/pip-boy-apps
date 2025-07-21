// =============================================================================
//  Name: Piptris
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function Piptris() {
  const self = {};

  // Core
  const GAME_NAME = 'PIPTRIS';
  const GAME_VERSION = '2.5.1';

  // File paths
  const CONFIG_PATH = 'USER/PIPTRIS/piptris.json';
  const GEAR_IMAGE_PATH = 'USER/PIPTRIS/gear.json';
  const NUKE_IMAGE_PATH = 'USER/PIPTRIS/nuke.json';
  const RADIOACTIVE_IMAGE_PATH = 'USER/PIPTRIS/radioactive.json';

  // Game State
  const BLOCK_START_SPEED = 800;
  let blockCurrent = null;
  let blockDropSpeed = BLOCK_START_SPEED;
  let blockNext = null;
  let blockSize = 15;
  let currentInterval = blockDropSpeed;
  let highScore = 0;
  let inputInterval = null;
  let isGameOver = false;
  let linesCleared = 0;
  let mainLoopInterval = null;
  let score = 0;
  let useHollowBlocks = false;

  // Nuke
  const NUKE_POINTS_PER_BLOCK = 10;
  const NUKE_RADIUS = 2; // 5x5 area
  let nukeInProgress = false;
  let nukeWarningActive = false;

  // Ghost piece
  let showGhostPiece = false;
  let lastGhost = null;

  // Game Difficulty
  let difficultyLevel = 0;
  const MIN_DROP_SPEED = 100;
  const SPEED_STEP = 50;
  const LINES_PER_LEVEL = 10;

  // Screen
  const SCREEN_WIDTH = g.getWidth(); // Width (480px)
  const SCREEN_HEIGHT = g.getHeight(); // Height (320px)
  const SCREEN_AREA = {
    x1: 60,
    x2: SCREEN_WIDTH - 60,
    y1: 10,
    y2: SCREEN_HEIGHT - 10,
  };

  // Colors
  const COLOR_BLACK = '#000000';
  const COLOR_RED = '#FF0000';
  const COLOR_RED_DARK = g.blendColor(COLOR_BLACK, COLOR_RED, 0.5);
  const COLOR_THEME = g.theme.fg;
  const COLOR_THEME_DARK = g.blendColor(COLOR_BLACK, COLOR_THEME, 0.5);

  // Play Area
  const PLAY_AREA_WIDTH = 10;
  const PLAY_AREA_HEIGHT = 20;
  const PLAY_AREA_BLOCKS = new Uint8Array(PLAY_AREA_WIDTH * PLAY_AREA_HEIGHT);
  const PLAY_AREA_X =
    (SCREEN_AREA.x1 + SCREEN_AREA.x2) / 2 - (blockSize * PLAY_AREA_WIDTH) / 2;
  const PLAY_AREA_Y =
    SCREEN_AREA.y1 +
    (SCREEN_AREA.y2 - SCREEN_AREA.y1) / 2 -
    (blockSize * PLAY_AREA_HEIGHT) / 2;
  const PLAY_AREA = {
    x1: PLAY_AREA_X - 1,
    y1: PLAY_AREA_Y - 1,
    x2: PLAY_AREA_X + PLAY_AREA_WIDTH * blockSize,
    y2: PLAY_AREA_Y + PLAY_AREA_HEIGHT * blockSize,
  };

  // Knobs and Buttons
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 30;
  let lastLeftKnobTime = 0;

  // Audio/music
  const MUSIC_STOPPED = 'audioStopped';
  let musicList = [];
  let currentTrack = null;

  // prettier-ignore
  const T_SHAPE = [[0, 1, 0],[1, 1, 1]];

  // Shapes (game pieces)
  // prettier-ignore
  const SHAPES = [
    [[1, 1, 1, 1]],         // I
    [[1, 1, 1, 1]],         // I (extra)
    [[1, 1, 0],[0, 1, 1]],  // Z
    [[0, 1, 1],[1, 1, 0]],  // S
    [[1, 0, 0],[1, 1, 1]],  // J
    [[0, 0, 1],[1, 1, 1]],  // L
    T_SHAPE,
    [[1, 1],[1, 1]],        // O
    [[2]],                  // Nuke
  ];

  function applyGravity() {
    for (let y = PLAY_AREA_HEIGHT - 2; y >= 0; y--) {
      for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
        if (PLAY_AREA_BLOCKS[y * PLAY_AREA_WIDTH + x]) {
          let ny = y;
          while (
            ny + 1 < PLAY_AREA_HEIGHT &&
            !PLAY_AREA_BLOCKS[(ny + 1) * PLAY_AREA_WIDTH + x]
          ) {
            PLAY_AREA_BLOCKS[(ny + 1) * PLAY_AREA_WIDTH + x] =
              PLAY_AREA_BLOCKS[ny * PLAY_AREA_WIDTH + x];
            PLAY_AREA_BLOCKS[ny * PLAY_AREA_WIDTH + x] = 0;
            ny++;
          }
        }
      }
    }
  }

  function checkHighScore() {
    if (score > highScore) {
      highScore = score;
      saveConfig();
    }
  }

  function clearGameArea() {
    g.setColor(COLOR_BLACK);
    g.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  function clearLines() {
    let linesRemoved = 0;
    let passes = 0;
    const MAX_PASSES = PLAY_AREA_HEIGHT;

    // Scan repeatedly for rows shifting
    while (passes++ < MAX_PASSES) {
      let anyCleared = false;
      for (let y = PLAY_AREA_HEIGHT - 1; y >= 0; y--) {
        let full = true;
        for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
          if (!PLAY_AREA_BLOCKS[y * PLAY_AREA_WIDTH + x]) {
            full = false;
            break;
          }
        }

        if (full) {
          // Clear block row
          for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
            eraseBlock(x, y);
          }
          // Shift all rows above down by one
          for (let ty = y; ty > 0; ty--) {
            for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
              PLAY_AREA_BLOCKS[ty * PLAY_AREA_WIDTH + x] =
                PLAY_AREA_BLOCKS[(ty - 1) * PLAY_AREA_WIDTH + x];
            }
          }
          // Clear top row
          for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
            PLAY_AREA_BLOCKS[x] = 0;
          }

          linesRemoved++;
          linesCleared++;
          updateDifficulty();
          anyCleared = true;
          break;
        }
      }

      if (!anyCleared) {
        // All rows to cleared
        break;
      }
    }

    // if (passes >= MAX_PASSES) {
    //   console.log('Clear line safeguard triggered!');
    // }

    // Scoring
    switch (linesRemoved) {
      case 1:
        score += 100;
        break;
      case 2:
        score += 300;
        break;
      case 3:
        score += 500;
        break;
      case 4:
        score += 800;
        break;
    }
  }

  function collides(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (!piece.shape[y][x]) {
          continue;
        }
        let fx = piece.x + x,
          fy = piece.y + y;
        if (
          fx < 0 ||
          fx >= PLAY_AREA_WIDTH ||
          fy >= PLAY_AREA_HEIGHT ||
          (fy >= 0 && PLAY_AREA_BLOCKS[fy * PLAY_AREA_WIDTH + fx])
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function drawBlock(x, y, forceValue) {
    const blockValue =
      typeof forceValue !== 'undefined'
        ? forceValue
        : PLAY_AREA_BLOCKS[y * PLAY_AREA_WIDTH + x];

    const x1 = PLAY_AREA_X + x * blockSize;
    const y1 = PLAY_AREA_Y + y * blockSize;

    if (blockValue === 2) {
      try {
        g.setColor(COLOR_RED);
        g.drawImage(loadImage(NUKE_IMAGE_PATH), x1, y1);
      } catch (e) {
        // Failed to load nuke image
        console.log(e);
      }
    } else {
      g.setColor(COLOR_THEME);
      if (useHollowBlocks) {
        g.drawRect(x1, y1, x1 + blockSize - 1, y1 + blockSize - 1);
      } else {
        g.fillRect(x1, y1, x1 + blockSize - 1, y1 + blockSize - 1);
      }
    }
  }

  function drawBoundaries(area) {
    g.setColor(COLOR_THEME);
    g.drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function drawCurrentPiece(erase) {
    for (let y = 0; y < blockCurrent.shape.length; y++) {
      for (let x = 0; x < blockCurrent.shape[y].length; x++) {
        if (blockCurrent.shape[y][x]) {
          if (erase) {
            eraseBlock(blockCurrent.x + x, blockCurrent.y + y);
          } else {
            drawBlock(
              blockCurrent.x + x,
              blockCurrent.y + y,
              blockCurrent.shape[y][x], // Pass value from shape
            );
          }
        }
      }
    }
  }

  function drawField() {
    g.setColor(COLOR_THEME);
    for (let y = 0; y < PLAY_AREA_HEIGHT; y++) {
      for (let x = 0; x < PLAY_AREA_WIDTH; x++) {
        if (PLAY_AREA_BLOCKS[y * PLAY_AREA_WIDTH + x]) {
          drawBlock(x, y);
        } else {
          eraseBlock(x, y);
        }
      }
    }
    drawGhostPiece();
    drawScore();
    drawLevel();
    drawLinesCleared();
    drawNextPiece();
    drawIncomingNuke();
  }

  function drawGameName() {
    const fontHeight = 20;
    const startX = PLAY_AREA.x1 - 60;
    const startY = PLAY_AREA.y1 + 35;

    g.setColor(COLOR_THEME);
    g.setFontMonofonto28();
    g.drawString(GAME_NAME, startX, startY);

    g.setColor(COLOR_THEME);
    g.setFont('6x8', 1);
    g.drawString('v' + GAME_VERSION, startX, startY + fontHeight);
  }

  function drawGameOverScreen() {
    clearGameArea();

    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    g.clear();

    g.setColor(COLOR_THEME);
    g.setFont('6x8', 4);
    g.drawString('GAME OVER', centerX, centerY - 100);

    g.setColor(COLOR_THEME_DARK);
    g.setFont('6x8', 2);
    g.drawString('Press    to RESTART', centerX, centerY - 60);

    try {
      g.setColor(COLOR_THEME);
      g.drawImage(loadImage(GEAR_IMAGE_PATH), centerX - 45, centerY - 75);
    } catch (e) {
      // Failed to load gear image
      console.log(e);
    }

    const statsYStart = centerY - 20;
    const statsLineHeight = 18;

    g.setColor(COLOR_THEME);
    g.setFont('6x8');
    g.drawString('Score: ' + score, centerX, statsYStart);
    g.drawString(
      'Level: ' + difficultyLevel,
      centerX,
      statsYStart + statsLineHeight,
    );
    g.drawString(
      'Lines: ' + linesCleared,
      centerX,
      statsYStart + statsLineHeight * 2,
    );

    g.setColor(COLOR_THEME_DARK);
    g.drawString(
      'High Score: ' + highScore,
      centerX,
      statsYStart + statsLineHeight * 3 + 10,
    );

    drawPreviewBlockToggle();
    drawGhostPieceToggle();
    setupOptions();

    inputInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        clearInterval(inputInterval);
        inputInterval = null;
        startGame();
      }
    }, 100);
  }

  function drawGhostPiece(erase) {
    if (!showGhostPiece || !blockCurrent || isGameOver) {
      return;
    }

    let ghost =
      erase && lastGhost
        ? lastGhost
        : {
            x: blockCurrent.x,
            y: blockCurrent.y,
            shape: blockCurrent.shape,
          };

    if (!erase) {
      while (!collides({ x: ghost.x, y: ghost.y + 1, shape: ghost.shape })) {
        ghost.y++;
      }
      lastGhost = { x: ghost.x, y: ghost.y, shape: ghost.shape };
    } else if (!lastGhost) {
      return; // Nothing to erase
    }

    let color = erase ? COLOR_BLACK : COLOR_THEME_DARK;
    g.setColor(color);

    for (let y = 0; y < ghost.shape.length; y++) {
      for (let x = 0; x < ghost.shape[y].length; x++) {
        if (ghost.shape[y][x]) {
          const blockValue = ghost.shape[y][x];
          const blockX = PLAY_AREA_X + (ghost.x + x) * blockSize;
          const blockY = PLAY_AREA_Y + (ghost.y + y) * blockSize;

          if (!erase && blockValue === 2) {
            try {
              // Nuke ghost block
              g.setColor(COLOR_RED_DARK);
              g.drawImage(loadImage(NUKE_IMAGE_PATH), blockX, blockY, {
                scale: blockSize / 15, // 15 = width of the nuke image
                transparency: 0.5,
              });
            } catch (e) {
              // Failed to load nuke ghost image
              console.log(e);
            }
          } else {
            // Default ghost block
            if (useHollowBlocks) {
              g.drawRect(
                blockX,
                blockY,
                blockX + blockSize - 1,
                blockY + blockSize - 1,
              );
            } else {
              g.fillRect(
                blockX,
                blockY,
                blockX + blockSize - 1,
                blockY + blockSize - 1,
              );
            }
          }
        }
      }
    }
  }

  function drawGhostPieceToggle() {
    g.setFont('6x8', 1);

    const posY = SCREEN_AREA.y2 - 40;
    const posX = 180;

    const stateY = posY - 22;
    const state = { ON: 'ON', OFF: 'OFF' };
    const ghostState = showGhostPiece ? state.ON : state.OFF;

    const fontHeight = 8;
    const fontScale = 2;
    g.setFont('6x' + fontHeight, fontScale);
    const textWidth = g.stringWidth(state.OFF); // Widest state
    const textHeight = fontHeight * fontScale;

    // Clear previous area
    const clearXY = {
      x1: posX - textWidth / 2,
      y1: stateY - textHeight / 2,
      x2: posX + textWidth / 2,
      y2: stateY + textHeight,
    };
    g.setColor(COLOR_BLACK);
    g.fillRect(clearXY);

    // drawBoundaries(clearXY);

    g.setColor(COLOR_THEME);
    g.drawString(ghostState, posX, stateY + 4);

    g.setFont('6x8', 1);
    g.setColor(COLOR_THEME_DARK);
    const labelText = 'GHOST';
    const labelWidth = g.stringWidth(labelText);
    g.drawString(labelText, posX, posY);

    const arrowSize = 5;
    const arrowSpacing = 8;

    // UP arrow (left of label)
    const upArrowX = posX - labelWidth / 2 - arrowSpacing - 1;
    const upArrowY = posY;
    g.fillPoly([
      upArrowX,
      upArrowY - arrowSize,
      upArrowX - arrowSize,
      upArrowY + arrowSize,
      upArrowX + arrowSize,
      upArrowY + arrowSize,
    ]);

    // DOWN arrow (right of label)
    const downArrowX = posX + labelWidth / 2 + arrowSpacing;
    const downArrowY = posY;
    const downArrowSize = arrowSize - 1;
    g.fillPoly([
      downArrowX,
      downArrowY + downArrowSize,
      downArrowX - downArrowSize,
      downArrowY - downArrowSize,
      downArrowX + downArrowSize,
      downArrowY - downArrowSize,
    ]);
  }

  function drawIncomingNuke() {
    const startX = PLAY_AREA.x2 + 65;
    const startY = PLAY_AREA.y1 + 100;
    const textLineHeight = 18;

    if (!nukeWarningActive) {
      // Clear
      const clearWidth = 100;
      const clearHeight = textLineHeight * 2 + 50 + 10;

      const clearXY = {
        x1: startX - clearWidth / 2 - 5,
        y1: startY - 10,
        x2: startX + clearWidth / 2,
        y2: startY + clearHeight,
      };

      // drawBoundaries({
      //   x1: clearXY.x1 - 1,
      //   y1: clearXY.y1 - 1,
      //   x2: clearXY.x2 + 1,
      //   y2: clearXY.y2 + 1,
      // });

      g.setColor(COLOR_BLACK);
      g.fillRect(clearXY);
      return;
    }

    g.setFont('6x8', 2);
    g.setColor(COLOR_RED);
    g.drawString('INCOMING', startX, startY);
    g.drawString('NUKE!', startX, startY + textLineHeight);

    try {
      const imgSize = 50;
      const imgX = startX - imgSize / 2;
      const imgY = startY + textLineHeight * 2 + 5;
      g.setColor(COLOR_RED_DARK);
      g.drawImage(loadImage(RADIOACTIVE_IMAGE_PATH), imgX, imgY);
    } catch (e) {
      // Failed to load radioactive image
      console.log(e);
    }
  }

  function drawLinesCleared() {
    const linesX = PLAY_AREA.x1 - 65;
    const linesY = PLAY_AREA.y2 - 60;
    const fontHeight = 20;

    g.setFont('6x8', 2);
    const text = linesCleared.toString();
    // const textWidth = g.stringWidth(text);
    const textHeight = 16;

    const clearWidth = 80;
    const clearHeight = fontHeight + textHeight + 10;

    const clearX1 = linesX - clearWidth / 2;
    const clearY1 = linesY + fontHeight - 8;
    const clearX2 = linesX + clearWidth / 2;
    const clearY2 = clearY1 + clearHeight;

    g.setColor(COLOR_BLACK);
    g.fillRect(clearX1, clearY1, clearX2, clearY2);

    // drawBoundaries({
    //   x1: clearX1 - 1,
    //   y1: clearY1 - 1,
    //   x2: clearX2 + 1,
    //   y2: clearY2 + 1,
    // });

    g.setColor(COLOR_THEME_DARK);
    g.drawString('LINES', linesX, linesY);

    g.setColor(COLOR_THEME);
    g.drawString(text, linesX, linesY + fontHeight);
  }

  function drawLevel() {
    const levelX = PLAY_AREA.x1 - 65;
    const levelY = PLAY_AREA.y2 - 120;
    const fontHeight = 20;

    g.setFont('6x8', 2);
    const text = difficultyLevel.toString();
    const textWidth = g.stringWidth(text);
    const textHeight = 16;

    const clearPadding = 4;
    const clearX1 = levelX - textWidth / 2 - clearPadding;
    const clearY1 = levelY + fontHeight - clearPadding * 2;
    const clearX2 = levelX + textWidth / 2 + clearPadding;
    const clearY2 = clearY1 + textHeight + clearPadding;

    g.setColor(COLOR_BLACK);
    g.fillRect(clearX1, clearY1, clearX2, clearY2);

    // drawBoundaries({
    //   x1: clearX1 - 1,
    //   y1: clearY1 - 1,
    //   x2: clearX2 + 1,
    //   y2: clearY2 + 1,
    // });

    // Draw static label (only once in startGame if you want)
    g.setColor(COLOR_THEME_DARK);
    g.drawString('LEVEL', levelX, levelY);

    // Draw dynamic level number
    g.setColor(COLOR_THEME);
    g.drawString(text, levelX, levelY + fontHeight);
  }

  function drawNextPiece() {
    if (!blockNext) {
      return;
    }

    const startX = PLAY_AREA.x2 + 65;
    const startY = PLAY_AREA.y1 + 25;

    const previewBlockArea = 4 * blockSize;
    const previewPadding = 6;

    const clearX1 = startX - previewBlockArea / 2 - previewPadding;
    const clearY1 = startY + 15 - previewPadding;
    const clearX2 = startX + previewBlockArea / 2 + previewPadding;
    const clearY2 = startY + 15 + previewBlockArea + previewPadding;

    g.setColor(COLOR_BLACK);
    g.fillRect(clearX1, clearY1, clearX2, clearY2);

    // drawBoundaries({
    //   x1: clearX1 - 1,
    //   y1: clearY1 - 1,
    //   x2: clearX2 + 1,
    //   y2: clearY2 + 1,
    // });

    g.setFont('6x8', 2);
    g.setColor(COLOR_THEME_DARK);
    g.drawString('NEXT', startX, startY);

    const piece = blockNext.shape;
    const piecePixelWidth = piece[0].length * blockSize;
    const offsetX = startX - piecePixelWidth / 2 - 2;

    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x]) {
          const blockValue = piece[y][x];
          const blockX = offsetX + x * blockSize;
          const blockY = startY + 20 + y * blockSize;

          if (blockValue === 2) {
            // Nuke
            try {
              const nukeImage = loadImage(NUKE_IMAGE_PATH);
              g.setColor(COLOR_RED);
              g.drawImage(nukeImage, blockX, blockY, {
                scale: blockSize / nukeImage.width,
              });
            } catch (e) {
              // Failed to load nuke image
              console.log(e);
            }
          } else {
            g.setColor(COLOR_THEME);
            if (useHollowBlocks) {
              g.drawRect(
                blockX,
                blockY,
                blockX + blockSize - 1,
                blockY + blockSize - 1,
              );
            } else {
              g.fillRect(
                blockX,
                blockY,
                blockX + blockSize - 1,
                blockY + blockSize - 1,
              );
            }
          }
        }
      }
    }
  }

  function drawPreviewBlockToggle() {
    const posY = SCREEN_AREA.y2 - 40;
    const posX = 300;

    const blockSize = 10;
    const blockHeight = T_SHAPE.length * blockSize;
    const blockWidth = T_SHAPE[0].length * blockSize;

    const startY = posY - blockHeight - 10;
    const startX = posX - blockWidth / 2;

    g.setFont('6x8', 1);
    g.setColor(COLOR_THEME_DARK);

    const labelText = 'TYPE';
    const labelWidth = g.stringWidth(labelText);
    g.drawString(labelText, posX, posY);

    const arrowSize = 6;
    const arrowSpacing = 10;

    // LEFT arrow (left of label)
    const leftArrowX = posX - labelWidth / 2 - arrowSpacing;
    const leftArrowY = posY;
    g.fillPoly([
      leftArrowX,
      leftArrowY,
      leftArrowX + arrowSize,
      leftArrowY - arrowSize,
      leftArrowX + arrowSize,
      leftArrowY + arrowSize,
    ]);

    // RIGHT arrow (right of label)
    const rightArrowX = posX + labelWidth / 2 + arrowSpacing;
    const rightArrowY = posY;
    g.fillPoly([
      rightArrowX,
      rightArrowY,
      rightArrowX - arrowSize,
      rightArrowY - arrowSize,
      rightArrowX - arrowSize,
      rightArrowY + arrowSize,
    ]);

    // Clear previous area
    const clearXY = {
      x1: startX - 2,
      y1: startY - 2,
      x2: startX + blockWidth + 2,
      y2: startY + blockHeight + 2,
    };
    g.setColor(COLOR_BLACK);
    g.fillRect(clearXY);

    // drawBoundaries(clearXY);

    // Draw the T-shape preview block
    g.setColor(COLOR_THEME);
    for (let y = 0; y < T_SHAPE.length; y++) {
      for (let x = 0; x < T_SHAPE[y].length; x++) {
        if (T_SHAPE[y][x]) {
          const x1 = startX + x * blockSize;
          const y1 = startY + y * blockSize;
          const x2 = x1 + blockSize - 1;
          const y2 = y1 + blockSize - 1;
          if (useHollowBlocks) {
            g.drawRect(x1, y1, x2, y2);
          } else {
            g.fillRect(x1, y1, x2, y2);
          }
        }
      }
    }
  }

  function drawScore() {
    const scoreX = PLAY_AREA.x2 + 65;
    const scoreY = PLAY_AREA.y2 - 60;
    const fontHeight = 20;

    g.setFont('6x8', 2);
    const text = score.toString();
    const textWidth = g.stringWidth(text);
    const textHeight = 16;

    const clearWidth = 100;
    const clearHeight = fontHeight + textHeight + 10;
    const clearX1 = scoreX - clearWidth / 2;
    const clearY1 = scoreY + fontHeight - 8;
    const clearX2 = scoreX + clearWidth / 2;
    const clearY2 = clearY1 + clearHeight;

    // Clear
    g.setColor(COLOR_BLACK);
    g.fillRect(clearX1, clearY1, clearX2, clearY2);

    // drawBoundaries({
    //   x1: clearX1 - 1,
    //   y1: clearY1 - 1,
    //   x2: clearX2 + 1,
    //   y2: clearY2 + 1,
    // });

    g.setColor(COLOR_THEME_DARK);
    g.drawString('SCORE', scoreX, scoreY);

    g.setColor(COLOR_THEME);
    g.drawString(text, scoreX, scoreY + fontHeight);
  }

  function drawStartScreen() {
    clearGameArea();

    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    g.clear();

    g.setColor(COLOR_THEME);
    g.setFontMonofonto36();
    g.drawString(GAME_NAME, centerX, centerY - 50);

    g.setColor(COLOR_THEME_DARK);
    g.setFont('6x8', 2);
    g.drawString('Press    to START', centerX, centerY - 15);

    try {
      g.setColor(COLOR_THEME);
      g.drawImage(loadImage(GEAR_IMAGE_PATH), centerX - 34, centerY - 29);
    } catch (e) {
      // Failed to load gear image
      console.log(e);
    }

    if (highScore > 0) {
      g.setColor(COLOR_THEME_DARK);
      g.setFont('6x8');
      g.drawString('High Score: ' + highScore, centerX, centerY + 35);
    }

    drawPreviewBlockToggle();
    drawGhostPieceToggle();
    setupOptions();
  }

  function dropPiece() {
    if (!blockCurrent || isGameOver) {
      return;
    }

    drawCurrentPiece(true);
    blockCurrent.y++;

    if (collides(blockCurrent)) {
      blockCurrent.y--;
      drawCurrentPiece(false);
      merge(blockCurrent);
      clearLines();
      spawnPiece();

      // Game over sanity check
      if (collides(blockCurrent)) {
        isGameOver = true;
        clearInterval(mainLoopInterval);
        setTimeout(drawGameOverScreen, 50);
        return;
      }
    }

    drawCurrentPiece(false);
    drawBoundaries(PLAY_AREA);

    const fastDrop = BTN_PLAY.read();
    const desiredInterval = fastDrop ? 100 : blockDropSpeed;
    if (currentInterval !== desiredInterval) {
      clearInterval(mainLoopInterval);
      mainLoopInterval = setInterval(mainLoop, desiredInterval);
      currentInterval = desiredInterval;
    }
  }

  function dropToBottom() {
    if (!blockCurrent || isGameOver) {
      return;
    }

    drawCurrentPiece(true);

    while (!collides(blockCurrent)) {
      blockCurrent.y++;
    }
    blockCurrent.y--;

    drawCurrentPiece(false);
    merge(blockCurrent);
    clearLines();
    drawField();
    spawnPiece();
    drawCurrentPiece(false);
  }

  function eraseBlock(x, y) {
    g.setColor(COLOR_BLACK);
    g.fillRect(
      PLAY_AREA_X + x * blockSize,
      PLAY_AREA_Y + y * blockSize,
      PLAY_AREA_X + (x + 1) * blockSize - 1,
      PLAY_AREA_Y + (y + 1) * blockSize - 1,
    );
  }

  function getRandomPiece(allowNuke) {
    if (typeof allowNuke === 'undefined') {
      allowNuke = true;
    }

    let shapeData;
    while (true) {
      let picked = Math.floor(Math.random() * SHAPES.length);
      shapeData = SHAPES[picked];
      if (!(!allowNuke && shapeData[0][0] === 2)) break;
    }
    let offset = Math.floor((PLAY_AREA_WIDTH - shapeData[0].length) / 2);
    return { shape: shapeData, x: offset, y: 0 };
  }

  function handleMusicStopped() {
    playMusic();
  }

  function handleLeftKnob(dir) {
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir === 0) {
      dropToBottom();
    } else {
      rotate(dir);
    }
  }

  function handlePowerButton() {
    removeListeners();

    clearInterval(mainLoopInterval);

    bC.clear(1).flip();
    E.reboot();
  }

  function handleRightKnob(dir) {
    move(dir > 0 ? 1 : -1);
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

  function loadConfig() {
    try {
      let file = fs.readFile(CONFIG_PATH);
      if (!file) throw new Error('Config file missing');
      let data = JSON.parse(file);
      highScore = data.highScore || 0;
      musicList = data.music || [];
    } catch (e) {
      // Error loading config
      console.log(e);
      highScore = 0;
      saveConfig();
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

  function mainLoop() {
    // console.log('Mem: ' + process.memory().usage + '/5000');
    dropPiece();
  }

  function merge(piece) {
    let nuked = false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const fx = piece.x + x;
          const fy = piece.y + y;

          if (!isFinite(fx) || !isFinite(fy)) {
            continue;
          }

          if (piece.shape[y][x] === 2) {
            // console.log('Nuking coords: ', fx, fy);
            if (
              fx >= 0 &&
              fx < PLAY_AREA_WIDTH &&
              fy >= 0 &&
              fy < PLAY_AREA_HEIGHT
            ) {
              PLAY_AREA_BLOCKS[fy * PLAY_AREA_WIDTH + fx] = 0;
              nuke(fx, fy);
              nuked = true;
            } else {
              // console.log('Nuke is out of bounds!', fx, fy);
            }
          } else {
            PLAY_AREA_BLOCKS[fy * PLAY_AREA_WIDTH + fx] = 1;
          }
        }
      }
    }

    if (nuked) {
      // Clear lines after nuke
      clearLines();
    }
  }

  function move(dir) {
    if (isGameOver || !blockCurrent) return;

    drawGhostPiece(true);

    let oldX = blockCurrent.x;
    blockCurrent.x += dir;

    if (collides(blockCurrent)) {
      blockCurrent.x = oldX;
      drawGhostPiece();
      return;
    }

    for (let y = 0; y < blockCurrent.shape.length; y++) {
      for (let x = 0; x < blockCurrent.shape[y].length; x++) {
        if (blockCurrent.shape[y][x]) {
          eraseBlock(oldX + x, blockCurrent.y + y);
        }
      }
    }

    drawGhostPiece();
    drawCurrentPiece(false);
    drawBoundaries(PLAY_AREA);
  }

  function nuke(centerX, centerY) {
    if (nukeInProgress) {
      // Nuke is still nuking...
      return;
    }
    nukeInProgress = true;

    if (!isFinite(centerX) || !isFinite(centerY)) {
      // We were sent incorrect nuke coordinates!
      nukeInProgress = false;
      return;
    }

    centerX = Math.max(0, Math.min(centerX, PLAY_AREA_WIDTH - 1));
    centerY = Math.max(0, Math.min(centerY, PLAY_AREA_HEIGHT - 1));

    // Blast area
    let blastArea = {
      x1: PLAY_AREA_X + (centerX - NUKE_RADIUS) * blockSize + 1,
      y1: PLAY_AREA_Y + (centerY - NUKE_RADIUS) * blockSize + 1,
      x2: PLAY_AREA_X + (centerX + NUKE_RADIUS + 1) * blockSize - 2,
      y2: PLAY_AREA_Y + (centerY + NUKE_RADIUS + 1) * blockSize - 2,
    };
    // Keep within play area
    blastArea.x1 = Math.max(blastArea.x1, PLAY_AREA.x1 + 1);
    blastArea.y1 = Math.max(blastArea.y1, PLAY_AREA.y1 + 1);
    blastArea.x2 = Math.min(blastArea.x2, PLAY_AREA.x2 - 1);
    blastArea.y2 = Math.min(blastArea.y2, PLAY_AREA.y2 - 1);

    // Draw blast radius
    g.setColor(COLOR_RED);
    g.drawRect(blastArea);

    let blocksDestroyed = 0;

    for (let y = -NUKE_RADIUS; y <= NUKE_RADIUS; y++) {
      for (let x = -NUKE_RADIUS; x <= NUKE_RADIUS; x++) {
        let fx = centerX + x;
        let fy = centerY + y;

        if (
          fx >= 0 &&
          fx < PLAY_AREA_WIDTH &&
          fy >= 0 &&
          fy < PLAY_AREA_HEIGHT &&
          PLAY_AREA_BLOCKS[fy * PLAY_AREA_WIDTH + fx]
        ) {
          PLAY_AREA_BLOCKS[fy * PLAY_AREA_WIDTH + fx] = 0;
          eraseBlock(fx, fy);
          blocksDestroyed++;
        }
      }
    }

    let nukePoints = blocksDestroyed * NUKE_POINTS_PER_BLOCK;
    score += nukePoints;
    drawScore();

    // console.log(
    //   'Nuke destroyed ' +
    //     blocksDestroyed +
    //     ' blocks for ' +
    //     nukePoints +
    //     ' pts',
    // );

    // Clear blast radius
    g.setColor(COLOR_BLACK);
    g.fillRect(blastArea);

    applyGravity();
    nukeInProgress = false;
  }

  function playMusic() {
    if (!musicList.length) {
      console.log('No music tracks available');
      return;
    }
    const track = musicList[Math.floor(Math.random() * musicList.length)];
    if (track === currentTrack) {
      return playMusic(); // Restart if same track
    }
    Pip.audioStop();
    Pip.audioStart(track);
    currentTrack = track;
  }

  function resetField() {
    PLAY_AREA_BLOCKS.fill(0);
    g.setColor(COLOR_BLACK);
    g.fillRect(
      PLAY_AREA_X,
      PLAY_AREA_Y,
      PLAY_AREA_X + PLAY_AREA_WIDTH * blockSize - 1,
      PLAY_AREA_Y + PLAY_AREA_HEIGHT * blockSize - 1,
    );
  }

  function rotate(dir) {
    if (isGameOver || !blockCurrent) return;

    drawGhostPiece(true);

    const shape = blockCurrent.shape;
    const newShape =
      dir > 0
        ? shape[0].map((_, i) => shape.map((row) => row[row.length - 1 - i]))
        : shape[0].map((_, i) => shape.map((row) => row[i]).reverse());

    const oldShape = blockCurrent.shape;
    blockCurrent.shape = newShape;

    if (collides(blockCurrent)) {
      blockCurrent.shape = oldShape;
      drawGhostPiece();
      return;
    }

    for (let y = 0; y < oldShape.length; y++) {
      for (let x = 0; x < oldShape[y].length; x++) {
        if (oldShape[y][x]) {
          eraseBlock(blockCurrent.x + x, blockCurrent.y + y);
        }
      }
    }

    drawCurrentPiece(false);
    drawGhostPiece();
    drawBoundaries(PLAY_AREA);
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
    Pip.removeAllListeners(MUSIC_STOPPED);
  }

  function saveConfig() {
    let data = {
      highScore: highScore,
      music: musicList,
    };
    try {
      fs.writeFile(CONFIG_PATH, JSON.stringify(data));
    } catch (e) {
      // Error saving config
      console.log(e);
    }
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
    Pip.on(MUSIC_STOPPED, handleMusicStopped);
  }

  function setupOptions() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.on(KNOB_LEFT, toggleGhostPiece);
    Pip.on(KNOB_RIGHT, togglePreviewStyle);
  }

  function spawnPiece() {
    if (!blockNext) {
      blockNext = getRandomPiece();
    }

    blockCurrent = blockNext;
    blockNext = getRandomPiece();

    nukeWarningActive = blockNext.shape.some((row) => row.includes(2));

    drawField();

    if (collides(blockCurrent)) {
      isGameOver = true;
      checkHighScore();
      clearInterval(mainLoopInterval);
      setTimeout(() => {
        drawGameOverScreen();
      }, 50);
    }
  }

  function startGame() {
    if (inputInterval) {
      clearInterval(inputInterval);
      inputInterval = null;
    }
    if (mainLoopInterval) {
      clearInterval(mainLoopInterval);
      mainLoopInterval = null;
    }
    removeListeners();
    playMusic();

    isGameOver = false;
    blockCurrent = null;

    if (false) {
      // Set true for testing
      difficultyLevel = 10;
      score = 10000;
    } else {
      difficultyLevel = 0;
      score = 0;
    }
    linesCleared = difficultyLevel * LINES_PER_LEVEL;
    blockDropSpeed = Math.max(
      BLOCK_START_SPEED - difficultyLevel * SPEED_STEP,
      MIN_DROP_SPEED,
    );
    currentInterval = blockDropSpeed;
    blockNext = getRandomPiece(false);

    clearGameArea();
    resetField();
    drawLevel();
    drawScore();

    drawBoundaries(PLAY_AREA);

    spawnPiece();
    drawField();
    drawGameName();

    setListeners();
    mainLoopInterval = setInterval(mainLoop, blockDropSpeed);
  }

  function toggleGhostPiece() {
    showGhostPiece = !showGhostPiece;
    drawGhostPieceToggle();
  }

  function togglePreviewStyle() {
    useHollowBlocks = !useHollowBlocks;
    drawPreviewBlockToggle();
  }

  function updateDifficulty() {
    let newLevel = Math.floor(linesCleared / LINES_PER_LEVEL);
    if (newLevel > difficultyLevel) {
      difficultyLevel = newLevel;
      blockDropSpeed = Math.max(
        BLOCK_START_SPEED - difficultyLevel * SPEED_STEP,
        MIN_DROP_SPEED,
      );
      // console.log('Level up! New speed:', blockDropSpeed, 'ms');
    }
  }

  self.run = function () {
    bC.clear(); // Clear any previous screen

    loadConfig();

    drawStartScreen();
    setupOptions();

    Pip.on(BTN_TOP, handleTopButton);

    inputInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        clearInterval(inputInterval);
        inputInterval = null;
        Pip.removeListener(KNOB_LEFT, togglePreviewStyle);
        Pip.removeListener(KNOB_RIGHT, togglePreviewStyle);
        Pip.removeAllListeners(BTN_TOP);
        startGame();
      }
    }, 100);

    // Handle power button press to restart the device
    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: true,
    });
  };

  return self;
}

Piptris().run();
