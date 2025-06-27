function PortaHack() {
  const self = {};

  const GAME_NAME = 'Porta Hack';
  const GAME_VERSION = '1.0.0';
  const DEBUG = true;

  // Game mechanics
  const FPS = 1000 / 60;
  const MAX_ATTEMPTS = 4; // Max attempts
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

  function drawHeader() {
    // Clear previous
    gb.setColor(BLACK).fillRect(HEADER_XY);

    const text =
      'ROBCO INDUSTRIES (TM) ' + GAME_NAME + ' v' + GAME_VERSION + ' PROTOCOL';
    const textHeight = HEADER.textHeight;

    // Draw header message
    gb.setColor(GREEN)
      .setFont(FONT_SIZE)
      .setFontAlign(-1, -1)
      .drawString(
        text.toUpperCase(),
        HEADER_XY.x1 + HEADER.padding,
        HEADER_XY.y1 + HEADER.padding,
      );
  }

  function drawPasswordGrid(passwords, area, startAddress) {
    const lineHeight = 10;
    const addressBase = startAddress;
    const charsPerLine = 12;
    gb.setColor(GREEN).setFont('6x8').setFontAlign(-1, -1);

    for (let i = 0; i < passwords.length; i++) {
      const addr = '0xF' + (addressBase + i).toString(16).padStart(3, '0');
      const junkLeft = getJunkLine(charsPerLine, passwords[i]);
      gb.drawString(
        addr + ' ' + junkLeft,
        area.x1 + 2,
        area.y1 + i * lineHeight,
      );
    }
  }

  function drawPasswordMessage() {
    // Clear previous.
    gb.setColor(BLACK).fillRect(PASSWORD_MESSAGE_XY);

    const textHeight = PASSWORD_MESSAGE.textHeight;
    gb.setColor(GREEN).setFont(FONT_SIZE).setFontAlign(-1, -1);

    const isWarning = attemptsRemaining <= 1;

    // Draw password message.
    if (isWarning) {
      // Warning message
      gb.drawString(
        '!!! WARNING: LOCKOUT IMMINENT !!!',
        PASSWORD_MESSAGE_XY.x1 + PASSWORD_MESSAGE.padding,
        PASSWORD_MESSAGE_XY.y1 + PASSWORD_MESSAGE.padding,
      );
    } else {
      // Default message
      gb.drawString(
        'ENTER PASSWORD NOW',
        PASSWORD_MESSAGE_XY.x1 + PASSWORD_MESSAGE.padding,
        PASSWORD_MESSAGE_XY.y1 + PASSWORD_MESSAGE.padding,
      );
    }
  }

  function getJunkLine(len, embedWord) {
    const JUNK = '{}[]<>?/\\|!@#$%^&*()-_=+;:\'",.`~ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let line = '';
    const embedAt = (Math.random() * (len - embedWord.length)) | 0;
    for (let i = 0; i < len; i++) {
      if (i === embedAt) {
        line += embedWord;
        i += embedWord.length - 1;
      } else {
        line += JUNK[(Math.random() * JUNK.length) | 0];
      }
    }
    return line;
  }

  function handleLeftKnob(dir) {
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir === 0) {
      // Click
      // TODO - Select the highlighted password
    } else {
      // Rotate
      // TODO - Move selection up or down
    }
  }

  function handlePowerButton() {
    removeListeners();

    if (mainLoopInterval) {
      clearInterval(mainLoopInterval);
    }

    bC.clear(1).flip();
    E.reboot();
  }

  function handleRightKnob(dir) {
    // TODO - Move selection right or left
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

    drawPasswordGrid(LEFT_PASSWORDS, PASSWORD_GRID_LEFT_XY, 0x964);
    drawPasswordGrid(RIGHT_PASSWORDS, PASSWORD_GRID_RIGHT_XY, 0xa30);

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
