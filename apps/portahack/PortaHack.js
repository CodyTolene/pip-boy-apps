function PortaHack() {
  const self = {};

  const GAME_NAME = 'Porta Hack';
  const GAME_VERSION = '1.0.0';
  const DEBUG = true;

  // Game
  const MAX_ATTEMPTS = 4; // Max attempts
  let attemptsRemaining = MAX_ATTEMPTS;

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
    // + 8 text + 2 padding top + 2 padding bottom
    height: 8 + 2 * 2,
    padding: 2,
    textHeight: 8,
  };
  const HEADER_XY = {
    x1: SCREEN_XY.x1,
    x2: SCREEN_XY.x2,
    y1: SCREEN_XY.y1,
    y2: SCREEN_XY.y1 + HEADER.height,
  };

  // Password Message
  const PASSWORD_MESSAGE = {
    // + 8 text + 2 padding top + 2 padding bottom
    height: 8 + 2 * 2,
    padding: 2,
    textHeight: 8,
  };
  const PASSWORD_MESSAGE_XY = {
    x1: SCREEN_XY.x1,
    x2: SCREEN_XY.x2,
    y1: HEADER_XY.y2,
    y2: HEADER_XY.y2 + PASSWORD_MESSAGE.height,
  };

  // Password Attempt Counter
  const ATTEMPT_COUNTER = {
    // + 8 text * 3 lines + 2 padding top + 2 padding bottom
    height: 8 * 3 + 2 + 2,
    padding: 2,
    textHeight: 8,
  };
  const ATTEMPT_COUNTER_XY = {
    x1: SCREEN_XY.x1,
    x2: SCREEN_XY.x2,
    y1: PASSWORD_MESSAGE_XY.y2,
    y2: PASSWORD_MESSAGE_XY.y2 + ATTEMPT_COUNTER.height,
  };

  // Password Grids
  const GRID_LEFT_XY = {
    x1: SCREEN_XY.x1,
    x2: SCREEN_XY.x1 + (SCREEN_XY.x2 - SCREEN_XY.x1) / 2,
    y1: ATTEMPT_COUNTER_XY.y2,
    y2: SCREEN_XY.y2,
  };
  const GRID_RIGHT_XY = {
    x1: SCREEN_XY.x1 + (SCREEN_XY.x2 - SCREEN_XY.x1) / 2,
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
    'FREEDOM', 'FRENCH', 'FLEETING', 'FLOP', 'VAULT',
  ];

  function clearScreen() {
    gb.setColor(BLACK).fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  function drawAttemptCounter(attemptsRemaining) {
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
      .setFont('6x' + textHeight)
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
      .setFont('6x' + textHeight)
      .setFontAlign(-1, -1)
      .drawString(
        text,
        HEADER_XY.x1 + HEADER.padding,
        HEADER_XY.y1 + HEADER.padding,
      );
  }

  function drawPasswordMessage(isWarning) {
    // Clear previous.
    gb.setColor(BLACK).fillRect(PASSWORD_MESSAGE_XY);

    const textHeight = PASSWORD_MESSAGE.textHeight;
    gb.setColor(GREEN)
      .setFont('6x' + textHeight)
      .setFontAlign(-1, -1);

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

  self.run = function () {
    if (!gb) {
      throw new Error('Pip-Boy graphics buffer not available!');
    }

    bC.clear();
    clearScreen();

    drawHeader();
    drawPasswordMessage(false);
    drawAttemptCounter(attemptsRemaining);

    drawBoundaries(SCREEN_XY);
    drawBoundaries(HEADER_XY);
    drawBoundaries(PASSWORD_MESSAGE_XY);
    drawBoundaries(ATTEMPT_COUNTER_XY);
    drawBoundaries(GRID_LEFT_XY);
    drawBoundaries(GRID_RIGHT_XY);
  };

  return self;
}

PortaHack().run();
