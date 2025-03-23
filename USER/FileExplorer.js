// =============================================================================
//  App/Tool: Pip-Explorer
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Directory and media file explorer for the Pip-Boy 3000 Mk V.
// =============================================================================

var fs = require('fs');

const SCREEN_WIDTH = g.getWidth();
const SCREEN_HEIGHT = g.getHeight();

const COLOR_ACTIVE = '#0F0';
const COLOR_TEXT = '#FFF';
const LINE_HEIGHT = 12;
const MAX_LINES = Math.floor(SCREEN_HEIGHT / LINE_HEIGHT);
const ROOT_PATH = '/';

let flatList = [];
let currentIndex = 0;
let scrollOffset = 0;
let currentAudio = null;
let isVideoPlaying = false;

function resolvePath(dir, file) {
  if (dir === '/' || dir === '') return '/' + file;
  return dir + '/' + file;
}

function walkAllSync(dir, depth) {
  let results = [];
  try {
    let list = fs.readdir(dir);
    if (!list || !list.length) return results;

    list.forEach(function (name) {
      let fullPath = resolvePath(dir, name);
      try {
        fs.readdir(fullPath);
        results.push({
          name: name,
          path: fullPath,
          type: 'dir',
          depth: depth,
        });
        results = results.concat(walkAllSync(fullPath, depth + 1));
      } catch (err) {
        results.push({
          name: name,
          path: fullPath,
          type: 'file',
          depth: depth,
        });
      }
    });
  } catch (e) {
    console.log('Failed to read dir:', dir, e);
  }
  return results;
}

function flattenTree(tree) {
  flatList = tree;
  currentIndex = 0;
  scrollOffset = 0;
  drawUI();
}

function drawUI() {
  g.clear();
  g.setColor(COLOR_TEXT);
  g.setFont('6x8', 2);
  g.drawString('Pip-Explorer', SCREEN_WIDTH / 2, 10);
  g.setFont('6x8', 1);

  let visible = flatList.slice(scrollOffset, scrollOffset + MAX_LINES);

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

    // If playing audio show "(PLAYING)""
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
  if (currentIndex < flatList.length - 1) currentIndex++;
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
    playStop();
  }

  if (BTN_TORCH.read()) {
    Pip.audioStop();
    Pip.videoStop();
    currentAudio = null;
    isVideoPlaying = false;
    E.reboot();
  }
}

function playStop() {
  const selected = flatList[currentIndex];
  if (!selected) return;
  if (selected.type !== 'file') return;
  if (typeof selected.name !== 'string') return;

  const name = selected.name.toLowerCase();

  if (isVideoPlaying) {
    stopVideo();
    return;
  }

  // Audio
  if (name.endsWith('.wav') || name.endsWith('.mp3') || name.endsWith('.ogg')) {
    if (currentAudio === selected.path) {
      Pip.audioStop();
      currentAudio = null;
      drawUI();
      return;
    }

    Pip.audioStop();
    Pip.audioStart(selected.path);
    currentAudio = selected.path;
    drawUI();
    return;
  }

  // Video
  if (name.endsWith('.avi') || name.endsWith('.mp4')) {
    Pip.audioStop();
    Pip.videoStart(selected.path, { x: 40, y: 0 });
    isVideoPlaying = true;
    currentAudio = null;
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
  let msg = 'Loading directories...';
  g.drawString(msg, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
}

function startExplorer() {
  showLoadingScreen();

  setTimeout(function () {
    let tree = walkAllSync(ROOT_PATH, 0);
    console.log('Loaded', tree.length, 'items');
    flattenTree(tree);
    setInterval(handleInput, 150);
  }, 50);

  Pip.removeAllListeners('knob1');
  Pip.on('knob1', function (dir) {
    if (dir < 0) {
      scrollDown();
    } else if (dir > 0) {
      scrollUp();
    } else {
      playStop();
    }
  });

  Pip.removeAllListeners('knob2');
  Pip.on('knob2', function (dir) {
    if (dir < 0) {
      scrollUp();
    } else if (dir > 0) {
      scrollDown();
    }
  });
}

startExplorer();
