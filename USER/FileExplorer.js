// =============================================================================
//  Name: File Explorer
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Directory and media file explorer for the Pip-Boy 3000 Mk V.
//  Version: 1.1.0
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

function walkAllSync(startDir, startDepth) {
  let stack = [{ path: startDir, depth: startDepth, parent: null }];
  let rootEntries = [];

  while (stack.length > 0) {
    let current = stack.pop();
    let dir = current.path;
    let depth = current.depth;
    let parent = current.parent;
    let list;

    try {
      list = fs.readdir(dir);
    } catch (e) {
      continue;
    }

    if (!list || !list.length) continue;

    list.forEach(function (name) {
      let fullPath = resolvePath(dir, name);
      let node = {
        name: name,
        path: fullPath,
        depth: depth,
      };

      try {
        fs.readdir(fullPath);
        node.type = 'dir';
        node.children = [];
        stack.push({ path: fullPath, depth: depth + 1, parent: node });
      } catch (err) {
        node.type = 'file';
      }

      if (parent) {
        parent.children.push(node);
      } else {
        rootEntries.push(node);
      }
    });
  }

  return rootEntries;
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
  g.drawString('File Explorer', SCREEN_WIDTH / 2, 10);
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

function flattenNestedTree(tree) {
  let result = [];
  let stack = tree.slice().reverse();

  while (stack.length > 0) {
    let node = stack.pop();

    result.push({
      name: node.name,
      path: node.path,
      type: node.type,
      depth: node.depth,
    });

    if (node.type === 'dir' && Array.isArray(node.children)) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
  }

  return result;
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
    let nestedTree = walkAllSync(ROOT_PATH, 0);
    let flatTree = flattenNestedTree(nestedTree);
    flattenTree(flatTree);
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
