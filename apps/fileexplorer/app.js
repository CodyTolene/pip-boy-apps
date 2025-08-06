// =============================================================================
//  Name: File Explorer
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function FileExplorer() {
  const self = {};
  const gx = g;

  const APP_NAME = 'File Explorer';
  const APP_VERSION = '2.1.4';

  const SCREEN_WIDTH = gx.getWidth();
  const SCREEN_HEIGHT = gx.getHeight();

  // Colors
  const COLOR_BLACK = '#000000';
  const COLOR_THEME = g.theme.fg;
  const COLOR_THEME_DARK = g.blendColor(COLOR_BLACK, COLOR_THEME, 0.5);

  const LINE_HEIGHT = 12;
  const TOP_PADDING = 40;
  const MAX_LINES = Math.floor((SCREEN_HEIGHT - TOP_PADDING) / LINE_HEIGHT);
  const ROOT_PATH = '/';

  let entries = [];
  let currentIndex = 0;
  let scrollOffset = 0;
  let currentAudio = null;
  let isVideoPlaying = false;
  let isModernVersion = false;
  let currentPath = ROOT_PATH;

  try {
    const s = require('Storage');
    const l = s.list();
    if (l.includes('VERSION') && l.includes('.bootcde')) {
      const versionStr = s.read('VERSION') || '';
      const versionNum = parseFloat(versionStr);
      isModernVersion = versionNum >= 1.29;
    }
  } catch (e) {
    console.log('Failed to detect JS version:', e);
  }

  function resolvePath(dir, file) {
    if (dir === '/' || dir === '') return '/' + file;
    return dir + '/' + file;
  }

  function drawUI() {
    gx.clear();

    gx.setColor(COLOR_THEME)
      .setFont('6x8', 2)
      .setFontAlign(0, 0)
      .drawString(APP_NAME + ' v' + APP_VERSION, SCREEN_WIDTH / 2, 20);

    gx.setColor(COLOR_THEME_DARK).setFontAlign(0, 0).setFont('6x8', 1);

    let visible = entries.slice(scrollOffset, scrollOffset + MAX_LINES);

    visible.forEach(function (entry, i) {
      let isSelected = scrollOffset + i === currentIndex;
      gx.setColor(isSelected ? COLOR_THEME : COLOR_THEME_DARK);

      let indent = '';
      let effectiveDepth =
        entry.name === '..'
          ? entry.depth
          : entry.depth - currentPath.split('/').length + 1;
      for (let d = 0; d < Math.max(0, effectiveDepth); d++) indent += '...';

      let tag = entry.type === 'dir' ? '[DIR] ' : '[FILE] ';
      let label = indent + tag + entry.name;
      let labelWidth = gx.stringWidth(label);
      let x = 60 + labelWidth / 2;
      let y = TOP_PADDING + i * LINE_HEIGHT;

      gx.drawString(label, x, y);

      if (entry.path === currentAudio) {
        gx.drawString(' (PLAYING)', x + labelWidth + 4, y);
      }
    });
  }

  function loadDirectory(dir) {
    try {
      let list = fs.readdir(dir) || [];
      let depth = dir.split('/').length - 1;
      currentPath = dir;

      entries = [];

      if (dir !== ROOT_PATH) {
        entries.push({
          name: '..',
          path: dir.split('/').slice(0, -1).join('/') || '/',
          type: 'dir',
          depth: depth - 1,
        });
      }

      list.forEach((name) => {
        let path = resolvePath(dir, name);

        if (
          isModernVersion &&
          (name === '.' ||
            name === '..' ||
            path.includes('/./') ||
            path.includes('/../'))
        ) {
          return;
        }

        let type = 'file';
        try {
          fs.readdir(path);
          type = 'dir';
        } catch (_) {}

        entries.push({
          name: name,
          path: path,
          type: type,
          depth: depth,
        });
      });

      currentIndex = 0;
      scrollOffset = 0;
      drawUI();
    } catch (e) {
      console.log('Failed to load dir:', dir);
    }
  }

  function stopVideo() {
    if (isVideoPlaying) {
      Pip.videoStop();
      isVideoPlaying = false;
      drawUI();
    }
  }

  function scrollUp() {
    stopVideo();
    if (currentIndex > 0) currentIndex--;
    if (currentIndex < scrollOffset) scrollOffset--;
    drawUI();
  }

  function scrollDown() {
    stopVideo();
    if (currentIndex < entries.length - 1) currentIndex++;
    if (currentIndex >= scrollOffset + MAX_LINES) scrollOffset++;
    drawUI();
  }

  function selectEntry() {
    const selected = entries[currentIndex];
    if (!selected) return;

    if (selected.type === 'dir') {
      loadDirectory(selected.path);
      return;
    }

    const name = selected.name.toLowerCase();

    if (isVideoPlaying) {
      stopVideo();
      return;
    }

    if (name.endsWith('.wav')) {
      if (currentAudio === selected.path) {
        Pip.audioStop();
        currentAudio = null;
        drawUI();
      } else {
        Pip.audioStop();
        Pip.audioStart(selected.path);
        currentAudio = selected.path;
        drawUI();
      }
      return;
    }

    if (name.endsWith('.avi')) {
      Pip.audioStop();
      Pip.videoStart(selected.path, { x: 60, y: 10 });
      isVideoPlaying = true;
      currentAudio = null;
      return;
    }

    // Check for any text-based file extensions
    if (
      name.endsWith('.info') ||
      name.endsWith('.txt') ||
      name.endsWith('.log') ||
      name.endsWith('.js') ||
      name.endsWith('.json') ||
      name.endsWith('.md')
    ) {
      gx.clear();

      // Read and split
      let lines = fs.readFile(selected.path).split('\n');
      gx.setFont('6x8', 1).setColor(COLOR_THEME).setFontAlign(-1, -1);

      const marginLeft = 70;
      const marginRight = 100;
      const marginTop = 20;
      const usableWidth = gx.getWidth() - (marginLeft + marginRight);

      // Wrap and limit
      lines = [].concat.apply(
        [],
        lines.map((line) => (line ? gx.wrapString(line, usableWidth) : [''])),
      );

      // Draw
      let y = marginTop;
      const lineHeight = gx.stringMetrics('X').height + 4;
      lines.forEach((line) => {
        gx.drawString(line, marginLeft, y);
        y += lineHeight;
      });

      return;
    }
  }

  function handleInput() {
    if (BTN_TUNEUP.read()) scrollUp();
    if (BTN_TUNEDOWN.read()) scrollDown();
    if (BTN_PLAY.read()) selectEntry();
    if (BTN_TORCH.read()) {
      const brightnessLevels = [1, 5, 10, 15, 20];
      const currentIndex = brightnessLevels.findIndex(
        (level) => level === Pip.brightness,
      );
      const nextIndex = (currentIndex + 1) % brightnessLevels.length;
      Pip.brightness = brightnessLevels[nextIndex];
      Pip.updateBrightness();
    }
  }

  function handlePowerButton() {
    Pip.audioStop();
    Pip.videoStop();

    currentAudio = null;
    isVideoPlaying = false;

    bC.clear(1).flip();
    E.reboot();
  }

  function showLoadingScreen() {
    gx.clear();
    gx.setFont('6x8', 2)
      .setFontAlign(0, 0)
      .setColor(COLOR_THEME_DARK)
      .drawString('Loading...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
  }

  self.run = function () {
    if (global.ui.enableRamScan) {
      global.ui.enableRamScan = false;
    }

    if (!Pip.isSDCardInserted()) {
      gx.clear();
      gx.setFont('6x8', 2)
        .setFontAlign(0, 0)
        .setColor('#F00')
        .drawString('NO SD CARD DETECTED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
      return;
    }

    showLoadingScreen();

    setTimeout(function () {
      loadDirectory(ROOT_PATH);
      setInterval(handleInput, 150);
    }, 50);

    Pip.removeAllListeners('knob1');
    Pip.on('knob1', function (dir) {
      if (dir < 0) scrollDown();
      else if (dir > 0) scrollUp();
      else selectEntry();
    });

    Pip.removeAllListeners('knob2');
    Pip.on('knob2', function (dir) {
      if (dir < 0) scrollUp();
      else if (dir > 0) scrollDown();
    });

    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: !0,
    });
  };

  return self;
}

FileExplorer().run();
