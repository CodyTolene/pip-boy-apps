// =============================================================================
//  Name: Custom Radio
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

function CustomRadio() {
  const self = {};

  // General
  const APP_NAME = 'Custom Radio';
  const APP_VERSION = '3.3.3';

  // Screen
  const SCREEN_WIDTH = g.getWidth(); // Width (480px)
  const SCREEN_HEIGHT = g.getHeight(); // Height (320px)
  const SHOW_BOUNDARIES = false;
  let originalIdleTimeout = settings.idleTimeout;

  // UX Mapping
  const LEFT_HALF_OFFSET = 40;
  const SCREEN_XY = {
    x1: 60,
    y1: 40,
    x2: SCREEN_WIDTH - 60,
    y2: SCREEN_HEIGHT - 20,
  };
  const LEFT_HALF_XY = {
    x1: SCREEN_XY.x1 + 10,
    y1: SCREEN_XY.y1 + 30,
    x2: (SCREEN_XY.x2 + SCREEN_XY.x1) / 2 + LEFT_HALF_OFFSET,
    y2: SCREEN_XY.y2 - 20,
  };
  const RIGHT_HALF_XY = {
    x1: LEFT_HALF_XY.x2,
    y1: SCREEN_XY.y1 + 30,
    x2: SCREEN_XY.x2 - 10,
    y2: SCREEN_XY.y2 - 20,
  };
  const NOW_PLAYING_XY = {
    x1: LEFT_HALF_XY.x2,
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
  let lastPlayedName = null;
  let isStartingAudio = false;
  let playTimer = null;
  let playRequestId = 0;

  // Error Handling
  let errorActive = false;
  let suppressNextAudioStopped = false;

  // Icons
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
  const ICON_MUSIC_NOTE = Graphics.createImage(`
    ..............
    ....XXXXXXXX..
    ....XX....XX..
    ....XX....XX..
    ....XX....XX..
    ....XX....XX..
    ..XXXX..XXXX..
    ..XXXX..XXXX..
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
  const ICON_RANDOM = Graphics.createImage(`
    ..XX..........
    .XX...........
    XXXXXXXXXXXXX.
    .XX...........
    ..XX......XX..
    ...........XX.
    .XXXXXXXXXXXXX
    ...........XX.
    ..........XX..
  `);

  // Folders
  const MAX_PATH = 56;
  let currentPath = MUSIC_DIR;
  let currentFilesSongs = [];

  // Music List
  const PAGE_SIZE = 10;
  let page = 0;
  let selectedIndex = 0;
  let songFiles = null;

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

  // Loading
  let isLoadingDir = false;

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

  function clearNowPlaying() {
    g.setColor(COLOR_BLACK).fillRect(NOW_PLAYING_XY);
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

    g.setColor(COLOR_THEME_DARKER);
    g.drawRect(SCREEN_XY);
    g.drawRect(LEFT_HALF_XY);
    g.drawRect(NOW_PLAYING_XY);
    g.drawRect(RIGHT_HALF_XY);
    g.drawRect(WAVEFORM_XY);
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

  function drawFooterBar() {
    clearFooterBar();
    footerInterval = setInterval(drawFooter, INTERVAL_FOOTER_MS);
  }

  function drawNowPlaying(file) {
    let name = file.name;
    let color = COLOR_THEME;

    if (file.type === 'ptl') {
      name = 'FILE PATH TOO LONG!';
      color = COLOR_RED;
    }

    const display = name.replace(/\.wav$/i, '');
    const displayName =
      display.length > 21 ? display.slice(0, 18) + '...' : display;

    // Draw the currently playing song text
    g.setColor(color)
      .setFontAlign(1, -1, 0) // Align right-top
      .setFont('6x8')
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
    const visibleFiles = songFiles.slice(start, start + PAGE_SIZE);

    g.setColor(COLOR_BLACK).fillRect(LEFT_HALF_XY);
    g.setFontMonofonto16().setFontAlign(-1, -1, 0);

    const iconTopPadding = 4;
    const iconRightPadding = 4;
    const textPadding = 5;
    const rowHeight = 20;

    visibleFiles.forEach((file, i) => {
      const y = LEFT_HALF_XY.y1 + i * rowHeight + textPadding;

      let label = formatEntryLabel(file);
      let color = COLOR_THEME_DARK;

      if (file.type === 'ptl') {
        if (i === selectedIndex) {
          color = COLOR_RED;
        } else {
          color = COLOR_RED_DARK;
        }
      } else if (i === selectedIndex) {
        color = COLOR_THEME;
      }

      g.setColor(color);
      let textX = LEFT_HALF_XY.x1;

      if (file.type === 'folder') {
        g.drawImage(ICON_FOLDER, textX, y + iconTopPadding);
        textX += ICON_FOLDER.width + iconRightPadding;
      } else if (file.type === 'up') {
        g.drawImage(ICON_LEFT_ARROW, textX, y + iconTopPadding);
        textX += ICON_LEFT_ARROW.width + iconRightPadding;
      } else if (file.type === 'file') {
        g.drawImage(ICON_MUSIC_NOTE, textX, y + iconTopPadding);
        textX += ICON_MUSIC_NOTE.width + iconRightPadding;
      } else if (file.type === 'ptl') {
        g.drawImage(ICON_X, textX, y + iconTopPadding);
        textX += ICON_X.width + iconRightPadding;
      } else if (file.type === 'random') {
        g.drawImage(ICON_RANDOM, textX, y + iconTopPadding);
        textX += ICON_RANDOM.width + iconRightPadding;
      }

      const maxPx = LEFT_HALF_XY.x2 - 2 - textX;
      label = ellipsizeToWidth(label, maxPx);

      g.drawString(label, textX, y, true);
    });

    drawAllBoundaries();
  }

  function drawWaveformBorder() {
    const ticks = 5;
    const ticksSpacing = 3;

    const x1 = WAVEFORM_XY.x1 - LEFT_HALF_OFFSET;
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
      // Vertical ticks
      g.drawLine(xpos, ypos, xpos, bottom);
      // Horizontal ticks
      g.drawLine(right - height, y1 + i * 3, right, y1 + i * 3);
    }

    g.setColor(COLOR_THEME);
    // Bottom horizontal
    g.drawLine(x1, bottom, x2, bottom);
    // Right vertical
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
      if (isLoadingDir) {
        return;
      }

      if (!waveformGfx) {
        return;
      }

      waveformGfx.clearRect(0, 0, 119, 119);

      if (Pip.radioClipPlaying) {
        Pip.getAudioWaveform(waveformPoints, 20, 100);
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

  function ellipsizeToWidth(text, maxPx) {
    if (g.stringWidth(text) <= maxPx) {
      return text;
    }

    const dots = '...';
    const dotsW = g.stringWidth(dots);
    let low = 0;
    let high = text.length;
    let best = 0;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const candidate = text.slice(0, mid);
      if (g.stringWidth(candidate) + dotsW <= maxPx) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return text.slice(0, best) + dots;
  }

  function formatEntryLabel(file) {
    let label = file.name;
    if (file.type !== 'folder') {
      label = label.replace(/\.wav$/i, '');
    }
    return label;
  }

  function getParentPath(path) {
    const i = path.lastIndexOf('/');
    if (i <= 0) return MUSIC_DIR;
    return path.slice(0, i);
  }

  function showErrorInNowPlaying() {
    errorActive = true;
    suppressNextAudioStopped = true;

    clearNowPlaying();
    drawNowPlayingTitle();

    const msg = 'File play error';

    g.setColor(COLOR_RED)
      .setFontAlign(1, -1, 0) // Align right-top
      .setFont('6x8')
      .drawString(msg, NOW_PLAYING_XY.x2, NOW_PLAYING_XY.y1 + 20, true);

    drawAllBoundaries();
  }

  function dismissError() {
    if (!errorActive) return;

    errorActive = false;
    suppressNextAudioStopped = false;

    clearNowPlaying();
    drawNowPlayingTitle();
    drawAllBoundaries();
  }

  function handleLeftKnob(dir) {
    if (errorActive) {
      dismissError();
    }

    if (isLoadingDir || isStartingAudio) {
      return;
    }

    const now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir !== 0) {
      return menuScroll(dir * -1);
    }

    const currentStart = page * PAGE_SIZE;
    const selectedFile = songFiles[currentStart + selectedIndex];
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type === 'random') {
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

    if (selectedFile.type === 'ptl') {
      playingRandom = false;
      nextSongToPlay = null;
      currentAudio = null;
      Pip.radioClipPlaying = false;

      stopSong();
      clearNowPlaying();
      drawNowPlayingTitle();
      drawNowPlaying(selectedFile);
      drawAllBoundaries();
      return;
    }

    if (selectedFile.type === 'up') {
      // Navigate up
      navigateTo(getParentPath(currentPath));
      return;
    }

    if (selectedFile.type === 'folder') {
      // Enter folder
      navigateTo(pathJoin(currentPath, selectedFile.name));
      return;
    }

    if (selectedFile.type === 'file') {
      const fullPath = buildAudioPath(currentPath, selectedFile.name);

      // Toggle off if selecting the currently playing track
      if (currentAudio === fullPath) {
        nextSongToPlay = null;
        stopSong();
        return;
      }

      playingRandom = false;

      // If something is playing, queue it and stop first
      if (currentAudio !== null) {
        nextSongToPlay = selectedFile;
        stopSong();
        return;
      }

      play(selectedFile);
      return;
    }
  }

  function handlePowerButton() {
    if (errorActive) {
      dismissError();
    }

    clearFooterBar();
    clearWaveform();

    removeListeners();

    // Restore original idle timeout to allow sleep again
    settings.idleTimeout = originalIdleTimeout;

    E.reboot();
  }

  function handleRightKnob(dir) {
    if (errorActive) {
      dismissError();
    }

    if (isLoadingDir || isStartingAudio) {
      return;
    }

    menuScroll(dir);
  }

  function handleTopButton() {
    if (errorActive) {
      dismissError();
    }

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
      const st = fs.statSync('/' + path);
      return !!st && !!st.dir;
    } catch (e) {
      return false;
    }
  }

  function isPathTooLong(base, name) {
    return ('/' + pathJoin(base, name)).length > MAX_PATH;
  }

  function menuLoad(path) {
    let dirPath = path || currentPath;

    isLoadingDir = true;
    try {
      unloadList();
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
      isStartingAudio = false;

      if (dirPath === MUSIC_DIR) {
        E.defrag();
      }

      let files = [];
      try {
        files = fs
          .readdir('/' + dirPath)
          .filter((name) => name !== '.' && name !== '..')
          .sort();
      } catch (e) {
        print('Failed to read dir:', dirPath, e);

        try {
          E.defrag();

          files = fs
            .readdir('/' + dirPath)
            .filter((name) => name !== '.' && name !== '..')
            .sort();
        } catch (e2) {
          print('Retry failed to read dir:', dirPath, e2);
          files = [];
        }
      }

      // Separate folders and .wav files
      const folders = [];
      const wavs = [];
      for (let i = 0; i < files.length; i++) {
        const name = files[i];
        if (/\.wav$/i.test(name)) {
          wavs.push(name);
          continue;
        }

        const full = pathJoin(dirPath, name);
        if (isDirectory(full)) {
          folders.push(name);
        }
      }

      // List
      songFiles.push({ type: 'random', name: 'RANDOM' });

      // Up option if not at root
      if (dirPath !== MUSIC_DIR) {
        songFiles.push({ type: 'up', name: 'BACK' });
      }

      // Folders
      folders.forEach((folder) => {
        if (isPathTooLong(dirPath, folder)) {
          songFiles.push({
            name: folder,
            type: 'ptl',
          });
        } else {
          songFiles.push({
            name: folder,
            type: 'folder',
          });
        }
      });

      // Files
      wavs.forEach((file) => {
        if (isPathTooLong(dirPath, file)) {
          songFiles.push({
            name: file,
            type: 'ptl',
          });
        } else {
          songFiles.push({
            type: 'file',
            name: file,
          });
        }
      });

      // RANDOM list
      currentFilesSongs = songFiles.filter((file) => file.type === 'file');

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
    } finally {
      isLoadingDir = false;
    }
  }

  function menuScroll(dir) {
    if (errorActive) {
      dismissError();
    }

    const currentStart = page * PAGE_SIZE;
    const visibleFiles = songFiles.slice(
      currentStart,
      currentStart + PAGE_SIZE,
    );
    const maxPage = Math.floor((songFiles.length - 1) / PAGE_SIZE);

    selectedIndex += dir;

    if (selectedIndex < 0) {
      if (page > 0) {
        page--;
        selectedIndex = PAGE_SIZE - 1;
      } else {
        selectedIndex = 0;
      }
    } else if (selectedIndex >= visibleFiles.length) {
      if (page < maxPage) {
        page++;
        selectedIndex = 0;
      } else {
        selectedIndex = visibleFiles.length - 1;
      }
    }

    drawSongList();
  }

  function navigateTo(newPath) {
    if (errorActive) {
      dismissError();
    }

    // Clear playback
    playingRandom = false;
    nextSongToPlay = null;

    // Unload prev list and switch
    currentPath = newPath;
    menuLoad(currentPath);
  }

  function onMusicStopped() {
    if (errorActive || suppressNextAudioStopped) {
      suppressNextAudioStopped = false;
      currentAudio = null;
      Pip.radioClipPlaying = false;
      return;
    }

    currentAudio = null;
    Pip.radioClipPlaying = false;

    if (playingRandom) {
      playRandomSong();
      return;
    }
    if (nextSongToPlay === 'RANDOM') {
      nextSongToPlay = null;
      startRandomForCurrentFolder();
      return;
    }
    if (nextSongToPlay) {
      const file = nextSongToPlay;
      nextSongToPlay = null;
      play(file);
      return;
    }

    clearNowPlaying();
    drawNowPlayingTitle();
    drawAllBoundaries();
  }

  function pathJoin(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a + '/' + b;
  }

  function normalizeAudioPath(p) {
    // Ensure: no leading slash, no double slashes
    let s = p ? String(p) : '';
    while (s.length && s[0] === '/') s = s.slice(1);
    while (s.indexOf('//') !== -1) s = s.replace('//', '/');
    return s;
  }

  function buildAudioPath(dir, name) {
    return normalizeAudioPath(pathJoin(dir, name));
  }

  function play(file) {
    if (errorActive) {
      dismissError();
    }
    suppressNextAudioStopped = false;

    const full = buildAudioPath(currentPath, file.name);

    playRequestId++;
    const reqId = playRequestId;

    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }

    isStartingAudio = true;
    Pip.radioClipPlaying = false;

    try {
      Pip.audioStop();
    } catch (e) {}

    function existsOnFs(pathNoSlash) {
      try {
        const st = fs.statSync('/' + pathNoSlash);
        return !!st && !st.dir;
      } catch (e) {
        return false;
      }
    }

    const exists = existsOnFs(full);
    print('Play request:', full, 'len=' + full.length, 'exists=' + exists);

    if (!exists) {
      print('ERROR: file missing according to fs.statSync ->', full);
      isStartingAudio = false;

      showErrorInNowPlaying();
      return;
    }

    const tryA = full;
    const tryB = '/' + full;

    function tryStart(path) {
      try {
        Pip.audioStart(path);
        return true;
      } catch (e) {
        let msg = '';
        try {
          msg = e ? String(e) : '(empty error)';
        } catch (x) {
          msg = '(stringify failed)';
        }
        print('audioStart failed:', path, msg);
        return false;
      }
    }

    playTimer = setTimeout(() => {
      playTimer = null;

      if (reqId !== playRequestId) {
        isStartingAudio = false;
        Pip.radioClipPlaying = false;
        return;
      }

      const ok = tryStart(tryA) || tryStart(tryB);
      if (!ok) {
        isStartingAudio = false;
        Pip.radioClipPlaying = false;

        showErrorInNowPlaying();
        return;
      }

      currentAudio = full;
      Pip.radioClipPlaying = true;
      lastPlayedName = file.name;

      clearNowPlaying();
      drawNowPlayingTitle();
      drawNowPlaying(file);
      drawAllBoundaries();

      isStartingAudio = false;
    }, 150);
  }

  function playRandomSong() {
    const pool = currentFilesSongs;
    if (!pool.length) {
      playingRandom = false;
      return;
    }

    // If theres is only one song, we have to replay it
    if (pool.length === 1) {
      play(pool[0]);
      return;
    }

    if (!randomQueue || randomIndex >= randomQueue.length) {
      randomQueue = pool.slice();
      shuffle(randomQueue);

      // Do not play the same song over again
      if (
        lastPlayedName &&
        randomQueue.length > 1 &&
        randomQueue[0].name === lastPlayedName
      ) {
        const t = randomQueue[0];
        randomQueue[0] = randomQueue[1];
        randomQueue[1] = t;
      }
      randomIndex = 0;
    }

    // If song is the same as last, try the next one or reshuffle
    let next = randomQueue[randomIndex++];
    if (lastPlayedName && next.name === lastPlayedName) {
      if (randomIndex < randomQueue.length) {
        next = randomQueue[randomIndex++];
      } else {
        // All we had left was the last played, reshuffle
        randomQueue = pool.slice();
        shuffle(randomQueue);
        if (randomQueue.length > 1 && randomQueue[0].name === lastPlayedName) {
          const t = randomQueue[0];
          randomQueue[0] = randomQueue[1];
          randomQueue[1] = t;
        }
        randomIndex = 1;
        next = randomQueue[0];
      }
    }

    play(next);
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

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (E.hwRand() >>> 0) % (i + 1);
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
  }

  function startRandomForCurrentFolder() {
    playingRandom = true;
    // Only songs in the current folder
    randomQueue = currentFilesSongs.slice();
    shuffle(randomQueue);

    // Avoid placing the last played track at the front
    if (
      lastPlayedName &&
      randomQueue.length > 1 &&
      randomQueue[0].name === lastPlayedName
    ) {
      const swapIdx = 1;
      const t = randomQueue[0];
      randomQueue[0] = randomQueue[swapIdx];
      randomQueue[swapIdx] = t;
    }

    randomIndex = 0;
    playRandomSong();
  }

  function stopSong() {
    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }
    playRequestId++;
    isStartingAudio = false;
    Pip.audioStop();
    currentAudio = null;
    Pip.radioClipPlaying = false;

    clearNowPlaying();
    drawNowPlayingTitle();
    drawAllBoundaries();
  }

  function unloadList() {
    songFiles = null;
    currentFilesSongs = null;
    randomQueue = null;
    songFiles = [];
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

    menuLoad(currentPath);

    drawWaveform();
    drawWaveformBorder();
    drawAppTitleAndVersion();
    drawFooterBar();
    drawNowPlayingTitle();
    drawAllBoundaries();
  };

  return self;
}

CustomRadio().run();
