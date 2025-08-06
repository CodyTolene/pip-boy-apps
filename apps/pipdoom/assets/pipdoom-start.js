function PipDoomStart() {
  const self = {};

  const PATH_PIP_DOOM = 'USER/PIP_DOOM/pipdoom.min.js';
  const PATH_LOGO = 'USER/PIP_DOOM/LOGO.json';

  let buttonHandlerInterval = null;
  let powerButtonWatch = null;

  function cleanup() {
    g.clear();
    if (buttonHandlerInterval) {
      clearInterval(buttonHandlerInterval);
      buttonHandlerInterval = null;
      delete buttonHandlerInterval;
    }
    if (powerButtonWatch) {
      clearWatch(powerButtonWatch);
      powerButtonWatch = null;
      delete powerButtonWatch;
    }
    delete PipDoomStart;
    process.memory(true); // GC
  }

  function drawStartScreen() {
    const color = g.theme.fg || '#00FF00';
    const logo = loadImage(PATH_LOGO);
    if (logo) {
      g.clear();
      g.setColor(color);
      g.drawImage(
        logo,
        (g.getWidth() - logo.width) / 2,
        (g.getHeight() - logo.height) / 2 - 10,
      );
    } else {
      log('Failed to load logo image: ', PATH_LOGO);
    }

    g.setFont('6x8');
    g.setColor(color);
    g.setFontAlign(0, 0);
    g.drawString(
      'Loading...',
      g.getWidth() / 2,
      (g.getHeight() + (logo ? logo.height : 0)) / 2 + 10,
    );
  }

  function loadImage(path) {
    try {
      let file = fs.readFile(path);
      let data = JSON.parse(file);
      return {
        bpp: data.bpp,
        buffer: atob(data.buffer),
        height: data.height,
        transparent: data.transparent,
        width: data.width,
      };
    } catch (e) {
      console.log(path, e);
      return null;
    }
  }

  self.run = function () {
    log('[PIP-DOOM] Main menu loaded...');
    drawStartScreen();

    setTimeout(() => {
      // Start game
      cleanup();
      log('[PIP-DOOM] Starting game...');
      eval(fs.readFile(PATH_PIP_DOOM));
    }, 3000);

    // Use in future when/if menu options are added.
    // buttonHandlerInterval = setInterval(() => {
    //   if (BTN_PLAY.read()) {
    //     // Start game
    //     cleanup();
    //     log('[PIP-DOOM] Starting game...');
    //     eval(fs.readFile(PATH_PIP_DOOM));
    //   }
    // }, 120);

    powerButtonWatch = setWatch(
      () => {
        cleanup();
        E.reboot();
      },
      BTN_POWER,
      { debounce: 50, edge: 'rising', repeat: true },
    );
  };

  return self;
}

PipDoomStart().run();
