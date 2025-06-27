// =============================================================================
//  Name: Porta Hack
//  License: CC-BY-NC-4.0
//  Repository(s):
//     https://github.com/CodyTolene/pip-boy-apps
//     https://github.com/pip-4111/Porta-Hack
// =============================================================================

function PortaHack() {
  const self = {};

  const GAME_NAME = 'Porta Hack';
  const GAME_VERSION = '1.0.0';
  const DEBUG = false;

  // Game
  const FPS = 1000 / 60;
  const MAX_ATTEMPTS = 4;
  let attemptsRemaining = MAX_ATTEMPTS;
  let correctPassword = null;
  let cursorCol = 0;
  let cursorRow = 0;
  let gameOverCooldown = 0;
  let isGameOver = false;
  let junkLinesLeft = [];
  let junkLinesRight = [];
  let selectedWord = null;

  // Intervals
  let playButtonInterval = null;
  let gameOverInterval = null;

  // Font
  const FONT_HEIGHT = 8;
  const FONT = '6x' + FONT_HEIGHT;

  // Graphics buffer
  const gb = g;

  // Visible Screen
  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();
  const SCREEN_XY = {
    x1: 60,
    x2: SCREEN_WIDTH - 60,
    y1: 10,
    y2: SCREEN_HEIGHT - 10,
  };

  // Header Message
  const HEADER = {
    // FONT_HEIGHT + 2 padding top + 2 padding bottom
    height: FONT_HEIGHT + 2 * 2,
    padding: 2,
    textHeight: FONT_HEIGHT,
  };
  const HEADER_XY = {
    x1: SCREEN_XY.x1,
    x2: SCREEN_XY.x2,
    y1: SCREEN_XY.y1,
    y2: SCREEN_XY.y1 + HEADER.height,
  };

  // Password Message
  const PASSWORD_MESSAGE = {
    // FONT_HEIGHT + 2 padding top + 2 padding bottom
    height: FONT_HEIGHT + 2 * 2,
    padding: 2,
    textHeight: FONT_HEIGHT,
  };
  const PASSWORD_MESSAGE_XY = {
    x1: SCREEN_XY.x1,
    x2: SCREEN_XY.x2,
    y1: HEADER_XY.y2,
    y2: HEADER_XY.y2 + PASSWORD_MESSAGE.height,
  };

  // Password Attempt Counter
  const ATTEMPT_COUNTER = {
    // FONT_HEIGHT * 3 lines + 2 padding top + 2 padding bottom
    height: FONT_HEIGHT * 3 + 2 + 2,
    padding: 2,
    textHeight: FONT_HEIGHT,
  };
  const ATTEMPT_COUNTER_XY = {
    x1: SCREEN_XY.x1,
    x2: SCREEN_XY.x2,
    y1: PASSWORD_MESSAGE_XY.y2,
    y2: PASSWORD_MESSAGE_XY.y2 + ATTEMPT_COUNTER.height,
  };

  // Password Grids
  const PASSWORD_GRID_LEFT_XY = {
    x1: SCREEN_XY.x1,
    x2: SCREEN_XY.x1 + (SCREEN_XY.x2 - SCREEN_XY.x1) * 0.35,
    y1: ATTEMPT_COUNTER_XY.y2,
    y2: SCREEN_XY.y2,
  };
  const PASSWORD_GRID_RIGHT_XY = {
    x1: PASSWORD_GRID_LEFT_XY.x2,
    x2: PASSWORD_GRID_LEFT_XY.x2 + (SCREEN_XY.x2 - SCREEN_XY.x1) * 0.35,
    y1: ATTEMPT_COUNTER_XY.y2,
    y2: SCREEN_XY.y2,
  };

  // Log of selected passwords
  const LOG_XY = {
    x1: PASSWORD_GRID_RIGHT_XY.x2,
    x2: SCREEN_XY.x2,
    y1: ATTEMPT_COUNTER_XY.y2,
    y2: SCREEN_XY.y2,
  };
  let logEntries = [];

  // Colors
  const BLACK = '#000000';
  const WHITE = '#ffffff';
  const GREEN = '#00ff00';
  const GREEN_DARK = '#007f00';
  const GREEN_DARKER = '#003300';

  // Video
  const VIDEO_STOPPED = 'videoStopped';
  const VIDEO_BOOT = 'BOOT/BOOT.avi';

  // All available passwords to select from
  // prettier-ignore
  const PASSWORDS = [
    'HACK', 'BIKE', 'HIKE', 'VOID', 'VEIN', 'RAINING', 'NULL', 'PULLING', 
    'DATA', 'BAIT', 'HOARD', 'ROOTING', 'HEX', 'DEBUG', 'SCRIPT', 'LOGIC',
    'STACK', 'ARRAY', 'OBJECT', 'STRINGING', 'BRINGING', 'MODULE', 'IMPORT',
    'EXPORT', 'EVENT', 'REACT', 'PACK', 'BACK', 'HANK', 'HARK', 'HALL', 'LIKE',
    'PIKE', 'BAKE', 'BITE', 'BIND', 'VINE', 'VILE', 'VOYAGE', 'MOID', 'SOIL',
    'GAINING', 'PAINTED', 'RAVINGS', 'MAILING', 'WAILING', 'RAILING', 'ARROW',
    'SUBJECT', 'EJECTS', 'ABJECT', 'REJECT', 'OBSESS', 'JANE', 'MARK', 'MARY',
    'FREEDOM', 'FRENCH', 'FLEETING', 'FLOP', 'VAULT', 'ACCESS', 'ARMORY', 
    'TARGET', 'BUFFER', 'CIRCUIT', 'ENCRYPT', 'OVERRIDE', 'PROTOCOL', 'SUBSYS',
    'CRYPTO', 'UPLOAD', 'BOOTSEQ', 'FAILSAFE', 'NETWORK', 'SECURE', 'DISARM',
    'ARCHIVE', 'CLEARANCE', 'DISPOSAL', 'EXPUNGED', 'FACILITY', 'FORMS', 
    'PERMIT', 'POLICY', 'QUOTA', 'RESTRICT', 'TERMINAL', 'VAULT-TEC', 
    'APPROVED', 'REJECTED', 'SUBMIT', 'RECORDS', 'OBEY', 'CONFORM', 'GLORIOUS',
    'SURVIVAL', 'PROTECT', 'LOYALTY', 'CITIZEN', 'ISOLATED', 'HOPELESS', 
    'EXILED', 'ORDERED', 'MOURNING', 'EXPIRED', 'DECEASED', 'ALERTED', 
    'MISTER', 'ROBCO', 'RADIO', 'DINER', 'NUKA', 'PIPBOY', 'ATOMIC',
    'BLISSFUL', 'OPTIMISM', 'PRESET', 'GENERATOR', 'TRIAGE', 'HYGIENE',
    'ELEVATOR', 'HYDROGEN', 'VAULTDOOR', 'BYTE', 'INDEX', 'LOGIN', 'CACHE',
    'ERROR', 'BUNKER', 'REACTOR', 'SHELTER', 'CONTROL', 'FISSION', 'CANTEEN'
  ];
  const MAX_ROWS_PER_COLUMN = 25;
  const TOTAL_ROWS = MAX_ROWS_PER_COLUMN * 2;
  const LEFT_PASSWORDS = PASSWORDS.slice(0, MAX_ROWS_PER_COLUMN);
  const RIGHT_PASSWORDS = PASSWORDS.slice(MAX_ROWS_PER_COLUMN, TOTAL_ROWS);

  // Knobs and Buttons
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 100;
  let lastLeftKnobTime = 0;
  let lastPlayPressTime = 0;
  let lastPlayState = false;

  function clearScreen() {
    gb.setColor(BLACK).fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  function drawAttemptCounter() {
    if (attemptsRemaining < 0 || attemptsRemaining > MAX_ATTEMPTS) {
      throw new Error(
        'Invalid number of attempts remaining: ' + attemptsRemaining,
      );
    }

    // Clear previous
    gb.setColor(BLACK).fillRect(ATTEMPT_COUNTER_XY);

    const padding = ATTEMPT_COUNTER.padding;
    const textHeight = ATTEMPT_COUNTER.textHeight;
    const y = ATTEMPT_COUNTER_XY.y1 + textHeight + padding;
    let text = attemptsRemaining + ' ATTEMPT(S) LEFT:';

    gb.setColor(GREEN)
      .setFont(FONT)
      .setFontAlign(-1, -1)
      .drawString(text, ATTEMPT_COUNTER_XY.x1 + padding, y);

    const boxSize = 8;
    const boxPadding = 5;
    const startX =
      ATTEMPT_COUNTER_XY.x1 + padding + gb.stringWidth(text) + boxPadding;

    // Draw attempt boxes
    for (let i = 0; i < attemptsRemaining; i++) {
      const x = startX + i * (boxSize + boxPadding);
      gb.setColor(GREEN).fillRect(x, y, x + boxSize, y + boxSize);
    }
  }

  function drawBoundaries(area) {
    if (!DEBUG) {
      return; // Skip drawing boundaries if not in debug mode
    }
    gb.setColor(WHITE).drawRect(area);
  }

  function drawCursor() {
    const addrLen = 7;
    const isLeft = cursorRow < MAX_ROWS_PER_COLUMN;
    const area = isLeft ? PASSWORD_GRID_LEFT_XY : PASSWORD_GRID_RIGHT_XY;
    const offset = isLeft ? 0 : MAX_ROWS_PER_COLUMN;
    const junk = isLeft
      ? junkLinesLeft[cursorRow]
      : junkLinesRight[cursorRow - offset];
    const line = junk.line;
    const y = area.y1 + (cursorRow - offset) * 10;
    const xStart = area.x1 + 2 + (addrLen + cursorCol) * 6;

    // Clear previous
    if (
      typeof drawCursor.prevRow !== 'undefined' &&
      typeof drawCursor.prevCol !== 'undefined'
    ) {
      const prevIsLeft = drawCursor.prevRow < MAX_ROWS_PER_COLUMN;
      const prevArea = prevIsLeft
        ? PASSWORD_GRID_LEFT_XY
        : PASSWORD_GRID_RIGHT_XY;
      const prevOffset = prevIsLeft ? 0 : MAX_ROWS_PER_COLUMN;
      const prevJunk = prevIsLeft
        ? junkLinesLeft[drawCursor.prevRow]
        : junkLinesRight[drawCursor.prevRow - prevOffset];
      const prevY = prevArea.y1 + (drawCursor.prevRow - prevOffset) * 10;
      const prevAddr =
        '0xF' + (0x964 + drawCursor.prevRow).toString(16).padStart(3, '0');
      gb.setColor(BLACK).fillRect(prevArea.x1, prevY, prevArea.x2, prevY + 10);
      gb.setColor(GREEN).setFont('6x8').setFontAlign(-1, -1);
      gb.drawString(prevAddr + ' ' + prevJunk.line, prevArea.x1 + 2, prevY);
    }

    drawCursor.prevRow = cursorRow;
    drawCursor.prevCol = cursorCol;

    const addr = '0xF' + (0x964 + cursorRow).toString(16).padStart(3, '0');
    gb.setFont('6x8').setFontAlign(-1, -1);
    gb.setColor(GREEN).drawString(addr + ' ' + line, area.x1 + 2, y);

    if (
      cursorCol >= junk.embedAt &&
      cursorCol <
        junk.embedAt +
          (isLeft
            ? LEFT_PASSWORDS[cursorRow].length
            : RIGHT_PASSWORDS[cursorRow - offset].length)
    ) {
      // Highlight word
      const word = isLeft
        ? LEFT_PASSWORDS[cursorRow]
        : RIGHT_PASSWORDS[cursorRow - offset];
      const xWord = area.x1 + 2 + (addrLen + junk.embedAt) * 6;
      gb.setColor(GREEN).fillRect(xWord, y, xWord + word.length * 6, y + 10);
      gb.setColor(BLACK).drawString(
        line.substr(junk.embedAt, word.length),
        xWord,
        y,
      );
    } else {
      // Highlight single character
      const xChar = area.x1 + 2 + (addrLen + cursorCol) * 6;
      gb.setColor(GREEN).fillRect(xChar, y, xChar + 6, y + 10);
      gb.setColor(BLACK).drawString(line[cursorCol], xChar, y);
    }
  }

  function drawGameOverScreen() {
    isGameOver = true;
    gameOverCooldown = Date.now() + 1000;
    clearScreen();
    removeListeners();

    const gameOverText = 'GAME OVER';
    gb.setColor(GREEN)
      .setFontMonofonto18()
      .setFontAlign(-1, -1)
      .drawString(
        gameOverText,
        (SCREEN_WIDTH - gb.stringWidth(gameOverText)) / 2,
        SCREEN_HEIGHT / 2,
      );

    const replayText = 'Press play to restart';
    gb.setColor(GREEN_DARK)
      .setFontMonofonto16()
      .setFontAlign(-1, -1)
      .drawString(
        replayText,
        (SCREEN_WIDTH - gb.stringWidth(replayText)) / 2,
        SCREEN_HEIGHT / 2 + 30,
      );

    if (gameOverInterval) {
      clearInterval(gameOverInterval);
      gameOverInterval = null;
    }

    // Restart game handling
    let playHandled = false;
    gameOverInterval = setInterval(() => {
      // When play button is pressed, restart the game
      if (Date.now() >= gameOverCooldown && BTN_PLAY.read()) {
        if (!playHandled) {
          playHandled = true;
          clearInterval(gameOverInterval);
          gameOverInterval = null;
          restartGame();
        }
      } else {
        playHandled = false;
      }
    }, FPS);
  }

  function drawHeader() {
    // Clear previous
    gb.setColor(BLACK).fillRect(HEADER_XY);

    const text =
      'ROBCO INDUSTRIES (TM) ' + GAME_NAME + ' v' + GAME_VERSION + ' PROTOCOL';

    gb.setColor(GREEN)
      .setFont(FONT)
      .setFontAlign(-1, -1)
      .drawString(
        text.toUpperCase(),
        HEADER_XY.x1 + HEADER.padding,
        HEADER_XY.y1 + HEADER.padding,
      );
  }

  function drawLog() {
    const lineHeight = 10;
    const maxLines = Math.floor((LOG_XY.y2 - LOG_XY.y1) / lineHeight);
    const entriesToShow = logEntries.slice(-maxLines);

    gb.setColor(BLACK).fillRect(LOG_XY);
    gb.setFont('6x8').setFontAlign(-1, -1);

    for (let i = 0; i < entriesToShow.length; i++) {
      const y = LOG_XY.y2 - lineHeight * (entriesToShow.length - i);
      const entry = entriesToShow[i];
      gb.setColor(GREEN).drawString(entry, LOG_XY.x1 + 2, y);
    }
  }

  function drawPasswordGrid(passwords, area, startAddress, junkLines) {
    const lineHeight = 10;
    gb.setFont('6x8').setFontAlign(-1, -1);

    for (let i = 0; i < passwords.length; i++) {
      const addr = '0xF' + (startAddress + i).toString(16).padStart(3, '0');
      const junk = junkLines[i];

      if (!junk || typeof junk.line !== 'string') {
        const error = `Invalid junk line at ${i}: ${JSON.stringify(junk)}`;
        throw new Error(error);
      }

      const line = junk.line;
      const y = area.y1 + i * lineHeight;
      gb.setColor(GREEN).drawString(addr + ' ' + line, area.x1 + 2, y);
    }
  }

  function drawPasswordMessage() {
    // Clear previous.
    gb.setColor(BLACK).fillRect(PASSWORD_MESSAGE_XY);

    let text = '';
    if (attemptsRemaining <= 0) {
      text = '!!! ACCESS DENIED !!! Select again to restart.';
    } else if (attemptsRemaining === 1) {
      text = '!!! WARNING: LOCKOUT IMMINENT !!!';
    } else {
      text = 'ENTER PASSWORD NOW';
    }

    gb.setColor(GREEN)
      .setFont(FONT)
      .setFontAlign(-1, -1)
      .drawString(
        text,
        PASSWORD_MESSAGE_XY.x1 + PASSWORD_MESSAGE.padding,
        PASSWORD_MESSAGE_XY.y1 + PASSWORD_MESSAGE.padding,
      );
  }

  function drawSuccessScreen() {
    isGameOver = true;
    gameOverCooldown = Date.now() + 1000;
    clearScreen();
    removeListeners();

    const successText = 'ACCESS GRANTED';
    gb.setColor(GREEN)
      .setFontMonofonto18()
      .setFontAlign(-1, -1)
      .drawString(
        successText,
        (SCREEN_WIDTH - gb.stringWidth(successText)) / 2,
        SCREEN_HEIGHT / 2,
      );

    const replayText = 'Press play to restart';
    gb.setColor(GREEN_DARK)
      .setFontMonofonto16()
      .setFontAlign(-1, -1)
      .drawString(
        replayText,
        (SCREEN_WIDTH - gb.stringWidth(replayText)) / 2,
        SCREEN_HEIGHT / 2 + 30,
      );

    if (gameOverInterval) {
      clearInterval(gameOverInterval);
      gameOverInterval = null;
    }

    let playHandled = false;
    gameOverInterval = setInterval(() => {
      // When play button is pressed, restart the game
      if (Date.now() >= gameOverCooldown && BTN_PLAY.read()) {
        if (!playHandled) {
          playHandled = true;
          clearInterval(gameOverInterval);
          gameOverInterval = null;
          restartGame();
        }
      } else {
        playHandled = false;
      }
    }, FPS);
  }

  function getJunkLine(len, embedWord) {
    const JUNK = '{}[]<>?/\\|!@#$%^&*()-_=+;:"\',.`~ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    const embedAt = (Math.random() * (len - embedWord.length)) | 0;
    for (let i = 0; i < len; i++) {
      if (i === embedAt) {
        result += embedWord;
        i += embedWord.length - 1;
      } else {
        result += JUNK[(Math.random() * JUNK.length) | 0];
      }
    }
    return { line: result, embedAt: embedAt };
  }

  function handleLeftKnob(dir) {
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir === 0) {
      select();
    } else {
      cursorRow = (cursorRow + (dir < 0 ? 1 : -1) + TOTAL_ROWS) % TOTAL_ROWS;

      const isLeft = cursorRow < MAX_ROWS_PER_COLUMN;
      const offset = isLeft ? 0 : MAX_ROWS_PER_COLUMN;

      const junk = isLeft
        ? junkLinesLeft[cursorRow]
        : junkLinesRight[cursorRow - offset];
      const word = isLeft
        ? LEFT_PASSWORDS[cursorRow]
        : RIGHT_PASSWORDS[cursorRow - offset];

      if (cursorCol >= junk.embedAt && cursorCol < junk.embedAt + word.length) {
        // Is inside word, snap to start
        cursorCol = junk.embedAt;
      }

      drawCursor();
    }
  }

  function handlePlayButton() {
    const playState = BTN_PLAY.read();
    const now = Date.now();

    if (
      playState &&
      !lastPlayState &&
      now - lastPlayPressTime >= KNOB_DEBOUNCE
    ) {
      lastPlayPressTime = now;

      if (!isGameOver) {
        select();
      }
    }

    lastPlayState = playState;
  }

  function handlePowerButton() {
    removeListeners();

    if (playButtonInterval) {
      clearInterval(playButtonInterval);
    }

    bC.clear(1).flip();
    E.reboot();
  }

  function handleRightKnob(dir) {
    if (dir === 0) {
      select();
    } else {
      const isLeft = cursorRow < MAX_ROWS_PER_COLUMN;
      const offset = isLeft ? 0 : MAX_ROWS_PER_COLUMN;
      const junk = isLeft
        ? junkLinesLeft[cursorRow]
        : junkLinesRight[cursorRow - offset];
      const word = isLeft
        ? LEFT_PASSWORDS[cursorRow]
        : RIGHT_PASSWORDS[cursorRow - offset];

      const lineLength = junk.line.length;
      const inWord =
        cursorCol >= junk.embedAt && cursorCol < junk.embedAt + word.length;

      let step = 1;
      if (inWord) {
        if (dir > 0) {
          // Scroll right to end of word
          step = Math.max(1, junk.embedAt + word.length - cursorCol);
        } else {
          // Scroll left to start of word
          step = Math.max(1, cursorCol - junk.embedAt);
        }
      }

      cursorCol =
        (cursorCol + (dir > 0 ? step : -step) + lineLength) % lineLength;
      drawCursor();
    }
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

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
  }

  function restartGame() {
    if (gameOverInterval) {
      clearInterval(gameOverInterval);
      gameOverInterval = null;
    }
    if (playButtonInterval) {
      clearInterval(playButtonInterval);
      playButtonInterval = null;
    }

    isGameOver = false;

    cursorCol = 0;
    cursorRow = 0;

    attemptsRemaining = MAX_ATTEMPTS;
    selectedWord = null;
    logEntries = [];
    junkLinesLeft = [];
    junkLinesRight = [];
    correctPassword = null;

    drawCursor.prevRow = undefined;
    drawCursor.prevCol = undefined;

    self.run();
  }

  function select() {
    const isLeft = cursorRow < MAX_ROWS_PER_COLUMN;
    const offset = isLeft ? 0 : MAX_ROWS_PER_COLUMN;

    const junk = isLeft
      ? junkLinesLeft[cursorRow]
      : junkLinesRight[cursorRow - offset];
    const word = isLeft
      ? LEFT_PASSWORDS[cursorRow]
      : RIGHT_PASSWORDS[cursorRow - offset];

    const inWord =
      cursorCol >= junk.embedAt && cursorCol < junk.embedAt + word.length;

    const lineHeight = 10;
    const maxLines = Math.floor((LOG_XY.y2 - LOG_XY.y1) / lineHeight);

    if (attemptsRemaining <= 0) {
      // Go to game over sreen
      drawGameOverScreen();
      return;
    }

    if (inWord) {
      selectedWord = junk.line.substr(junk.embedAt, word.length);
      const existing = logEntries.findIndex((e) => e === '> ' + selectedWord);
      if (existing !== -1) {
        const likenessLine = logEntries[existing + 1];
        logEntries.push('> ' + selectedWord);
        if (likenessLine && likenessLine.startsWith('>')) {
          logEntries.push(likenessLine);
        }
      } else {
        if (selectedWord === correctPassword) {
          logEntries.push('> ' + selectedWord);
          logEntries.push('> ACCESS GRANTED');
          drawLog();
          drawSuccessScreen();
          return;
        } else {
          let likeness = 0;
          if (selectedWord.length === correctPassword.length) {
            for (let i = 0; i < selectedWord.length; i++) {
              if (selectedWord[i] === correctPassword[i]) likeness++;
            }
          }
          while (logEntries.length >= maxLines - 1) {
            logEntries.shift();
          }
          logEntries.push('> ' + selectedWord);
          logEntries.push(
            '> ' + likeness + '/' + correctPassword.length + ' correct.',
          );
          attemptsRemaining--;
          drawAttemptCounter();
          drawPasswordMessage();
          if (attemptsRemaining === 0) {
            logEntries.push('> Entry denied');
          }
        }
      }
    } else {
      selectedWord = junk.line[cursorCol];
      if (logEntries.length >= maxLines) {
        logEntries.shift();
      }
      logEntries.push('> [' + selectedWord + ']');
    }

    drawLog();
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
  }

  function setupJunkLines() {
    const leftLength = LEFT_PASSWORDS.length;
    const rightLength = RIGHT_PASSWORDS.length;

    if (leftLength === 0 || rightLength === 0) {
      throw new Error('Password lists cannot be empty');
    }

    junkLinesLeft = LEFT_PASSWORDS.map((p) => getJunkLine(12, p));
    junkLinesRight = RIGHT_PASSWORDS.map((p) => getJunkLine(12, p));

    if (
      junkLinesLeft.length !== leftLength ||
      junkLinesRight.length !== rightLength
    ) {
      throw new Error('Mismatch between password lists and junk lines');
    }

    const allPasswords = LEFT_PASSWORDS.concat(RIGHT_PASSWORDS);
    correctPassword = allPasswords[(Math.random() * allPasswords.length) | 0];
    console.log('Password: ', correctPassword);
  }

  function startGame() {
    Pip.removeAllListeners(VIDEO_STOPPED);

    drawHeader();
    drawPasswordMessage();
    drawAttemptCounter();

    setupJunkLines();
    drawPasswordGrid(
      LEFT_PASSWORDS,
      PASSWORD_GRID_LEFT_XY,
      0x964,
      junkLinesLeft,
    );
    drawPasswordGrid(
      RIGHT_PASSWORDS,
      PASSWORD_GRID_RIGHT_XY,
      0xa30,
      junkLinesRight,
    );

    drawBoundaries(SCREEN_XY);
    drawBoundaries(HEADER_XY);
    drawBoundaries(PASSWORD_MESSAGE_XY);
    drawBoundaries(ATTEMPT_COUNTER_XY);
    drawBoundaries(PASSWORD_GRID_LEFT_XY);
    drawBoundaries(PASSWORD_GRID_RIGHT_XY);
    drawBoundaries(LOG_XY);

    setListeners();

    if (gameOverInterval) {
      clearInterval(gameOverInterval);
    }
    if (playButtonInterval) {
      clearInterval(playButtonInterval);
    }
    playButtonInterval = setInterval(handlePlayButton, FPS);
  }

  self.run = function () {
    if (!gb || !bC) {
      throw new Error('Pip-Boy graphics not available!');
    }

    bC.clear();
    clearScreen();
    removeListeners();

    // Handle power button press to restart the device
    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: !0,
    });

    if (!DEBUG) {
      Pip.videoStart('BOOT/BOOT.avi', { x: 40 });
      Pip.on(VIDEO_STOPPED, startGame);
    } else {
      startGame();
    }
  };

  return self;
}

PortaHack().run();
