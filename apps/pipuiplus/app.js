function PipUIPlus() {
  const self = {};

  const APP_NAME = 'Pip UI+';
  const APP_VERSION = '3.0.0';
  const OPTIONS_PATH = 'USER/PIP_UI_PLUS/options.json';

  // Colors
  const COLOR_THEME = g.theme.fg;
  const COLOR_BLACK = '#000000';
  const COLOR_THEME_DARK = g.blendColor(COLOR_BLACK, COLOR_THEME, 0.5);

  // Screen
  const HEIGHT = g.getHeight();
  const WIDTH = g.getWidth();
  const CENTER = WIDTH / 2;

  // Input handling
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const AUDIO_STOPPED = 'audioStopped';
  const KNOB_DEBOUNCE = 30;
  let lastLeftKnobTime = 0;
  let inputInterval = null;
  let lastPlayButtonState = false;

  // Paging
  const PAGE_SIZE = 5;
  let page = 0;
  let selectedIndex = 0;

  // Saved options
  let options = {
    enableSpecialTab: false,
    enablePerksTab: false,
    enableRamScan: false,
    hideCogIcon: false,
    hideHolotapeIcon: false,
  };
  const optionKeys = Object.keys(options);

  function draw() {
    g.clear();

    g.setFontMonofonto28();
    g.setColor(COLOR_THEME);
    g.setFontAlign(0, -1);
    g.drawString(APP_NAME, CENTER, 20);

    g.setFontMonofonto18();
    g.setColor(COLOR_THEME_DARK);
    g.drawString('Options Menu v' + APP_VERSION, CENTER, 55);

    const start = page * PAGE_SIZE;
    const visibleKeys = optionKeys.slice(start, start + PAGE_SIZE);

    const rowHeight = 30;
    g.setFontMonofonto18().setFontAlign(-1, -1);

    visibleKeys.forEach((key, i) => {
      const y = 100 + i * rowHeight;
      const x = 50;
      const checked = options[key] ? 'X' : ' ';
      let label = `[ ${checked} ] `;

      switch (key) {
        case 'enableSpecialTab': {
          label += 'Enable STATS > SPECIAL tab';
          break;
        }
        case 'enablePerksTab': {
          label += 'Enable STATS > PERKS tab';
          break;
        }
        case 'enableRamScan': {
          label += 'Enable RAM Scan (bottom right of OS)';
          break;
        }
        case 'hideCogIcon': {
          label += 'Hide Cog Icon (top left of OS)';
          break;
        }
        case 'hideHolotapeIcon': {
          label += 'Hide Holotape Icon (top right of OS)';
          break;
        }
        default: {
          // Convert `camelCase` keys to human-readable labels
          label +=
            key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, ' $1');
          break;
        }
      }

      if (i === selectedIndex) {
        g.setColor(COLOR_THEME);
      } else {
        g.setColor(COLOR_THEME_DARK);
      }

      g.drawString(label, x, y);
    });

    g.setFontMonofonto16();
    g.setColor(COLOR_THEME_DARK);
    g.setFontAlign(0, -1);
    g.drawString('Press power button to exit', CENTER, HEIGHT - 40);
  }

  function handleLeftKnob(dir) {
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir === 0) {
      toggleSelectedOption();
    } else {
      scrollMenu(dir > 0 ? -1 : 1);
    }
  }

  function handleRightKnob(dir) {
    scrollMenu(dir);
  }

  function handlePowerButton() {
    removeListeners();

    clearInterval(inputInterval);
    inputInterval = null;

    bC.clear(1).flip();
    E.reboot();
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

  function readOptions() {
    try {
      options = JSON.parse(require('fs').readFileSync(OPTIONS_PATH));
    } catch (e) {
      print('Error reading options:', e);
      saveOptions();
    }
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
    Pip.removeAllListeners(AUDIO_STOPPED);
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
  }

  function toggleSelectedOption() {
    const key = optionKeys[page * PAGE_SIZE + selectedIndex];
    if (!key) {
      return;
    }
    options[key] = !options[key];

    if (key === 'enableRamScan') {
      global.ui.enableRamScan = options[key];
    }

    saveOptions();
    draw();
  }

  function saveOptions() {
    require('fs').writeFile(OPTIONS_PATH, JSON.stringify(options));
  }

  function scrollMenu(dir) {
    const start = page * PAGE_SIZE;
    const visibleCount = optionKeys.slice(start, start + PAGE_SIZE).length;
    const maxPage = Math.floor((optionKeys.length - 1) / PAGE_SIZE);

    selectedIndex += dir;

    if (selectedIndex < 0) {
      if (page > 0) {
        page--;
        selectedIndex = PAGE_SIZE - 1;
      } else {
        selectedIndex = 0;
      }
    } else if (selectedIndex >= visibleCount) {
      if (page < maxPage) {
        page++;
        selectedIndex = 0;
      } else {
        selectedIndex = visibleCount - 1;
      }
    }

    draw();
  }

  self.run = function () {
    bC.clear();
    if (global.ui && global.ui.enableRamScan) {
      global.ui.enableRamScan = false;
    }

    removeListeners();
    setListeners();

    readOptions();
    draw();

    inputInterval = setInterval(() => {
      const currentState = BTN_PLAY.read();
      if (currentState && !lastPlayButtonState) {
        toggleSelectedOption();
      }
      lastPlayButtonState = currentState;
    }, 100);

    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: true,
    });
  };

  return self;
}

PipUIPlus().run();
