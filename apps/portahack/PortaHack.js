function PortaHack() {
  const self = {};

  const GAME_NAME = 'Porta Hack';
  const GAME_VERSION = '1.0.0';
  const DEBUG = false;

  // Game mechanics
  const FPS = 1000 / 60;
  const MAX_ATTEMPTS = 4;
  let attemptsRemaining = MAX_ATTEMPTS;

  // Intervals
  let mainLoopInterval = null;

  // Font
  const FONT_HEIGHT = 8;
  const FONT_SIZE = '6x' + FONT_HEIGHT;

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
    x2: SCREEN_XY.x1 + (SCREEN_XY.x2 - SCREEN_XY.x1) * 0.38,
    y1: ATTEMPT_COUNTER_XY.y2,
    y2: SCREEN_XY.y2,
  };
  const PASSWORD_GRID_RIGHT_XY = {
    x1: PASSWORD_GRID_LEFT_XY.x2,
    x2: PASSWORD_GRID_LEFT_XY.x2 + (SCREEN_XY.x2 - SCREEN_XY.x1) * 0.38,
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

  // Colors
  const BLACK = '#000000';
  const WHITE = '#ffffff';
  const GREEN = '#00ff00';
  const GREEN_DARK = '#007f00';
  const GREEN_DARKER = '#003300';

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

  let cursorRow = 0;
  let cursorCol = 0;
  let selectedWord = null;
  let junkLinesLeft = [];
  let junkLinesRight = [];

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
    let text = attemptsRemaining + ' ATTEMPT(S) LEFT: ';
    // Draw the number of attempts left
    for (let i = 0; i < attemptsRemaining; i++) {
      // TODO - Replace `[i]` with square characters
      text += '[' + (i + 1) + '] ';
    }

    gb.setColor(GREEN)
      .setFont(FONT_SIZE)
      .setFontAlign(-1, -1)
      .drawString(
        text,
        ATTEMPT_COUNTER_XY.x1 + padding,
        // Please on second of three lines
        ATTEMPT_COUNTER_XY.y1 + textHeight + padding,
      );
  }

  function drawBoundaries(area) {
    if (!DEBUG) {
      return; // Skip drawing boundaries if not in debug mode
    }
    gb.setColor(WHITE).drawRect(area);
  }

  function drawCursor() {
    const addrLen = 7;

    // Clear and re-draw the old line
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

    // Save new cursor position
    drawCursor.prevRow = cursorRow;
    drawCursor.prevCol = cursorCol;

    // Highlight current character
    const isLeft = cursorRow < MAX_ROWS_PER_COLUMN;
    const area = isLeft ? PASSWORD_GRID_LEFT_XY : PASSWORD_GRID_RIGHT_XY;
    const offset = isLeft ? 0 : MAX_ROWS_PER_COLUMN;
    const junk = isLeft
      ? junkLinesLeft[cursorRow]
      : junkLinesRight[cursorRow - offset];
    const y = area.y1 + (cursorRow - offset) * 10;
    const charX = area.x1 + 2 + (addrLen + cursorCol) * 6;

    gb.setColor(GREEN_DARK).fillRect(charX, y, charX + 6, y + 10);
    gb.setColor(GREEN).drawString(junk.line[cursorCol], charX, y);
  }

  function drawHeader() {
    // Clear previous
    gb.setColor(BLACK).fillRect(HEADER_XY);
    const text =
      'ROBCO INDUSTRIES (TM) ' + GAME_NAME + ' v' + GAME_VERSION + ' PROTOCOL';
    gb.setColor(GREEN)
      .setFont(FONT_SIZE)
      .setFontAlign(-1, -1)
      .drawString(
        text.toUpperCase(),
        HEADER_XY.x1 + HEADER.padding,
        HEADER_XY.y1 + HEADER.padding,
      );
  }

  function drawPasswordGrid(passwords, area, startAddress, junkLines, isLeft) {
    const lineHeight = 10;
    gb.setFont('6x8').setFontAlign(-1, -1);

    for (let i = 0; i < passwords.length; i++) {
      const addr = '0xF' + (startAddress + i).toString(16).padStart(3, '0');
      const junk = junkLines[i];

      if (!junk || typeof junk.line !== 'string') {
        console.log('Missing junk line at index:', i);
        continue;
      }

      const line = junk.line;
      const y = area.y1 + i * lineHeight;
      gb.setColor(GREEN).drawString(addr + ' ' + line, area.x1 + 2, y);
    }
  }

  function drawPasswordMessage() {
    // Clear previous.
    gb.setColor(BLACK).fillRect(PASSWORD_MESSAGE_XY);
    const isWarning = attemptsRemaining <= 1;
    const text = isWarning
      ? '!!! WARNING: LOCKOUT IMMINENT !!!'
      : 'ENTER PASSWORD NOW';
    gb.setColor(GREEN)
      .setFont(FONT_SIZE)
      .setFontAlign(-1, -1)
      .drawString(
        text,
        PASSWORD_MESSAGE_XY.x1 + PASSWORD_MESSAGE.padding,
        PASSWORD_MESSAGE_XY.y1 + PASSWORD_MESSAGE.padding,
      );
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
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) return;
    lastLeftKnobTime = now;

    if (dir === 0) {
      // click
      // TODO - Select the highlighted password
    } else {
      cursorCol = (cursorCol + (dir > 0 ? 1 : -1) + 12) % 12;
      drawCursor();
    }
  }

  function handlePowerButton() {
    removeListeners();
    if (mainLoopInterval) clearInterval(mainLoopInterval);
    bC.clear(1).flip();
    E.reboot();
  }

  function handleRightKnob(dir) {
    cursorRow = (cursorRow + (dir > 0 ? 1 : -1) + TOTAL_ROWS) % TOTAL_ROWS;
    drawCursor();
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

  function main() {
    if (BTN_PLAY.read()) {
      // Click
      // TODO - Select the highlighted password
    }
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
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
      throw new Error('Password slices are empty');
    }

    junkLinesLeft = LEFT_PASSWORDS.map((p) => getJunkLine(12, p));
    junkLinesRight = RIGHT_PASSWORDS.map((p) => getJunkLine(12, p));

    if (
      junkLinesLeft.length !== leftLength ||
      junkLinesRight.length !== rightLength
    ) {
      throw new Error('Mismatch between password lists and junk lines');
    }
  }

  self.run = function () {
    if (!gb || !bC) {
      throw new Error('Pip-Boy graphics not available!');
    }

    bC.clear();
    clearScreen();
    removeListeners();

    drawHeader();
    drawPasswordMessage();
    drawAttemptCounter();

    setupJunkLines();
    drawPasswordGrid(
      LEFT_PASSWORDS,
      PASSWORD_GRID_LEFT_XY,
      0x964,
      junkLinesLeft,
      true,
    );
    drawPasswordGrid(
      RIGHT_PASSWORDS,
      PASSWORD_GRID_RIGHT_XY,
      0xa30,
      junkLinesRight,
      false,
    );

    drawBoundaries(SCREEN_XY);
    drawBoundaries(HEADER_XY);
    drawBoundaries(PASSWORD_MESSAGE_XY);
    drawBoundaries(ATTEMPT_COUNTER_XY);
    drawBoundaries(PASSWORD_GRID_LEFT_XY);
    drawBoundaries(PASSWORD_GRID_RIGHT_XY);
    drawBoundaries(LOG_XY);

    setListeners();

    if (mainLoopInterval) {
      clearInterval(mainLoopInterval);
    }
    mainLoopInterval = setInterval(main, FPS);

    // Handle power button press to restart the device
    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: !0,
    });
  };

  return self;
}

PortaHack().run();
