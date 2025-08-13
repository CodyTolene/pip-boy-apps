function PipUIPlus() {
  const self = {};

  const APP = JSON.parse(fs.readFileSync('APPINFO/pipuiplus.info'));
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
  let powerButtonWatch = null;

  // Paging
  const PAGE_SIZE = 6;
  let page = 0;
  let selectedIndex = 0;

  // Open App Icon (20x20)
  let iconOpenApp = Graphics.createImage(`
    XXXXXXXXX...XXXXXXXX
    XXXXXXXXX...XXXXXXXX
    XXXXXXXXX...XXXXXXXX
    XXX............XXXXX
    XXX...........XXXXXX
    XXX..........XXX.XXX
    XXX.........XXX..XXX
    XXX........XXX...XXX
    XXX.......XXX.......
    XXX......XXX........
    XXX.....XXX.........
    XXX....XXX.......XXX
    XXX...XXX........XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
  `);
  let iconUnchecked = Graphics.createImage(`
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXX..............XXX
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
  `);
  let iconChecked = Graphics.createImage(`
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
    XXX..............XXX
    XXX..............XXX
    XXX............XXXXX
    XXX...........XXXXXX
    XXX..........XXX.XXX
    XXX.........XXX..XXX
    XXX........XXX...XXX
    XXX.......XXX....XXX
    XXXXXX...XXX.....XXX
    XXX.XXX.XXX......XXX
    XXX..XXXXX.......XXX
    XXX...XXX........XXX
    XXX..............XXX
    XXX..............XXX
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
    XXXXXXXXXXXXXXXXXXXX
  `);

  // Options
  let options = {
    enableSpecialTab: false,
    enablePerksTab: false,
    enableRamScan: false,
    hideCogIcon: false,
    hideHolotapeIcon: false,
  };
  let optionKeys = Object.keys(options);

  // Options that are not directly tied to json
  const EXTRA_OPTIONS = [
    {
      key: 'openThemePicker',
      render: function (x, y, selected) {
        if (selected) {
          g.setColor(COLOR_THEME);
        } else {
          g.setColor(COLOR_THEME_DARK);
        }
        g.drawImage(iconOpenApp, x + 6, y);
        g.drawString(
          'Open Advanced Theme Picker',
          x + iconOpenApp.width + 24,
          y,
        );
      },
      onSelect: function () {
        removeButtonListeners();

        if (inputInterval) {
          clearInterval(inputInterval);
          inputInterval = null;
        }

        print('[PipUI+] Loading Theme Picker...');

        try {
          cleanup();
          eval(
            fs.readFile('USER_BOOT/PIP_UI_PLUS/ThemePickerPreloader.min.js'),
          );
        } catch (e) {
          print('[PipUI+] Error loading Theme Picker:', e);
        }
      },
    },
  ];

  // Clean up EVERYTHING related to this file.
  function cleanup() {
    g.clear();
    if (g.reset) g.reset();

    removeButtonListeners();

    iconChecked = null;
    iconOpenApp = null;
    iconUnchecked = null;
    lastPlayButtonState = false;
    optionKeys = null;
    options = null;
  }

  function draw() {
    g.clear();

    g.setFontMonofonto28();
    g.setColor(COLOR_THEME);
    g.setFontAlign(0, -1);
    g.drawString(APP.name, CENTER, 20);

    g.setFontMonofonto18();
    g.setColor(COLOR_THEME_DARK);
    g.drawString('Options Menu v' + APP.version, CENTER, 55);

    const items = getMenuItems();
    const start = page * PAGE_SIZE;
    const visible = items.slice(start, start + PAGE_SIZE);

    const rowHeight = 26;
    g.setFontMonofonto16().setFontAlign(-1, -1);

    visible.forEach(function (item, i) {
      const labelY = 100 + i * rowHeight;
      const labelX = 50;
      const isSelected = i === selectedIndex;
      item.render(labelX, labelY, isSelected);
    });

    g.setFontMonofonto16();
    g.setColor(COLOR_THEME_DARK);
    g.setFontAlign(0, -1);
    g.drawString('Press power button to exit', CENTER, HEIGHT - 40);
  }

  function getMenuItems() {
    const toggleItems = optionKeys.map(function (key) {
      return {
        key: key,
        render: function (x, y, selected) {
          if (selected) {
            g.setColor(COLOR_THEME);
          } else {
            g.setColor(COLOR_THEME_DARK);
          }

          const checked = options[key];
          if (checked) {
            g.drawImage(iconChecked, x + 6, y);
          } else {
            g.drawImage(iconUnchecked, x + 6, y);
          }

          let label;
          switch (key) {
            case 'enableSpecialTab': {
              label = 'Enable STATS > SPECIAL tab';
              break;
            }
            case 'enablePerksTab': {
              label = 'Enable STATS > PERKS tab';
              break;
            }
            case 'enableRamScan': {
              label = 'Enable RAM Scan (bottom right of OS)';
              break;
            }
            case 'hideCogIcon': {
              label = 'Hide Cog Icon (top left of OS)';
              break;
            }
            case 'hideHolotapeIcon': {
              label = 'Hide Holotape Icon (top right of OS)';
              break;
            }
            default: {
              label =
                key.charAt(0).toUpperCase() +
                key.slice(1).replace(/([A-Z])/g, ' $1');
            }
          }

          g.drawString(label, x + iconOpenApp.width + 24, y);
        },
        onSelect: function () {
          options[key] = !options[key];

          switch (key) {
            case 'enableRamScan': {
              if (!global.ui) {
                global.ui = {};
              }
              global.ui.enableRamScan = options[key];
              break;
            }
          }

          saveOptions();
          draw();
        },
      };
    });

    return toggleItems.concat(EXTRA_OPTIONS);
  }

  function handleLeftKnob(dir) {
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir === 0) {
      selectCurrentItem();
    } else {
      scrollMenu(dir > 0 ? -1 : 1);
    }
  }

  function handleRightKnob(dir) {
    scrollMenu(dir);
  }

  function handlePowerButton() {
    cleanup();
    bC.clear(1).flip();
    E.reboot();
  }

  function handleTopButton() {
    // Adjust brightness
    const brightnessLevels = [1, 5, 10, 15, 20];
    const currentIndex = brightnessLevels.findIndex(function (level) {
      return level === Pip.brightness;
    });
    const nextIndex = (currentIndex + 1) % brightnessLevels.length;
    Pip.brightness = brightnessLevels[nextIndex];
    Pip.updateBrightness();
  }

  function readOptions() {
    try {
      const loaded = JSON.parse(fs.readFileSync(OPTIONS_PATH));

      if (loaded.enableThemePicker !== undefined) {
        delete loaded.enableThemePicker;
      }

      Object.keys(options).forEach(function (k) {
        if (loaded[k] !== undefined) {
          options[k] = loaded[k];
        }
      });

      optionKeys = Object.keys(options);

      saveOptions();
    } catch (e) {
      print('[PipUI+] Error reading options:', e);
      saveOptions();
    }
  }

  function removeButtonListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
    Pip.removeAllListeners(AUDIO_STOPPED);
    if (inputInterval) {
      clearInterval(inputInterval);
      inputInterval = null;
    }
    if (powerButtonWatch) {
      clearWatch(powerButtonWatch);
      powerButtonWatch = null;
    }
  }

  function setButtonListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
    inputInterval = setInterval(function () {
      const currentState = BTN_PLAY.read();
      if (currentState && !lastPlayButtonState) {
        selectCurrentItem();
      }
      lastPlayButtonState = currentState;
    }, 100);

    powerButtonWatch = setWatch(
      function () {
        handlePowerButton();
      },
      BTN_POWER,
      {
        debounce: 50,
        edge: 'rising',
        repeat: true,
      },
    );
  }

  function selectCurrentItem() {
    const items = getMenuItems();
    const index = page * PAGE_SIZE + selectedIndex;
    const item = items[index];

    if (!item) {
      return;
    }

    item.onSelect();
  }

  function saveOptions() {
    fs.writeFile(OPTIONS_PATH, JSON.stringify(options));
  }

  function scrollMenu(dir) {
    const items = getMenuItems();
    const start = page * PAGE_SIZE;
    const visibleCount = items.slice(start, start + PAGE_SIZE).length;
    const maxPage = Math.floor((items.length - 1) / PAGE_SIZE);

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

    removeButtonListeners();
    setButtonListeners();

    readOptions();
    draw();
  };

  return self;
}

PipUIPlus().run();
