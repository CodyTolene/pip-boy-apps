if (global.ui === undefined) {
  try {
    global.ui = JSON.parse(fs.readFileSync('USER/PIP_UI_PLUS/options.json'));
  } catch (e) {
    print('Error reading options:', e);
    global.ui = {};
    global.ui.enableRamScan = false;
  }
}

function drawRamOverlay() {
  if (!global.ui.enableRamScan) {
    return;
  }

  const mem = process.memory();
  const used = mem.usage;
  const total = mem.total;
  const text = used + '/' + total;

  const COLOR_THEME = g.theme.fg;
  const COLOR_BLACK = '#000000';
  const HEIGHT = g.getHeight();
  const WIDTH = g.getWidth();

  const area = {
    x1: WIDTH - 95,
    y1: HEIGHT - 40,
    x2: WIDTH - 55,
    y2: HEIGHT - 30,
  };

  // g.setColor(COLOR_THEME);
  // g.drawRect(area);

  g.setColor(COLOR_BLACK);
  g.fillRect(area);

  g.setColor(COLOR_THEME);
  g.setFont('4x6');
  g.setFontAlign(1, 1, 0);
  g.drawString(text, area.x2, area.y1 + 8);
}

function clearRamScanTimeout() {
  if (global.ramScanTimeout) {
    clearTimeout(global.ramScanTimeout);
  }
}

function ramScanLoop() {
  if (!global.ui.enableRamScan) {
    clearRamScanTimeout();
    return;
  }

  drawRamOverlay();
  global.ramScanTimeout = setTimeout(ramScanLoop, 1000);
}

clearRamScanTimeout();
setTimeout(() => {
  ramScanLoop();
}, 3000);
