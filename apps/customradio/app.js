// =============================================================================
//  Name: Custom Radio
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
//  Description: 
// =============================================================================

function CustomRadio() {
  const self = {};

  const APP_NAME = 'Custom Radio';
  const APP_VERSION = '3.0.0';

  // Screen
  const SCREEN_WIDTH = g.getWidth(); // Width (480px)
  const SCREEN_HEIGHT = g.getHeight(); // Height (320px)
  const SCREEN_AREA = {
    x1: 60, // Left (60px)
    y1: 50, // Top (50px)
    x2: SCREEN_WIDTH - 60, // Right (420px)
    y2: SCREEN_HEIGHT - 10, // Bottom (310px)
  };

  const MENU_LIST_AREA = {
    x1: SCREEN_AREA.x1 + 10, // Left (60px)
    y1: SCREEN_AREA.y1 + 20, // Top (70px)
    x2: ((SCREEN_AREA.x2 + SCREEN_AREA.x1) / 2), // Right (240px)
    y2: SCREEN_AREA.y2 - 20, // Bottom (290px)
  };

  const NOW_PLAYING_AREA = {
    x1: MENU_LIST_AREA.x2 + 10, // Left (250px)
    y1: SCREEN_AREA.y2 - 40, // Top (250px)
    x2: SCREEN_AREA.x2 - 10, // Right (410px)
    y2: SCREEN_AREA.y2 - 20, // Bottom (290px)
  };

  // Knobs and Buttons
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 100;
  let lastLeftKnobTime = 0;

  // Audio/music
  const MUSIC_STOPPED = 'audioStopped';
  const MUSIC_DIR = 'RADIO/';
  let currentAudio = null;

  // Menu
  let page = 0;
  const pageSize = 10;
  let songFiles = [];
  let selectedIndex = 0;

  function drawBoundaries(area) {
    g.setColor('#00ff00')
     .drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function handleLeftKnob(dir) {
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir === 0) {
      const currentStart = page * pageSize;
      const selectedFile = songFiles[currentStart + selectedIndex];
      if (!selectedFile) return;

      if (currentAudio === '/' + MUSIC_DIR + selectedFile) {
        stopSong();
      } else {
        playSong(selectedFile);
      }
    } else {
      menuScroll(dir * -1);
    }
  }

  function handleRightKnob(dir) {
    menuScroll(dir);
  }

  function handleTopButton() {
    removeListeners();

    bC.clear(1).flip();
    E.reboot();
  }

  function menuLoad() {
    try {
      songFiles = fs
        .readdir('/RADIO')
        .filter((f) => f.endsWith('.wav'))
        .sort();
    
      print('Loaded ' + songFiles.length +' songs:');
    } catch (e) {
      print('Failed to load songs:', e);
      songFiles = [];
    }

    page = 0;
    selectedIndex = 0;
    menuRender();
  }

  function menuRender() {
    const start = page * pageSize;
    const visibleFiles = songFiles.slice(start, start + pageSize);

    // Clear the previous menu area
    g.setColor('#000')
     .fillRect(
       MENU_LIST_AREA.x1, 
       MENU_LIST_AREA.y1, 
       MENU_LIST_AREA.x2, 
       MENU_LIST_AREA.y2
    );

    // Set up the font and alignment
    g.setFontMonofonto16()
     .setFontAlign(-1, -1, 0);

    const paddingTop = 10;
    const paddingLeft = 10;
    const rowHeight = 20;
    
    // Draw each song in the list
    visibleFiles.forEach((file, i) => {
      const y = (
        MENU_LIST_AREA.y1 + 
        (i * rowHeight) + 
        paddingTop
      );

      const name = file.replace(/\.wav$/i, '');
      const displayName = name.length > 19 ? name.slice(0, 16) + '...' : name;
;
      g.setColor(i === selectedIndex ? '#00ff00' : '#007f00')
       .drawString(
         displayName, 
         MENU_LIST_AREA.x1 + paddingLeft, 
         y, 
         true
      );
    });

    // Draw the boundaries
    drawBoundaries(SCREEN_AREA);
    drawBoundaries(MENU_LIST_AREA);
  }

  function menuScroll(dir) {
    const currentStart = page * pageSize;
    const visibleFiles = songFiles.slice(currentStart, currentStart + pageSize);
    const maxPage = Math.floor((songFiles.length - 1) / pageSize);

    selectedIndex += dir;

    if (selectedIndex < 0) {
      if (page > 0) {
        page--;
        selectedIndex = pageSize - 1;
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

    menuRender();
  }

  function playSong(song) {
    Pip.audioStop();
    currentAudio = '/' + MUSIC_DIR + song;
    Pip.audioStart(currentAudio);
    Pip.radioClipPlaying = true;

    // Clear the previous now playing area
    g.setColor('#000')
     .fillRect(
       NOW_PLAYING_AREA.x1, 
       NOW_PLAYING_AREA.y1, 
       NOW_PLAYING_AREA.x2, 
       NOW_PLAYING_AREA.y2
    );

    // Set up font and alignment
    g.setColor('#00ff00')
     .setFontMonofonto16()
     .setFontAlign(-1, -1, 0);

    const display = song.replace(/\.wav$/i, '');
    const displayName = display.length > 19 ? display.slice(0, 16) + '...' : display;

    // Draw the now playing text
    g.drawString(
      displayName, 
      NOW_PLAYING_AREA.x1, 
      NOW_PLAYING_AREA.y1, 
      true
    );

    drawBoundaries(NOW_PLAYING_AREA);
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
    Pip.on(MUSIC_STOPPED, stopSong);
  }

  function stopSong() {
    Pip.audioStop();
    currentAudio = null;
    Pip.radioClipPlaying = false;

    g.setColor('#000')
     .fillRect(
       NOW_PLAYING_AREA.x1, 
       NOW_PLAYING_AREA.y1, 
       NOW_PLAYING_AREA.x2, 
       NOW_PLAYING_AREA.y2
    );
    
    drawBoundaries(NOW_PLAYING_AREA);
  }

  self.run = function () {
    bC.clear(1).flip();

    Pip.mode = MODE.RADIO;
    drawHeader(Pip.mode);

    removeListeners();
    setListeners();

    // print('x: ' + SCREEN_WIDTH + ', y: ' + SCREEN_HEIGHT);

    // print('Screen Area:');
    // print('x1: ' + SCREEN_AREA.x1 + ', y1: ' + SCREEN_AREA.y1);
    // print('x2: ' + SCREEN_AREA.x2 + ', y2: ' + SCREEN_AREA.y2);

    // print('Menu List Area:');
    // print('x1: ' + MENU_LIST_AREA.x1 + ', y1: ' + MENU_LIST_AREA.y1);
    // print('x2: ' + MENU_LIST_AREA.x2 + ', y2: ' + MENU_LIST_AREA.y2);

    menuLoad();
    drawBoundaries(NOW_PLAYING_AREA);
  };

  return self;
}

CustomRadio().run();