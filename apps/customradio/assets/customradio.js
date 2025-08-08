// =============================================================================
//  Name: Custom Radio
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function CustomRadio() {
  const self = {};

  // General
  const APP_NAME = 'Custom Radio';
  const APP_VERSION = '3.3.1';

  // Screen
  const SCREEN_WIDTH = g.getWidth(); // Width (480px)
  const SCREEN_HEIGHT = g.getHeight(); // Height (320px)
  const SHOW_BOUNDARIES = false;
  let originalIdleTimeout = settings.idleTimeout;

  // UX Mapping
  const SCREEN_XY = {
    x1: 60,
    y1: 40,
    x2: SCREEN_WIDTH - 60,
    y2: SCREEN_HEIGHT - 20,
  };
  const LEFT_HALF_XY = {
    x1: SCREEN_XY.x1 + 10,
    y1: SCREEN_XY.y1 + 30,
    x2: (SCREEN_XY.x2 + SCREEN_XY.x1) / 2 + 10,
    y2: SCREEN_XY.y2 - 20,
  };
  const RIGHT_HALF_XY = {
    x1: LEFT_HALF_XY.x2 + 10,
    y1: SCREEN_XY.y1 + 30,
    x2: SCREEN_XY.x2 - 10,
    y2: SCREEN_XY.y2 - 20,
  };
  const NOW_PLAYING_XY = {
    x1: LEFT_HALF_XY.x2 + 10,
    y1: SCREEN_XY.y2 - 100,
    x2: SCREEN_XY.x2 - 10,
    y2: SCREEN_XY.y2 - 60,
  };
  const WAVEFORM_XY = {
    x1: LEFT_HALF_XY.x2 + 45,
    y1: SCREEN_XY.y1 + 37,
    x2: SCREEN_XY.x2 - 12,
    y2: SCREEN_XY.y2 - 101,
  };

  // Physical interfaces
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 10;
  let lastLeftKnobTime = 0;

  // Audio
  const MUSIC_STOPPED = 'audioStopped';
  const MUSIC_DIR = 'RADIO';
  let currentAudio = null;
  let nextSongToPlay = null;

  const ICON_FOLDER = Graphics.createImage(`
    .........XXXXX..
    XXXXXXXXX.....XX
    X..............X
    X..............X
    X..............X
    X..............X
    X..............X
    X..............X
    XXXXXXXXXXXXXXXX
  `);

  // Folder navigation
  let currentPath = MUSIC_DIR;
  let currentFilesSongs = [];

  // List + pagination
  const PAGE_SIZE = 10;
  let page = 0;
  let selectedIndex = 0;
  let entries = null;

  // Random song selection
  let playingRandom = false;
  let randomQueue = [];
  let randomIndex = 0;

  // Waveform
  const INTERVAL_WAVEFORM_MS = 50;
  let animationAngle = 0;
  let waveformGfx = null;
  let waveformInterval = null;
  let waveformPoints = null;

  // Footer
  const INTERVAL_FOOTER_MS = 49.99923706054;
  let footerInterval = null;

  // Colors
  const BLACK = '#000000';
  const COLOR_THEME = g.theme.fg;
  const COLOR_THEME_DARK = g.blendColor('#000', COLOR_THEME, 0.5);
  const COLOR_THEME_DARKER = g.blendColor('#000', COLOR_THEME, 0.75);

  function clearFooterBar() {
    if (footerInterval) clearInterval(footerInterval);
    footerInterval = null;
  }

  function clearNowPlaying() {
    g.setColor(BLACK).fillRect(NOW_PLAYING_XY);
  }

  function clearWaveform() {
    if (waveformInterval) {
      clearInterval(waveformInterval);
    }

    waveformInterval = null;
    waveformPoints = null;

    if (waveformGfx) {
      waveformGfx = null;
      E.defrag();
    }
  }

  function drawAllBoundaries() {
    if (SHOW_BOUNDARIES === false) return;

    drawBoundaries(SCREEN_XY);
    drawBoundaries(LEFT_HALF_XY);
    drawBoundaries(NOW_PLAYING_XY);
    drawBoundaries(RIGHT_HALF_XY);
    drawBoundaries(WAVEFORM_XY);
    drawWaveformBorder();
  }

  function drawAppTitleAndVersion() {
    const appName = APP_NAME.toUpperCase();
    const appVersion = 'v' + APP_VERSION;
    const padding = 5;
    const titleWidth = g.stringWidth(appName);

    g.setColor(COLOR_THEME)
      .setFontAlign(-1, -1, 0) // Align left-top
      .setFontMonofonto16()
      .drawString(appName, LEFT_HALF_XY.x1, SCREEN_XY.y1 + 8);

    g.setColor(COLOR_THEME_DARK)
      .setFontAlign(-1, -1, 0) // Align left-top
      .setFont('6x8')
      .drawString(
        appVersion,
        LEFT_HALF_XY.x1 + titleWidth + padding,
        SCREEN_XY.y1 + 16,
      );

    // Draw a line under the title
    g.setColor(COLOR_THEME_DARKER).drawLine(
      LEFT_HALF_XY.x1,
      LEFT_HALF_XY.y1 - padding,
      LEFT_HALF_XY.x2,
      LEFT_HALF_XY.y1 - padding,
    );
  }

  function drawBoundaries(area) {
    g.setColor(COLOR_THEME_DARKER).drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function drawFooterBar() {
    clearFooterBar();
    footerInterval = setInterval(drawFooter, INTERVAL_FOOTER_MS);
  }

  function drawNowPlaying(song) {
    const display = song.replace(/\.wav$/i, '');
    const displayName =
      display.length > 19 ? display.slice(0, 16) + '...' : display;

    // Draw the currently playing song text
    g.setColor(COLOR_THEME)
      .setFontAlign(1, -1, 0) // Align right-top
      .setFontMonofonto16()
      .drawString(displayName, NOW_PLAYING_XY.x2, NOW_PLAYING_XY.y1 + 20);
  }

  function drawNowPlayingTitle() {
    g.setColor(COLOR_THEME_DARK)
      .setFontAlign(1, 1, 0) // Align right-bottom
      .setFont('6x8')
      .drawString('Now Playing', NOW_PLAYING_XY.x2, NOW_PLAYING_XY.y1 + 15);
  }

  function drawSongList() {
    const start = page * PAGE_SIZE;
    const visible = entries.slice(start, start + PAGE_SIZE);

    // Clear
    g.setColor(BLACK).fillRect(LEFT_HALF_XY);

    g.setFontMonofonto16().setFontAlign(-1, -1, 0);
    const padding = 5;
    const rowHeight = 20;

    visible.forEach((e, i) => {
      const y = LEFT_HALF_XY.y1 + i * rowHeight + padding;
      let label = formatEntryLabel(e);
      label = label.length > 19 ? label.slice(0, 16) + '...' : label;
      const color = i === selectedIndex ? COLOR_THEME : COLOR_THEME_DARK;
      g.setColor(color);

      let textX = LEFT_HALF_XY.x1 + padding;
      if (e.type === 'folder') {
        // Draw icon first
        g.drawImage(ICON_FOLDER, textX, y);
        // Add a gap after icon before text
        textX += ICON_FOLDER.width + 4;
      }

      // Draw the label after the icon (or at padding if not folder)
      g.drawString(label, textX, y, true);
    });

    drawAllBoundaries();
  }

  function drawWaveformBorder() {
    const ticks = 5;
    const ticksSpacing = 3;

    const x1 = WAVEFORM_XY.x1;
    const y1 = WAVEFORM_XY.y1;
    const x2 = WAVEFORM_XY.x2;
    const y2 = WAVEFORM_XY.y2;

    const bottom = y2 - 1;
    const right = x2;

    for (let i = 0; i < 40; i++) {
      const color = i % ticks === 0 ? COLOR_THEME : COLOR_THEME_DARK;
      const height = i % ticks === 0 ? 2 : 1;
      const xpos = x1 + i * ticksSpacing;
      const ypos = bottom - height;
      g.setColor(color);
      g.drawLine(xpos, ypos, xpos, bottom);
      g.drawLine(right - height, y1 + i * 3, right, y1 + i * 3);
    }
    g.setColor(COLOR_THEME);
    g.drawLine(x1, bottom, x2, bottom);
    g.drawLine(x2, bottom, x2, y1);
  }

  function drawWaveform() {
    animationAngle = 0;
    waveformGfx = Graphics.createArrayBuffer(120, 120, 2, { msb: true });
    if (E.getAddressOf(waveformGfx, 0) === 0) {
      waveformGfx = undefined;
      E.defrag();
      waveformGfx = Graphics.createArrayBuffer(120, 120, 2, { msb: true });
    }

    waveformPoints = new Uint16Array(60);
    for (let i = 0; i < 60; i += 2) waveformPoints[i] = i * 2;

    if (waveformInterval) {
      clearInterval(waveformInterval);
    }

    waveformInterval = setInterval(() => {
      if (!waveformGfx) return;

      waveformGfx.clearRect(0, 0, 119, 119);

      if (Pip.radioClipPlaying) {
        Pip.getAudioWaveform(waveformPoints, 20, 100);
      } else if (Pip.radioOn && typeof RADIO_AUDIO !== 'undefined') {
        const adc = analogRead(RADIO_AUDIO); // one sample
        const v = E.clip(60 + (adc - 0.263) * 600, 0, 119) | 0;
        for (let i = 1; i < 60; i += 2) waveformPoints[i] = v;
      } else {
        let a = animationAngle;
        for (let i = 1; i < 60; i += 2) {
          waveformPoints[i] =
            60 + Math.sin(a) * 45 * Math.sin((a += 0.6) * 0.13);
        }
      }

      waveformGfx.drawPolyAA(waveformPoints);
      animationAngle += 0.3;
      Pip.blitImage(waveformGfx, 285, 75, { noScanEffect: true });
    }, INTERVAL_WAVEFORM_MS);
  }

  function formatEntryLabel(e) {
    if (e.type === 'folder') {
      return e.name; // no slash
    }
    return e.name.replace(/\.wav$/i, '');
  }

  function getParentPath(path) {
    const i = path.lastIndexOf('/');
    if (i <= 0) return MUSIC_DIR;
    return path.slice(0, i);
  }

  function handleLeftKnob(dir) {
    const now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) return;
    lastLeftKnobTime = now;

    if (dir !== 0) return menuScroll(dir * -1);

    const currentStart = page * PAGE_SIZE;
    const e = entries[currentStart + selectedIndex];
    if (!e) return;

    if (e.type === 'random') {
      if (playingRandom) {
        playingRandom = false;
        stopSong();
      } else {
        if (currentAudio !== null) {
          playingRandom = true;
          nextSongToPlay = 'RANDOM';
          stopSong();
        } else {
          startRandomForCurrentFolder();
        }
      }
      return;
    }

    if (e.type === 'up') {
      // Navigate up
      navigateTo(getParentPath(currentPath));
      return;
    }

    if (e.type === 'folder') {
      // Enter folder
      navigateTo(pathJoin(currentPath, e.name));
      return;
    }

    if (e.type === 'file') {
      const fullPath = '/' + pathJoin(currentPath, e.name);
      if (currentAudio === fullPath) {
        // Same song selected, toggle play/pause
        nextSongToPlay = null;
        stopSong();
      } else {
        // Different song selected, stop current and play new
        playingRandom = false;
        nextSongToPlay = e.name;
        if (currentAudio !== null) {
          stopSong();
        } else {
          play(e.name);
          nextSongToPlay = null;
        }
      }
    }
  }

  function handlePowerButton() {
    clearFooterBar();
    clearWaveform();

    removeListeners();

    // Restore original idle timeout to allow sleep again
    settings.idleTimeout = originalIdleTimeout;

    E.reboot();
  }

  function handleRightKnob(dir) {
    menuScroll(dir);
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

  function isDirectory(path) {
    try {
      fs.readdir('/' + path);
      return true;
    } catch (e) {
      return false;
    }
  }

  function onMusicStopped() {
    if (playingRandom) {
      playRandomSong();
    } else if (nextSongToPlay) {
      const song = nextSongToPlay;
      nextSongToPlay = null;
      if (song === 'RANDOM') {
        startRandomForCurrentFolder();
      } else {
        play(song);
      }
    } else {
      // Already stopped, avoid redundant stop
      currentAudio = null;
      Pip.radioClipPlaying = false;
      clearNowPlaying();
      drawAllBoundaries();
    }
  }

  function startRandomForCurrentFolder() {
    playingRandom = true;
    // Only songs in the current folder
    randomQueue = currentFilesSongs.slice().sort(() => Math.random() - 0.5);
    randomIndex = 0;
    playRandomSong();
  }

  function menuLoad(path) {
    let dirPath = path || currentPath;
    unloadList();

    let files = [];
    try {
      files = fs
        .readdir('/' + dirPath)
        // remove `./` and `../`
        .filter((name) => name !== '.' && name !== '..')
        .sort();
    } catch (e) {
      print('Failed to read dir:', dirPath, e);
      files = [];
    }

    // Separate folders and .wav files
    const folders = [];
    const wavs = [];
    for (let i = 0; i < files.length; i++) {
      const name = files[i];
      const full = pathJoin(dirPath, name);
      if (isDirectory(full)) {
        folders.push(name);
      } else if (/\.wav$/i.test(name)) {
        wavs.push(name);
      }
    }

    // List
    entries.push({ type: 'random', name: 'RANDOM' });

    // Up option if not at root
    if (dirPath !== MUSIC_DIR) {
      entries.push({ type: 'up', name: '< BACK' });
    }

    // Folders
    folders.forEach((n) => entries.push({ type: 'folder', name: n }));

    // Files
    wavs.forEach((n) => entries.push({ type: 'file', name: n }));

    // RANDOM list
    currentFilesSongs = wavs.slice();

    print(
      'Loaded folder ' +
        dirPath +
        ': ' +
        wavs.length +
        ' songs, ' +
        folders.length +
        ' folders.',
    );

    // Reset selection
    page = 0;
    selectedIndex = 0;
    drawSongList();
  }

  function navigateTo(newPath) {
    // Clear playback
    playingRandom = false;
    nextSongToPlay = null;

    // Unload prev list and switch
    currentPath = newPath;
    menuLoad(currentPath);
  }

  function menuScroll(dir) {
    const currentStart = page * PAGE_SIZE;
    const visible = entries.slice(currentStart, currentStart + PAGE_SIZE);
    const maxPage = Math.floor((entries.length - 1) / PAGE_SIZE);

    selectedIndex += dir;

    if (selectedIndex < 0) {
      if (page > 0) {
        page--;
        selectedIndex = PAGE_SIZE - 1;
      } else {
        selectedIndex = 0;
      }
    } else if (selectedIndex >= visible.length) {
      if (page < maxPage) {
        page++;
        selectedIndex = 0;
      } else {
        selectedIndex = visible.length - 1;
      }
    }

    drawSongList();
  }

  function pathJoin(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a + '/' + b;
  }

  function playRandomSong() {
    if (!currentFilesSongs || currentFilesSongs.length === 0) {
      // Nothing to play in this folder
      playingRandom = false;
      return;
    }
    if (!randomQueue || randomIndex >= randomQueue.length) {
      randomQueue = currentFilesSongs.slice().sort(() => Math.random() - 0.5);
      randomIndex = 0;
    }
    play(randomQueue[randomIndex++]);
  }

  function play(songName) {
    const full = '/' + pathJoin(currentPath, songName);
    currentAudio = full;
    Pip.audioStart(full);
    Pip.radioClipPlaying = true;

    clearNowPlaying();
    drawNowPlayingTitle();
    drawNowPlaying(songName);
    drawAllBoundaries();
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
    Pip.removeAllListeners(MUSIC_STOPPED);
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
    Pip.on(MUSIC_STOPPED, onMusicStopped);
    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: !0,
    });
  }

  function stopSong() {
    Pip.audioStop();
    currentAudio = null;
    Pip.radioClipPlaying = false;

    clearNowPlaying();
    drawAllBoundaries();
  }

  function unloadList() {
    // Drop references to help GC
    entries = null;
    currentFilesSongs = null;
    randomQueue = null;
    // E.defrag();
    // Recreate arrays fresh
    entries = [];
    currentFilesSongs = [];
    randomQueue = [];
  }

  self.run = function () {
    // Disable sleep by setting idle timeout to 0
    originalIdleTimeout = settings.idleTimeout;
    settings.idleTimeout = 0;

    Pip.mode = MODE.RADIO;
    drawHeader(Pip.mode);

    removeListeners();
    setListeners();

    currentPath = MUSIC_DIR;
    menuLoad(currentPath);

    drawWaveform();
    drawWaveformBorder();
    drawAppTitleAndVersion();
    drawFooterBar();
    drawAllBoundaries();
  };

  return self;
}

CustomRadio().run();
