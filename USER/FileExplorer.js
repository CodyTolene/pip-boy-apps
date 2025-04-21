// =============================================================================
//  Name: File Explorer
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Directory and media file explorer for the Pip-Boy 3000 Mk V.
//  Version: 2.0.0
// =============================================================================

var fs = require('fs');

const SCREEN_WIDTH = g.getWidth();
const SCREEN_HEIGHT = g.getHeight();

const COLOR_ACTIVE = '#0F0';
const COLOR_TEXT = '#FFF';
const LINE_HEIGHT = 12;
const MAX_LINES = Math.floor(SCREEN_HEIGHT / LINE_HEIGHT);
const ROOT_PATH = '/';

let entries = [];
let currentIndex = 0;
let scrollOffset = 0;
let currentAudio = null;
let isVideoPlaying = false;

let isModernVersion = false;

try {
  let s = require('Storage');
  let l = s.list();
  if (l.includes('VERSION') && l.includes('.bootcde')) {
    let versionStr = s.read('VERSION') || '';
    let versionNum = parseFloat(versionStr);
    isModernVersion = versionNum >= 1.29;
  }
} catch (e) {
  console.log('Failed to detect JS version:', e);
}

function resolvePath(dir, file) {
  if (dir === '/' || dir === '') return '/' + file;
  return dir + '/' + file;
}

function loadDirectory(dir) {
  try {
    let list = fs.readdir(dir) || [];
    let depth = dir.split('/').length - 1;

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

function drawUI() {
  g.clear();
  g.setColor(COLOR_TEXT);
  g.setFont('6x8', 2);
  g.drawString('File Explorer', SCREEN_WIDTH / 2, 10);
  g.setFont('6x8', 1);

  let visible = entries.slice(scrollOffset, scrollOffset + MAX_LINES);

  visible.forEach(function (entry, i) {
    let isSelected = scrollOffset + i === currentIndex;
    g.setColor(isSelected ? COLOR_ACTIVE : COLOR_TEXT);

    let indent = '';
    for (let d = 0; d < entry.depth; d++) {
      indent += '...';
    }

    let tag = entry.type === 'dir' ? '[DIR] ' : '[FILE] ';
    let label = indent + tag + entry.name;
    let labelWidth = g.stringWidth(label);
    let x = 60 + labelWidth / 2;
    let y = 20 + i * LINE_HEIGHT;

    g.drawString(label, x, y);

    if (entry.path === currentAudio) {
      g.drawString(' (PLAYING)', x + labelWidth + 4, y);
    }
  });
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

function handleInput() {
  if (BTN_TUNEUP.read()) {
    scrollUp();
  }

  if (BTN_TUNEDOWN.read()) {
    scrollDown();
  }

  if (BTN_PLAY.read()) {
    selectEntry();
  }

  if (BTN_TORCH.read()) {
    Pip.audioStop();
    Pip.videoStop();
    currentAudio = null;
    isVideoPlaying = false;
    E.reboot();
  }
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

  if (name.endsWith('.wav') || name.endsWith('.mp3') || name.endsWith('.ogg')) {
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

  if (name.endsWith('.avi') || name.endsWith('.mp4')) {
    Pip.audioStop();
    Pip.videoStart(selected.path, { x: 40, y: 0 });
    isVideoPlaying = true;
    currentAudio = null;
    return;
  }

  if (name.endsWith('.holotape')) {
    Pip.loadApp(selected.path);
    return;
  }
}

function stopVideo() {
  if (isVideoPlaying) {
    Pip.videoStop();
    isVideoPlaying = false;
    drawUI();
  }
}

function showLoadingScreen() {
  g.clear();
  g.setFont('6x8', 2);
  g.setColor(COLOR_TEXT);
  g.drawString('Loading...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
}

function startExplorer() {
  if (!Pip.isSDCardInserted()) {
    g.clear();
    g.setFont('6x8', 2);
    g.setColor('#F00');
    g.drawString('NO SD CARD DETECTED', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
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
}

startExplorer();
