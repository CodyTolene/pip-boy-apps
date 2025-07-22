// =============================================================================
//  Name: Porta Hack
//  License: CC-BY-NC-4.0
//  Repository(s):
//     https://github.com/CodyTolene/pip-boy-apps
//     https://github.com/pip-4111/Porta-Hack
//     https://github.com/beaverboy-12
// =============================================================================

function PortaHack() {
  const self = {};

  const GAME_NAME = 'Porta Hack';
  const GAME_VERSION = '1.1.0';
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
  let foundSnippets = [];

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
  const VIDEO_BOOT = 'USER/PORTAHACK/STARTHACK.avi';

  // All available passwords to select from
  // prettier-ignore
  const PASSWORDS = [
    'STORY', 'SYNOPSIS', 'THE', 'PLAYER', 'CHARACTER', 'PC', 'STUMBLES', 'ONTO', 'PLOT', 'BUILD', 'HYPERLIGHT', 'TRANSMITTER', 'THAT', 'WILL', 'BE', 'USED', 'COMMAND', 'FORGOTTEN', 'ORBITAL', 
    'WEAPONS', 'PLATFORM', 'MYSTERIOUS', 'WASTELORD', 'WITH', 'MESSIANIC', 'COMPLEX', 'KNOWN', 'AS', 'PUPPETMASTER', 'FOR', 'HIS', 'ABILITY', 'CONTROL', 'MINDS', 'OF', 'DANGEROUS', 'MONSTERS', 
    'HAS', 'SENT', 'ARMIES', 'SCOUR', 'WASTES', 'PIECES', 'TECHNOLOGY', 'IN', 'ORDER', 'BUILDER', 'ABLE', 'HARNESS', 'AWESOME', 'DESTRUCTIVE', 'POWER', 'AND', 'BECOME', 'ABSOLUTE', 'RULER', 'IS', 
    'TOSSED', 'INTO', 'MIDDLE', 'CONFLICT', 'WHEN', 'RAIDERS', 'KIDNAP', 'ENSLAVE', 'KINDLY', 'VILLAGERS', 'WHO', 'HAVE', 'SAVED', 'LIFE', 'AT', 'START', 'GAME', 'STRUGGLES', 'FIND', 'FREE', 'HE', 
    'UNCOVERS', 'MUST', 'ACT', 'STOP', 'DISCOVER', 'WAY', 'THWART', 'PLANS', 'BY', 'UNLOCKING', 'SECRET', 'ANDROID', 'CITIZENS', 'MAYVILLE', 'AI', 'CONTROLS', 'THEM', 'HIDDEN', 'DEEP', 'BENEATH', 'CORE', 
    'OFFERS', 'HELP', 'BEFORE', 'CAN', 'COMPLETE', 'FORGES', 'AN', 'UNLIKELY', 'ALLIANCE', 'BETWEEN', 'CITY', 'MUTANTS', 'GROUP', 'SCIENTISTS', 'SURVIVORS', 'FROM', 'BASE', 'RACE', 'AGAINST', 'FORCES', 'PARTS', 
    // 'NEEDED', 'LAST', 'MINUTE', 'LEARNS', 'USING', 'HIM', 'SO', 'RULE', 'STEAD', 'ONLY', 'LEADING', 'ITS', 'OWN', 'ANDROIDS', 'REVOLUTION', 'IT', 'FOUND', 'VULNERABLE', 'ATTACK', 'BRIEF', 'PERIOD', 'JUST', 'AFTER', 
    // 'BEEN', 'BUILT', 'PRESSURE', 'ON', 'COHORTS', 'CLOCK', 'SHUT', 'DOWN', 'DESTROY', 'IF', 'FAILS', 'THEN', 'STERILIZE', 'EARTH', 'OR', 'ENACT', 'INSANE', 'DICTATES', 'WINS', 'OBLITERATE', 'FOES', 'GAIN', 
    // 'ACCESS', 'ADVANCED', 'MAY', 'OPEN', 'GATEWAY', 'VERY', 'STARS', 'FALLOUT', 'CARRIED', 'OVER', 'GENERATED', 'AFRESH', 'ALL', 'PCS', 'ARE', 'ASSUMED', 'COME', 'VAULT', 'UNEXPECTED', 'AWAKENING', 'WANDERING', 
    // 'DESERT', 'LEAVING', 'END', 'HUNGRY', 'THIRSTY', 'WELL', 'ARMED', 'ARMORED', 'USES', 'RESERVES', 'STRENGTH', 'DRAG', 'HIMSELF', 'OASIS', 'NEARS', 'GEIGER', 'COUNTER', 'GOES', 'OFF', 'LIKE', 'PACINKO', 'MACHINE', 
    // 'UNABLE', 'PUSH', 'ANY', 'FARTHER', 'SLIDES', 'UNCONSCIOUSNESS', 'AWAKENED', 'VOICE', 'OLD', 'WOMAN', 'GENTLY', 'EXPLAINS', 'SHE', 'LEADER', 'HER', 'VILLAGE', 'ONE', 'THEIR', 'FORAGING', 'PARTIES', 'BROUGHT',  
  ];
  const MAX_ROWS_PER_COLUMN = 25;
  const TOTAL_ROWS = MAX_ROWS_PER_COLUMN * 2;
  const PASSWORDS_SHUFFLED = PASSWORDS.slice();
  shuffle(PASSWORDS_SHUFFLED);

  const LEFT_PASSWORDS = PASSWORDS_SHUFFLED.slice(0, MAX_ROWS_PER_COLUMN);
  const RIGHT_PASSWORDS = PASSWORDS_SHUFFLED.slice(
    MAX_ROWS_PER_COLUMN,
    TOTAL_ROWS,
  );
  // ──────── PICK SECRET PASSWORD ────────
  const ALL_ON_SCREEN = LEFT_PASSWORDS.concat(RIGHT_PASSWORDS);
  correctPassword =
    ALL_ON_SCREEN[Math.floor(Math.random() * ALL_ON_SCREEN.length)];

  // ──────── RESERVE A SLOT FOR IT ────────
  const forcedSide = LEFT_PASSWORDS.includes(correctPassword) ? 'L' : 'R';
  const forcedRow =
    forcedSide === 'L'
      ? LEFT_PASSWORDS.indexOf(correctPassword)
      : RIGHT_PASSWORDS.indexOf(correctPassword);

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
  function scanSnippets() {
    foundSnippets = [];
    const pairs = { '(': ')', '{': '}', '[': ']', '<': '>' };

    // helper to scan one side
    function scanSide(junkLines, offset) {
      junkLines.forEach((junk, rowIdx) => {
        const line = junk.line;
        for (let i = 0; i < line.length; i++) {
          const open = line[i];
          const close = pairs[open];
          if (!close) continue;
          // look ahead up to 6 chars
          for (let j = i + 1; j < Math.min(i + 7, line.length); j++) {
            if (line[j] === close) {
              foundSnippets.push({
                row: rowIdx + offset,
                startCol: i,
                endCol: j,
              });
              break;
            }
          }
        }
      });
    }

    scanSide(junkLinesLeft, 0);
    scanSide(junkLinesRight, MAX_ROWS_PER_COLUMN);
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

    // 1) Clear previous highlight
    if (drawCursor.prevRow !== undefined && drawCursor.prevCol !== undefined) {
      const prevIsLeft = drawCursor.prevRow < MAX_ROWS_PER_COLUMN;
      const prevArea = prevIsLeft
        ? PASSWORD_GRID_LEFT_XY
        : PASSWORD_GRID_RIGHT_XY;
      const prevOff = prevIsLeft ? 0 : MAX_ROWS_PER_COLUMN;
      const prevJunk = prevIsLeft
        ? junkLinesLeft[drawCursor.prevRow]
        : junkLinesRight[drawCursor.prevRow - prevOff];
      const prevY = prevArea.y1 + (drawCursor.prevRow - prevOff) * 10;
      const prevAddr =
        '0xF' + (0x964 + drawCursor.prevRow).toString(16).padStart(3, '0');

      gb.setColor(BLACK)
        .fillRect(prevArea.x1, prevY, prevArea.x2, prevY + 10)
        .setColor(GREEN)
        .setFont(FONT)
        .setFontAlign(-1, -1)
        .drawString(prevAddr + ' ' + prevJunk.line, prevArea.x1 + 2, prevY);
    }

    // 2) Remember for next frame
    drawCursor.prevRow = cursorRow;
    drawCursor.prevCol = cursorCol;

    // 3) Draw this full line
    const addr = '0xF' + (0x964 + cursorRow).toString(16).padStart(3, '0');
    gb.setColor(GREEN)
      .setFont(FONT)
      .setFontAlign(-1, -1)
      .drawString(addr + ' ' + line, area.x1 + 2, y);

    // 4) Bracket-snippet highlight?
    const snippet = foundSnippets.find(
      (s) =>
        s.row === cursorRow && cursorCol >= s.startCol && cursorCol <= s.endCol,
    );
    if (snippet) {
      const xSnip = area.x1 + 2 + (addrLen + snippet.startCol) * 6;
      const width = (snippet.endCol - snippet.startCol + 1) * 6;
      gb.setColor(GREEN)
        .fillRect(xSnip, y, xSnip + width, y + 10)
        .setColor(BLACK)
        .drawString(
          line.substring(snippet.startCol, snippet.endCol + 1),
          xSnip,
          y,
        );
      return;
    }

    // 5) Whole-word highlight only if it's not all dots
    const word = isLeft
      ? LEFT_PASSWORDS[cursorRow]
      : RIGHT_PASSWORDS[cursorRow - offset];
    const start = junk.embedAt;
    const length = word.length;
    const segment = line.substr(start, length);
    const isDots = /^\.+$/.test(segment);

    if (
      start >= 0 &&
      cursorCol >= start &&
      cursorCol < start + length &&
      !isDots
    ) {
      const xWord = area.x1 + 2 + (addrLen + start) * 6;
      gb.setColor(GREEN)
        .fillRect(xWord, y, xWord + length * 6, y + 10)
        .setColor(BLACK)
        .drawString(segment, xWord, y);
    } else {
      // 6) Fallback: highlight just the one character under the cursor
      const xChar = area.x1 + 2 + (addrLen + cursorCol) * 6;
      gb.setColor(GREEN)
        .fillRect(xChar, y, xChar + 6, y + 10)
        .setColor(BLACK)
        .drawString(line[cursorCol], xChar, y);
    }
  }

  function goToGameOverScreen() {
    drawGameOverScreen();
  }

  function drawGameOverScreen() {
    isGameOver = true;
    gameOverCooldown = Date.now() + 1000;
    clearScreen();
    removeListeners();

    const gameOverText = 'LOCKOUT INITIATED';
    gb.setColor(GREEN)
      .setFontMonofonto18()
      .setFontAlign(-1, -1)
      .drawString(
        gameOverText,
        (SCREEN_WIDTH - gb.stringWidth(gameOverText)) / 2,
        SCREEN_HEIGHT / 3,
      );

    const replayText = 'Press radio button to retry or power to exit';
    gb.setColor(GREEN_DARK)
      .setFontMonofonto16()
      .setFontAlign(-1, -1)
      .drawString(
        replayText,
        (SCREEN_WIDTH - gb.stringWidth(replayText)) / 2,
        SCREEN_HEIGHT / 3 + 30,
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
      text = '!!! ACCESS DENIED !!!    REBOOTING...';

      // Delay before switching to game over screen
      setTimeout(function () {
        goToGameOverScreen();
      }, 3500);
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
        SCREEN_HEIGHT / 3,
      );

    const replayText = 'Press radio to restart or power to exit';
    gb.setColor(GREEN_DARK)
      .setFontMonofonto16()
      .setFontAlign(-1, -1)
      .drawString(
        replayText,
        (SCREEN_WIDTH - gb.stringWidth(replayText)) / 2,
        SCREEN_HEIGHT / 3 + 30,
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
      return;
    }

    // Find which line & word we’re on
    const isLeft = cursorRow < MAX_ROWS_PER_COLUMN;
    const rowIdx = isLeft ? cursorRow : cursorRow - MAX_ROWS_PER_COLUMN;
    const junk = isLeft ? junkLinesLeft[rowIdx] : junkLinesRight[rowIdx];
    const word = isLeft ? LEFT_PASSWORDS[rowIdx] : RIGHT_PASSWORDS[rowIdx];
    const lineLen = junk.line.length;
    const start = junk.embedAt;

    // 1) Compute a minimum step of 1, or jump to word‐edge if inside it
    let step = 1;
    if (cursorCol >= start && cursorCol < start + word.length) {
      if (dir > 0) {
        // step right to end of word
        step = Math.max(1, start + word.length - cursorCol);
      } else {
        // step left to start of word
        step = Math.max(1, cursorCol - start);
      }
    }

    // 2) Calculate tentative newCol
    let newCol = cursorCol + (dir > 0 ? step : -step);

    // 3) Seamless cross‐grid wrap
    if (dir > 0 && isLeft && newCol >= lineLen) {
      cursorRow = rowIdx + MAX_ROWS_PER_COLUMN;
      cursorCol = 0;
      drawCursor();
      return;
    }
    if (dir < 0 && !isLeft && newCol < 0) {
      cursorRow = rowIdx;
      // land at the far right of left‐grid line
      cursorCol = junkLinesLeft[rowIdx].line.length - 1;
      drawCursor();
      return;
    }

    // 4) Otherwise just wrap within the same line
    cursorCol = ((newCol % lineLen) + lineLen) % lineLen;
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

  function removeDudWord() {
    // 1) Build a list of on-screen, non-correct words not already dotted out
    const candidates = [];

    LEFT_PASSWORDS.forEach((w, i) => {
      if (w === correctPassword) return;
      const obj = junkLinesLeft[i];
      if (!obj || typeof obj.line !== 'string') return;

      const start = obj.embedAt;
      // SKIP pure-junk or out-of-bounds
      if (start < 0 || start + w.length > obj.line.length) return;

      // only if it's not already dots
      if (!/^\.+$/.test(obj.line.substr(start, w.length))) {
        candidates.push({ side: 'L', row: i, word: w });
      }
    });

    RIGHT_PASSWORDS.forEach((w, i) => {
      if (w === correctPassword) return;
      const obj = junkLinesRight[i];
      if (!obj || typeof obj.line !== 'string') return;

      const start = obj.embedAt;
      if (start < 0 || start + w.length > obj.line.length) return;

      if (!/^\.+$/.test(obj.line.substr(start, w.length))) {
        candidates.push({ side: 'R', row: i, word: w });
      }
    });

    // 2) Nothing left?
    if (candidates.length === 0) return null;

    // 3) Pick one and dot it out in place
    const pick = candidates[(Math.random() * candidates.length) | 0];
    const arr = pick.side === 'L' ? junkLinesLeft : junkLinesRight;
    const obj = arr[pick.row];
    const start = obj.embedAt;
    const len = pick.word.length;
    const text = obj.line;

    // splice in the dots exactly at `start`
    obj.line = text.slice(0, start) + '.'.repeat(len) + text.slice(start + len);

    return pick;
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

  function handleSnippet(snippet) {
    let pick;

    if (Math.random() < 0.5) {
      attemptsRemaining = MAX_ATTEMPTS;
      logEntries.push('> TRIES RESET');
      drawAttemptCounter();
      drawPasswordMessage();
    } else {
      pick = removeDudWord();
      logEntries.push('> DUD REMOVED');
    }

    // redraw the log
    drawLog();

    // repaint only the changed line
    if (pick) {
      const isLeft = pick.side === 'L';
      const area = isLeft ? PASSWORD_GRID_LEFT_XY : PASSWORD_GRID_RIGHT_XY;
      const rowIndex = pick.row; // no offset!
      const baseAddress = isLeft ? 0x964 : 0xa30;
      const addr =
        '0xF' + (baseAddress + rowIndex).toString(16).padStart(3, '0');
      const lineHeight = 10;
      const y = area.y1 + rowIndex * lineHeight;

      // clear the old text
      gb.setColor(BLACK).fillRect(area.x1, y, area.x2, y + lineHeight);

      // draw the new dotted‐out line
      const newLine = isLeft
        ? junkLinesLeft[rowIndex].line
        : junkLinesRight[rowIndex].line;
      gb.setColor(GREEN)
        .setFont('6x8')
        .setFontAlign(-1, -1)
        .drawString(addr + ' ' + newLine, area.x1 + 2, y);
    }

    // redraw cursor highlight and grid borders
    drawCursor();
    drawBoundaries(PASSWORD_GRID_LEFT_XY);
    drawBoundaries(PASSWORD_GRID_RIGHT_XY);

    // remove that snippet so it can't be reused
    foundSnippets = foundSnippets.filter((s) => s !== snippet);
  }

  function select() {
    // 1) Snippet check
    const snippet = foundSnippets.find(
      (s) =>
        s.row === cursorRow && cursorCol >= s.startCol && cursorCol <= s.endCol,
    );
    if (snippet) {
      handleSnippet(snippet);
      return;
    }

    // 2) Pick the right column and row
    const isLeft = cursorRow < MAX_ROWS_PER_COLUMN;
    const rowIdx = isLeft ? cursorRow : cursorRow - MAX_ROWS_PER_COLUMN;
    const junk = isLeft ? junkLinesLeft[rowIdx] : junkLinesRight[rowIdx];
    const wordList = isLeft ? LEFT_PASSWORDS : RIGHT_PASSWORDS;
    const word = wordList[rowIdx];

    // 3) Sanity-check our junk object
    if (
      !junk ||
      typeof junk.line !== 'string' ||
      typeof junk.embedAt !== 'number'
    ) {
      console.error('select(): invalid junk at row', cursorRow, junk);
      return;
    }

    // 4) Grab embedAt and the text segment
    const embedAt = junk.embedAt;
    const fullLineText = junk.line;
    const segment = fullLineText.slice(embedAt, embedAt + word.length);

    // 5) See if it’s been dotted out already
    const isDottedOut = /^\.+$/.test(segment);
    const inWord =
      !isDottedOut && cursorCol >= embedAt && cursorCol < embedAt + word.length;

    // 6) Drop the initial “> . ” prompt
    if (logEntries.length === 1 && logEntries[0] === '> . ') {
      logEntries.pop();
    }

    // 7) Game-over guard
    if (attemptsRemaining <= 0) {
      drawGameOverScreen();
      return;
    }

    // 8) Handle a full-word selection
    if (inWord) {
      selectedWord = segment;
      const existing = logEntries.findIndex((e) => e === '> ' + selectedWord);

      if (existing !== -1) {
        // Re-show likeness
        const likenessLine = logEntries[existing + 1];
        logEntries.push('> ' + selectedWord);
        if (likenessLine && likenessLine.startsWith('>')) {
          logEntries.push(likenessLine);
        }
      } else {
        // New guess
        if (selectedWord === correctPassword) {
          logEntries.push('> ' + selectedWord);
          logEntries.push('> ACCESS GRANTED');
          drawLog();
          drawSuccessScreen();
          return;
        }
        // Wrong guess: compute likeness
        let likeness = 0;
        if (segment.length === correctPassword.length) {
          for (let i = 0; i < segment.length; i++) {
            if (segment[i] === correctPassword[i]) likeness++;
          }
        }
        // Keep log from overflowing
        const maxLines = Math.floor((LOG_XY.y2 - LOG_XY.y1) / 10) - 1;
        while (logEntries.length > maxLines) logEntries.shift();
        logEntries.push('> ' + selectedWord);
        logEntries.push(`> [${likeness}]`);
        attemptsRemaining--;
        drawAttemptCounter();
        drawPasswordMessage();
        if (attemptsRemaining === 0) logEntries.push('> Entry denied');
      }
    } else {
      // 9) Single junk-char selection
      selectedWord = fullLineText[cursorCol];
      const maxLines = Math.floor((LOG_XY.y2 - LOG_XY.y1) / 10);
      if (logEntries.length >= maxLines) logEntries.shift();
      logEntries.push('> [' + selectedWord + ']');
    }

    // 10) Final redraw
    drawLog();
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
  }

  function getJunkLine(len, embedWord) {
    const JUNK = '{}[]<>?/\\|!@#$%^&*()-_=+;:"\',.`~';

    // if no word, generate pure junk and set embedAt to len (never used as a valid index)
    if (!embedWord) {
      let junkOnly = '';
      for (let i = 0; i < len; i++) {
        junkOnly += JUNK[(Math.random() * JUNK.length) | 0];
      }
      return { line: junkOnly, embedAt: len };
    }

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
    return { line: result, embedAt };
  }

  function setupJunkLines() {
    // 1) Pick secret each run
    const allOnScreen = LEFT_PASSWORDS.concat(RIGHT_PASSWORDS);
    correctPassword =
      allOnScreen[Math.floor(Math.random() * allOnScreen.length)];
    const forcedSide = LEFT_PASSWORDS.includes(correctPassword) ? 'L' : 'R';
    const forcedRow =
      forcedSide === 'L'
        ? LEFT_PASSWORDS.indexOf(correctPassword)
        : RIGHT_PASSWORDS.indexOf(correctPassword);

    const PURE_JUNK_CHANCE = 0.4;

    junkLinesLeft = LEFT_PASSWORDS.map((word, i) => {
      if (forcedSide === 'L' && i === forcedRow) {
        return getJunkLine(12, correctPassword);
      }
      return Math.random() < PURE_JUNK_CHANCE
        ? getJunkLine(12, '')
        : getJunkLine(12, word);
    });

    junkLinesRight = RIGHT_PASSWORDS.map((word, i) => {
      if (forcedSide === 'R' && i === forcedRow) {
        return getJunkLine(12, correctPassword);
      }
      return Math.random() < PURE_JUNK_CHANCE
        ? getJunkLine(12, '')
        : getJunkLine(12, word);
    });
  }

  function startGame() {
    // ─── 1) Pick a fresh secret and reserve its slot ───
    const allOnScreen = LEFT_PASSWORDS.concat(RIGHT_PASSWORDS);
    correctPassword =
      allOnScreen[Math.floor(Math.random() * allOnScreen.length)];
    forcedSide = LEFT_PASSWORDS.includes(correctPassword) ? 'L' : 'R';
    forcedRow =
      forcedSide === 'L'
        ? LEFT_PASSWORDS.indexOf(correctPassword)
        : RIGHT_PASSWORDS.indexOf(correctPassword);

    // ─── 2) Boot the rest of the UI ─────────────────────
    Pip.removeAllListeners(VIDEO_STOPPED);

    drawHeader();
    drawPasswordMessage();
    drawAttemptCounter();

    // ─── 3) Generate & embed your junk lines ───────────
    setupJunkLines(); // inside here you’ll force-embed `correctPassword`
    scanSnippets();

    // ─── 4) Paint the grids ────────────────────────────
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

    // ─── 5) Draw all the boxes & log region ───────────
    drawBoundaries(SCREEN_XY);
    drawBoundaries(HEADER_XY);
    drawBoundaries(PASSWORD_MESSAGE_XY);
    drawBoundaries(ATTEMPT_COUNTER_XY);
    drawBoundaries(PASSWORD_GRID_LEFT_XY);
    drawBoundaries(PASSWORD_GRID_RIGHT_XY);
    drawBoundaries(LOG_XY);

    // ─── 6) Initialize the log & input handlers ───────
    logEntries = ['> . '];
    drawLog();
    setListeners();

    // ─── 7) Reset any outstanding intervals ───────────
    if (gameOverInterval) clearInterval(gameOverInterval);
    if (playButtonInterval) clearInterval(playButtonInterval);
    playButtonInterval = setInterval(handlePlayButton, FPS);
  }

  self.run = function () {
    if (!gb || !bC) throw new Error('Pip-Boy graphics not available!');

    bC.clear();
    clearScreen();
    removeListeners();

    // power button = device reboot
    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: true,
    });

    if (!DEBUG) {
      Pip.videoStart(VIDEO_BOOT, { x: 40 });
      Pip.on(VIDEO_STOPPED, startGame);
    } else {
      startGame();
    }
  };

  return self;
}

PortaHack().run();
