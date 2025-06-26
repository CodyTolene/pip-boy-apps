// === CONSTANTS ===
let cursorX = 0;
let cursorY = 0;
let prevCursorX = 0;
let prevCursorY = 0;
let plantedWords = [];
const gridWidth = 20;
const gridHeight = 12;
const symbols = '!@#$%^&*()[]{}<>?/+=|~';
let attemptsRemaining = 4;
let highlightRange = null;
const offsetX = 15;
let correctPassword = null;
let grid = [];
let foundSnippets = [];
let inputBlocked = false;
let terminalLog = [];
let showWarning = false;

// === GRAPHICS ===
let G = Graphics.createArrayBuffer(400, 308, 2, {
  msb: true,
  buffer: E.toArrayBuffer(E.memoryArea(0x10000000 + 16384, (400 * 308) >> 2)),
});
G.flip = () => Pip.blitImage(G, 40, 7);

// === GRID FUNCTIONS ===
function fillGrid() {
  grid = [];
  for (let y = 0; y < gridHeight; y++) {
    let row = '';
    for (let x = 0; x < gridWidth; x++) {
      row += symbols[Math.floor(Math.random() * symbols.length)];
    }
    grid.push(row);
  }
}

function scanForSnippets() {
  foundSnippets = [];
  const pairs = { '(': ')', '{': '}', '[': ']', '<': '>' };
  for (let row = 0; row < gridHeight; row++) {
    const line = grid[row];
    const wordsInRow = plantedWords.filter((w) => w.row === row);
    for (let i = 0; i < line.length; i++) {
      const openChar = line[i];
      if (pairs.hasOwnProperty(openChar)) {
        for (let j = i + 1; j <= i + 10 && j < line.length; j++) {
          if (line[j] === pairs[openChar]) {
            const isBroken = wordsInRow.some((w) => {
              return (
                (w.startCol > i && w.startCol < j) ||
                (i > w.startCol && i < w.startCol + w.word.length) ||
                (j > w.startCol && j < w.startCol + w.word.length)
              );
            });
            if (!isBroken) {
              foundSnippets.push({
                row,
                startCol: i,
                endCol: j,
                pair: openChar + pairs[openChar],
                active: true,
              });
            }
            break;
          }
        }
      }
    }
  }
}

function drawCharAt(row, col) {
  const charWidth = 15;
  const charHeight = 18;
  const offsetY = 50;
  const ch = grid[row].charAt(col);
  const px = offsetX + col * charWidth;
  const py = offsetY + row * charHeight;
  const isCursor = row === cursorY && col === cursorX;
  const currentRowWords = plantedWords.filter((w) => w.row === cursorY);
  const hoveringWord = currentRowWords.find(
    (w) => cursorX >= w.startCol && cursorX < w.startCol + w.word.length,
  );
  const inHoverWord =
    hoveringWord &&
    row === cursorY &&
    col >= hoveringWord.startCol &&
    col < hoveringWord.startCol + hoveringWord.word.length;
  const snippet = foundSnippets.find(
    (s) =>
      s.active &&
      s.row === cursorY &&
      cursorX >= s.startCol &&
      cursorX <= s.endCol,
  );
  const matchingSnips = foundSnippets.filter(
    (s) =>
      s.active &&
      s.row === cursorY &&
      cursorX >= s.startCol &&
      cursorX <= s.endCol,
  );
  const focusedSnippet = matchingSnips.sort(
    (a, b) => Math.abs(cursorX - a.startCol) - Math.abs(cursorX - b.startCol),
  )[0];

  const inActiveSnippet =
    focusedSnippet &&
    row === cursorY &&
    col >= focusedSnippet.startCol &&
    col <= focusedSnippet.endCol;

  if (isCursor) {
    G.setColor(3);
    G.fillRect(px - 1, py - 1, px + charWidth - 1, py + charHeight - 1);
    G.setColor(0);
  } else if (inHoverWord || inActiveSnippet) {
    G.setColor(3);
    G.fillRect(px - 1, py - 1, px + charWidth - 1, py + charHeight - 1);
    G.setColor(0);
  } else {
    G.setColor(0);
    G.fillRect(px - 1, py - 1, px + charWidth - 1, py + charHeight - 1);
    G.setColor(3);
  }
  G.drawString(ch, px, py);
}

function updateCursor() {
  for (let col = 0; col < gridWidth; col++) {
    drawCharAt(prevCursorY, col);
    if (cursorY !== prevCursorY) drawCharAt(cursorY, col);
  }
  prevCursorX = cursorX;
  prevCursorY = cursorY;
  G.flip();
}

function drawGrid() {
  const charWidth = 15;
  const charHeight = 18;
  const offsetY = 50;

  G.clear();
  G.setFont('6x8', 2);
  G.setColor(3);
  G.drawString('ATTEMPTS REMAINING:', offsetX, 7);
  for (let i = 0; i < 4; i++) {
    const x = offsetX + i * 30;
    if (i < attemptsRemaining) G.fillRect(x, 28, x + 10, 40);
    else G.drawRect(x, 28, x + 10, 40);
  }
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      drawCharAt(row, col);
    }
  }
  if (attemptsRemaining === 1 && showWarning) {
    G.setColor(3);
    G.setFont('6x8', 2);
    G.drawString(
      '!!!WARNING: LOCKOUT IMMINENT!!!',
      offsetX,
      offsetY + gridHeight * charHeight + 5,
    );
  }
  G.flip();
}

function updateHighlightRange() {
  highlightRange = null;
}

function getRandomWords(words, count) {
  const shuffled = words.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const allWords = [
  'HACK',
  'BIKE',
  'HIKE',
  'VOID',
  'VEIN',
  'RAINING',
  'NULL',
  'PULLING',
  'DATA',
  'BAIT',
  'HOARD',
  'ROOTING',
  'HEX',
  'DEBUG',
  'SCRIPT',
  'LOGIC',
  'STACK',
  'ARRAY',
  'OBJECT',
  'STRINGING',
  'BRINGING',
  'MODULE',
  'IMPORT',
  'EXPORT',
  'EVENT',
  'REACT',
  'PACK',
  'BACK',
  'HANK',
  'HARK',
  'HALL',
  'LIKE',
  'PIKE',
  'BAKE',
  'BITE',
  'BIND',
  'VINE',
  'VILE',
  'VOYAGE',
  'MOID',
  'SOIL',
  'GAINING',
  'PAINTED',
  'RAVINGS',
  'MAILING',
  'WAILING',
  'RAILING',
  'ARROW',
  'SUBJECT',
  'EJECTS',
  'ABJECT',
  'REJECT',
  'OBSESS',
  'JANE',
  'MARK',
  'MARY',
  'FREEDOM',
  'FRENCH',
  'FLEETING',
  'FLOP',
  'VAULT',
];

function plantWords(words) {
  plantedWords = [];
  for (let word of words) {
    if (word.length >= gridWidth) continue;
    let placed = false;
    for (let attempts = 0; attempts < 20 && !placed; attempts++) {
      const row = Math.floor(Math.random() * gridHeight);
      const col = Math.floor(Math.random() * (gridWidth - word.length));
      const line = grid[row].split('');
      if (
        line.slice(col, col + word.length).some((ch) => !symbols.includes(ch))
      )
        continue;
      for (let j = 0; j < word.length; j++) line[col + j] = word[j];
      grid[row] = line.join('');
      plantedWords.push({ row, startCol: col, word });
      placed = true;
    }
  }
}

function pickCorrectPassword(words) {
  correctPassword = words[Math.floor(Math.random() * words.length)];
}

function drawTerminal() {
  const termX = 330;
  const termBottomY = 200;
  const lineHeight = 18;
  G.setFont('6x8', 2);
  G.setColor(3);

  let maxLines = Math.floor((termBottomY - 50) / lineHeight);
  let start = Math.max(0, terminalLog.length - maxLines);

  for (let i = 0; i < maxLines; i++) {
    let logIndex = start + i;
    if (logIndex >= terminalLog.length) break;
    let y = 50 + i * lineHeight;
    G.drawString(terminalLog[logIndex], termX, y);
  }
}

function startGame() {
  showWarning = false;
  attemptsRemaining = 4;
  cursorX = 0;
  cursorY = 0;
  inputBlocked = false;
  const wordCount = 8 + Math.floor(Math.random() * 7);
  const words = getRandomWords(allWords, wordCount);
  fillGrid();
  plantWords(words);
  pickCorrectPassword(words);
  scanForSnippets();
  drawGrid();
  bindControls();
}

function bindControls() {
  Pip.removeAllListeners('knob1');
  Pip.on('knob1', (val) => {
    if (inputBlocked) return;

    if (val !== 0) {
      cursorY += val > 0 ? -1 : 1;
      cursorY = Math.max(0, Math.min(cursorY, gridHeight - 1));
      updateHighlightRange();
      updateCursor();
    } else {
      handleSelection();
    }
  });

  Pip.removeAllListeners('knob2');
  Pip.on('knob2', (val) => {
    if (inputBlocked) return;
    if (val !== 0) {
      cursorX += val > 0 ? 1 : -1;
      cursorX = Math.max(0, Math.min(cursorX, gridWidth - 1));
      updateHighlightRange();
      updateCursor();
    }
  });

  Pip.removeAllListeners('torch');
  Pip.on('torch', (val) => {
    if (val !== 0) {
      E.reboot();
    }
  });
}

function handleSelection() {
  if (attemptsRemaining === 1) {
    showWarning = true;
  }

  if (inputBlocked) return;

  const currentRowWords = plantedWords.filter((w) => w.row === cursorY);
  const selectedWord = currentRowWords.find(
    (w) => cursorX >= w.startCol && cursorX < w.startCol + w.word.length,
  );
  const matchingSnips = foundSnippets.filter(
    (s) =>
      s.active &&
      s.row === cursorY &&
      cursorX >= s.startCol &&
      cursorX <= s.endCol,
  );
  const selectedSnippet = matchingSnips.sort(
    (a, b) => a.endCol - a.startCol - (b.endCol - b.startCol),
  )[0];

  if (selectedWord) {
    let likeness = 0;
    for (let i = 0; i < selectedWord.word.length; i++) {
      if (selectedWord.word[i] === correctPassword[i]) likeness++;
    }
    let actionTaken = `>${selectedWord.word} [${likeness}]`;
    addToTerminal(actionTaken);

    if (selectedWord.word === correctPassword) {
      G.clear();
      G.setColor(3);
      G.setFont('6x8', 2);

      const msg1 = 'SUCCESS!';
      const msg2 = 'UPLOADING...';
      const x1 = (G.getWidth() - G.stringWidth(msg1)) / 2;
      const x2 = (G.getWidth() - G.stringWidth(msg2)) / 2;
      const y = G.getHeight() / 2;

      G.drawString(msg1, x1, y - 20);
      G.drawString(msg2, x2, y);
      G.flip();

      Pip.removeAllListeners();
      inputBlocked = true;

      setTimeout(() => {
        E.reboot();
      }, 3000);
    } else {
      attemptsRemaining--;
      if (attemptsRemaining <= 0) {
        inputBlocked = true;

        G.clear();
        G.setColor(3);
        G.setFont('6x8', 2);
        G.drawString('ACCESS DENIED!', 20, G.getHeight() / 2 - 20);
        G.drawString('REBOOTING...', 20, G.getHeight() / 2);
        G.flip();

        setTimeout(() => {
          inputBlocked = false;
          terminalLog = [];
          highlightRange = null;
          correctPassword = null;
          plantedWords = [];
          foundSnippets = [];
          inputBlocked = false;
          startGame();
        }, 2000);
      } else {
        updateDisplay();
      }
    }
  } else if (selectedSnippet && selectedSnippet.active) {
    selectedSnippet.active = false;

    let actionTaken = '';
    if (Math.random() < 0.5) {
      const duds = plantedWords.filter((w) => w.word !== correctPassword);
      if (duds.length > 0) {
        const dud = duds[Math.floor(Math.random() * duds.length)];
        const line = grid[dud.row].split('');
        for (let i = 0; i < dud.word.length; i++) {
          line[dud.startCol + i] = '.';
        }
        grid[dud.row] = line.join('');
        plantedWords = plantedWords.filter((w) => w !== dud);
        actionTaken = '>DUD REMOVED';
      } else {
        actionTaken = '>NO DUDS REMAIN';
      }
    } else {
      attemptsRemaining = 4;
      actionTaken = '>TRIES RESET';
    }
    addToTerminal(actionTaken);
    updateDisplay();
  }
}

function addToTerminal(message) {
  const maxCharsPerLine = 5;
  for (let i = 0; i < message.length; i += maxCharsPerLine) {
    terminalLog.push(message.slice(i, i + maxCharsPerLine));
  }
  const maxLines = 10;
  if (terminalLog.length > maxLines) {
    terminalLog.splice(0, terminalLog.length - maxLines);
  }
}

function drawWarningLine() {
  const charHeight = 18;
  const offsetY = 50;
  const y = offsetY + gridHeight * charHeight + 5;
  G.setColor(0);
  G.fillRect(offsetX, y, 400, y + charHeight);
  if (showWarning) {
    G.setColor(3);
    G.setFont('6x8', 2);
    G.drawString('!!!WARNING: LOCKOUT IMMINENT!!!', offsetX, y);
  }
}

function updateDisplay() {
  if (attemptsRemaining === 1) {
    showWarning = true;
  }

  drawGrid();
  drawTerminal();
  G.flip();
  drawGrid();
  drawTerminal();
  G.flip();
}

function showLoadingScreen(callback) {
  const messages = [
    'CONNECTING TO DEVICE.',
    'CONNECTING TO DEVICE..',
    'CONNECTING TO DEVICE...',
    'CONNECTED!',
  ];

  let index = 0;
  G.clear();
  G.setFont('6x8', 2);
  G.setColor(3);

  function showNextMessage() {
    G.clear();
    const message = messages[index];
    const textWidth = G.stringWidth(message);
    const x = (G.getWidth() - textWidth) / 2;
    const y = (G.getHeight() - 8 * 2) / 2;

    G.drawString(message, x, y);
    G.flip();
    index++;
    if (index < messages.length) {
      setTimeout(showNextMessage, 1000);
    } else {
      setTimeout(callback, 300);
    }
  }

  showNextMessage();
}

showLoadingScreen(startGame);
