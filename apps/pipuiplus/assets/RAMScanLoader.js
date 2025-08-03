const originalDrawFooter = drawFooter;

if (global.ui === undefined) {
  try {
    global.ui = JSON.parse(
      require('fs').readFileSync('USER/PIP_UI_PLUS/options.json'),
    );
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
  const w = bF.getWidth();
  const text = 'RAM   ' + used + '/' + total;

  const areaX1 = w - 130;
  const areaY1 = 0;
  const areaX2 = w;
  const areaY2 = 24;

  bF.clearRect(areaX1, areaY1, areaX2, areaY2);

  bF.setFontMonofonto16()
    .setFontAlign(1, -1)
    .setBgColor(1)
    .setColor(3)
    .drawString(text, w - 4, 4)
    .flip();
}

drawFooter = function () {
  originalDrawFooter();
  drawRamOverlay();
};

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
setTimeout(() => ramScanLoop(), 3000);
