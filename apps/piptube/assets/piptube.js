// =============================================================================
//  Name: PipTube
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function PipTube() {
  const self = {};

  // General
  // APP = { id, name, version, tags, files }
  const APP = JSON.parse(fs.readFileSync('APPINFO/piptube.info'));

  // Screen
  const SCREEN_WIDTH = g.getWidth(); // 480
  const SCREEN_HEIGHT = g.getHeight(); // 320
  const SHOW_BOUNDARIES = false; // 4 Debugging

  // Video Player Default Size
  // const PLAYER_W = 340;
  // const PLAYER_H = 210;

  // Mapping
  const SCREEN_XY = {
    x1: 60,
    y1: 40,
    x2: SCREEN_WIDTH - 60,
    y2: SCREEN_HEIGHT - 20,
  };
  const PIPTUBE_XY = {
    x1: SCREEN_XY.x1 + 10,
    y1: SCREEN_XY.y1 + 30,
    x2: SCREEN_XY.x2 - 10, // = 340
    y2: SCREEN_XY.y2 - 20, // = 210
  };

  // Interfaces
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 10;
  let lastLeftKnobTime = 0;

  // Video
  const MAX_PATH = 56;
  let currentPath = '';
  let currentVideoPath = null;
  let isVideoPlaying = false;

  // Footer
  const INTERVAL_FOOTER_MS = 49.99923706054;
  let footerInterval = null;

  // Icons (monochrome, simple)
  const ICON_FOLDER = Graphics.createImage(`
    .......XXXXX..
    XXXXXXX.....XX
    X............X
    X............X
    X............X
    X............X
    X............X
    X............X
    XXXXXXXXXXXXXX
  `);
  const ICON_LEFT_ARROW = Graphics.createImage(`
    ........X.....
    .......XX.....
    ......XXX.....
    .....XXXX.....
    ....XXXXX.....
    .....XXXX.....
    ......XXX.....
    .......XX.....
    ........X.....
  `);
  const ICON_VIDEO = Graphics.createImage(`
    .............. 
    .XXXXXXXXXXXX.
    .X..........X.
    .X..XXXXXX..X.
    .X..X....X..X.
    .X..X....X..X.
    .X..X....X..X.
    .X..XXXXXX..X.
    .X..........X.
    .XXXXXXXXXXXX.
    ..............
  `);
  const ICON_X = Graphics.createImage(`
    ..............
    ..XX......XX..
    ...XX....XX...
    ....XX..XX....
    .....XXXX.....
    ....XX..XX....
    ...XX....XX...
    ..XX......XX..
    ..............
  `);

  // List / paging
  const PAGE_SIZE = 10;
  let page = 0;
  let selectedIndex = 0;
  let entries = [];

  // Colors
  const COLOR_BLACK = '#000000';
  const COLOR_RED = '#FF0000';
  const COLOR_RED_DARK = g.blendColor('#000', COLOR_RED, 0.5);
  const COLOR_THEME = g.theme.fg;
  const COLOR_THEME_DARK = g.blendColor('#000', COLOR_THEME, 0.5);
  const COLOR_THEME_DARKER = g.blendColor('#000', COLOR_THEME, 0.75);

  function clearFooterBar() {
    if (footerInterval) {
      clearInterval(footerInterval);
    }

    footerInterval = null;
  }

  function dirHasAVI(relPath) {
    try {
      const list = fs.readdir(fullPath('', relPath)) || [];
      for (let i = 0; i < list.length; i++) {
        const name = list[i];
        const child = pathJoin(relPath, name);
        try {
          fs.readdir(fullPath('', child));
        } catch (_) {
          if (/\.avi$/i.test(name)) return true;
        }
      }
    } catch (_) {}
    return false;
  }

  function drawAllBoundaries() {
    if (!SHOW_BOUNDARIES) return;
    g.setColor(COLOR_THEME_DARKER);
    g.drawRect(SCREEN_XY);
    g.drawRect(PIPTUBE_XY);
  }

  function drawFooterBar() {
    clearFooterBar();

    // Make sure the drawFooter function exists in the main firmware
    if (typeof drawFooter !== 'function') {
      log('drawFooter function is not defined');
      return;
    }

    footerInterval = setInterval(drawFooter, INTERVAL_FOOTER_MS);
  }

  function drawSongList() {
    const start = page * PAGE_SIZE;
    const visible = entries.slice(start, start + PAGE_SIZE);

    g.setColor(COLOR_BLACK).fillRect(PIPTUBE_XY);
    g.setFontMonofonto16().setFontAlign(-1, -1, 0);

    const iconTopPad = 4,
      iconRightPad = 4,
      textPad = 5,
      rowH = 20;

    visible.forEach((file, i) => {
      const y = PIPTUBE_XY.y1 + i * rowH + textPad;
      let label = formatEntryLabel(file);
      let color = i === selectedIndex ? COLOR_THEME : COLOR_THEME_DARK;
      if (file.type === 'ptl')
        color = i === selectedIndex ? COLOR_RED : COLOR_RED_DARK;

      g.setColor(color);
      let textX = PIPTUBE_XY.x1;

      if (file.type === 'folder') {
        g.drawImage(ICON_FOLDER, textX, y + iconTopPad);
        textX += ICON_FOLDER.width + iconRightPad;
      } else if (file.type === 'up') {
        g.drawImage(ICON_LEFT_ARROW, textX, y + iconTopPad);
        textX += ICON_LEFT_ARROW.width + iconRightPad;
      } else if (file.type === 'file') {
        g.drawImage(ICON_VIDEO, textX, y + iconTopPad);
        textX += ICON_VIDEO.width + iconRightPad;
      } else if (file.type === 'ptl') {
        g.drawImage(ICON_X, textX, y + iconTopPad);
        textX += ICON_X.width + iconRightPad;
      }

      const maxPx = PIPTUBE_XY.x2 - 2 - textX;
      label = ellipsizeToWidth(label, maxPx);
      g.drawString(label, textX, y, true);
    });

    drawAllBoundaries();
  }

  function ellipsizeToWidth(text, maxPx) {
    if (g.stringWidth(text) <= maxPx) return text;
    const dots = '...',
      dotsW = g.stringWidth(dots);
    let low = 0,
      high = text.length,
      best = 0;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const cand = text.slice(0, mid);
      if (g.stringWidth(cand) + dotsW <= maxPx) {
        best = mid;
        low = mid + 1;
      } else high = mid - 1;
    }
    return text.slice(0, best) + dots;
  }

  function formatEntryLabel(file) {
    let label = file.name;
    if (file.type === 'file') label = label.replace(/\.avi$/i, '');
    return label;
  }

  function fullPath(base, name) {
    return '/' + pathJoin(base, name);
  }

  function getParentPath(path) {
    const i = path.lastIndexOf('/');
    if (i <= 0) return '';
    return path.slice(0, i);
  }

  function handleLeftKnob(dir) {
    const now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) return;
    lastLeftKnobTime = now;

    if (isVideoPlaying) {
      // Don't allow scrolling
      if (dir !== 0) return;
      stopVideo();
      return;
    }

    if (dir !== 0) return menuScroll(dir * -1);

    // Select video
    const start = page * PAGE_SIZE;
    const item = entries[start + selectedIndex];
    if (!item) return;

    if (item.type === 'ptl') {
      stopVideo();
      drawAllBoundaries();
      return;
    }
    if (item.type === 'up') {
      stopVideo();
      return navigateTo(getParentPath(currentPath));
    }
    if (item.type === 'folder') {
      stopVideo();
      return navigateTo(pathJoin(currentPath, item.name));
    }
    if (item.type === 'file') {
      // Start
      play(item);
      return;
    }
  }

  function handlePowerButton() {
    stopVideo();
    removeListeners();
    E.reboot();
  }

  function handleRightKnob(dir) {
    // Disable while video is playing
    if (isVideoPlaying) return;
    menuScroll(dir);
  }

  function handleTopButton() {
    // Brightness
    const levels = [1, 5, 10, 15, 20];
    const idx = levels.findIndex((l) => l === Pip.brightness);
    const next = (idx + 1) % levels.length;
    Pip.brightness = levels[next];
    Pip.updateBrightness();
  }

  function isDirectory(relPath) {
    try {
      fs.readdir(fullPath('', relPath));
      return true;
    } catch (_) {
      return false;
    }
  }

  function isPathTooLong(base, name) {
    return fullPath(base, name).length > MAX_PATH;
  }

  function menuLoad(path) {
    const dirPath = path || currentPath;
    unloadList();

    let list = [];
    try {
      list = fs
        .readdir('/' + dirPath)
        .filter((n) => n !== '.' && n !== '..')
        .sort();
    } catch (e) {
      print('Failed to read dir:', dirPath, e);
      list = [];
    }

    const folders = [];
    const avis = [];

    for (let i = 0; i < list.length; i++) {
      const name = list[i];
      const rel = pathJoin(dirPath, name);
      if (isDirectory(rel)) {
        // Include folder only if it has at least one .avi file
        if (dirHasAVI(rel)) folders.push(name);
      } else if (/\.avi$/i.test(name)) {
        avis.push(name);
      }
    }

    // Back
    if (dirPath !== '') entries.push({ type: 'up', name: 'BACK' });

    // Folders
    folders.forEach((folder) => {
      if (isPathTooLong(dirPath, folder))
        entries.push({ type: 'ptl', name: folder });
      else entries.push({ type: 'folder', name: folder });
    });

    // Files
    avis.forEach((file) => {
      if (isPathTooLong(dirPath, file))
        entries.push({ type: 'ptl', name: file });
      else entries.push({ type: 'file', name: file });
    });

    page = 0;
    selectedIndex = 0;
    drawSongList();
  }

  function menuScroll(dir) {
    // Do not allow scrolling while a video is playing
    if (isVideoPlaying) return;

    const start = page * PAGE_SIZE;
    const visible = entries.slice(start, start + PAGE_SIZE);
    const maxPage = Math.floor((entries.length - 1) / PAGE_SIZE);
    selectedIndex += dir;

    if (selectedIndex < 0) {
      if (page > 0) {
        page--;
        selectedIndex = PAGE_SIZE - 1;
      } else selectedIndex = 0;
    } else if (selectedIndex >= visible.length) {
      if (page < maxPage) {
        page++;
        selectedIndex = 0;
      } else selectedIndex = visible.length - 1;
    }

    drawSongList();
  }

  function navigateTo(newPath) {
    stopVideo();
    currentPath = newPath;
    menuLoad(currentPath);
  }

  function onVideoStopped() {
    if (!isVideoPlaying && !currentVideoPath) return;
    refreshUIAfterVideo();
  }

  function patchDataSubtabLabel() {
    try {
      const dataInfo = MODEINFO && MODEINFO[MODE.DATA];
      if (!dataInfo) return;
      if (!dataInfo.submenu) dataInfo.submenu = {};

      const keys = Object.keys(dataInfo.submenu);
      const maintKey = keys.find((k) => k.toUpperCase().includes('MAINT'));
      const name = APP.name.toUpperCase();
      if (maintKey) {
        dataInfo.submenu[name] = dataInfo.submenu[maintKey];
        delete dataInfo.submenu[maintKey];
      } else if (!dataInfo.submenu[name]) {
        if (typeof submenuBlank === 'function') {
          dataInfo.submenu[name] = submenuBlank(name);
        } else {
          dataInfo.submenu[name] = function () {};
        }
      }
      drawHeader(MODE.DATA);
    } catch (e) {
      print('patchDataSubtabLabel error:', e);
    }
  }

  function pathJoin(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a + '/' + b;
  }

  function play(file) {
    try {
      const full = fullPath(currentPath, file.name);

      // Clear
      g.setColor(COLOR_BLACK).fillRect(
        PIPTUBE_XY.x1 - 1,
        PIPTUBE_XY.y1 - 1,
        PIPTUBE_XY.x2 + 2,
        PIPTUBE_XY.y2 + 2,
      );

      // Clean up just in case
      Pip.audioStop && Pip.audioStop();
      Pip.videoStop && Pip.videoStop();

      log('Playing video, path: "' + full + '"');
      const videoArgs = {
        x: PIPTUBE_XY.x1,
        y: PIPTUBE_XY.y1,
        repeat: true,
      };

      // Start video
      Pip.videoStart(full, videoArgs);
      // fs.open(full, 'r');

      currentVideoPath = full;
      isVideoPlaying = true;
    } catch (err) {
      log('Error starting video:', err);
      isVideoPlaying = false;
      currentVideoPath = null;
    }
  }

  function refreshUIAfterVideo() {
    isVideoPlaying = false;
    currentVideoPath = null;

    // Clear
    g.setColor(COLOR_BLACK).fillRect(0, 0, SCREEN_WIDTH - 1, SCREEN_HEIGHT - 1);

    // Redraw
    Pip.mode = MODE.DATA;
    drawHeader(MODE.DATA);
    drawSongList();
    drawAllBoundaries();
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
    Pip.removeAllListeners('videoStopped');
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
    Pip.on('videoStopped', onVideoStopped);
    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: true,
    });
  }

  function stopVideo() {
    if (!isVideoPlaying && !currentVideoPath) return;
    try {
      Pip.videoStop();
    } catch (_) {}
    refreshUIAfterVideo();
  }

  function unloadList() {
    entries = [];
  }

  self.run = function () {
    // Disable sleep
    settings.idleTimeout = 0;

    Pip.mode = MODE.DATA;
    drawHeader(Pip.mode);
    patchDataSubtabLabel();

    removeListeners();
    setListeners();

    menuLoad(currentPath);
    drawFooterBar();
    drawAllBoundaries();
  };

  return self;
}

PipTube().run();
