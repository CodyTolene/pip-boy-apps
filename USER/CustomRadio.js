// =============================================================================
//  Name: Custom Radio
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A custom music player that allows you to choose the music you
//               want to play from the `/RADIO` directory without restriction.
// =============================================================================

function CustomRadio() {
  const self = {};

  const APP_NAME = 'Custom Radio';
  const APP_VERSION = '2.4.0';
  const OPTIONS_PATH = 'USER/CustomRadio/options.json';

  const COLOR_GREEN = '#0F0';
  const COLOR_WHITE = '#FFF';

  const HEIGHT = g.getHeight();
  const WIDTH = g.getWidth();
  const CENTER = WIDTH / 2;

  let options = { enabled: false };

  function readOptions() {
    try {
      options = JSON.parse(require('fs').readFileSync(OPTIONS_PATH));
    } catch (e) {
      print('Error reading options:', e);
      saveOptions();
    }
  }

  function saveOptions() {
    require('fs').writeFile(OPTIONS_PATH, JSON.stringify(options));
  }

  function draw() {
    g.clear();

    g.setFontMonofonto28();
    g.setColor(COLOR_GREEN);
    g.drawString(APP_NAME, CENTER, 30);

    g.setFontMonofonto18();
    g.setColor(COLOR_WHITE);
    g.drawString('Options Menu', CENTER, 60);

    g.setFontMonofonto18();
    g.setColor(COLOR_WHITE);
    g.drawString('v' + APP_VERSION, CENTER, 80);

    g.drawString(
      '[ ' + (options.enabled ? 'X' : ' ') + ' ] Enable Custom Radio',
      CENTER,
      HEIGHT / 2,
    );

    g.drawString('Press wheel in to toggle.', CENTER, HEIGHT - 60);
    g.drawString('Press torch to exit.', CENTER, HEIGHT - 35);
  }

  function toggleOption() {
    options.enabled = !options.enabled;
    saveOptions();
    draw();
  }

  self.run = function () {
    Pip.removeAllListeners('knob1');

    Pip.on('knob1', (dir) => {
      Pip.knob1Click();
      if (dir === 0) toggleOption();
    });

    setWatch(
      () => {
        g.clear();
        bC.flip();
        E.reboot();
      },
      BTN_TORCH,
      { repeat: true, edge: 'rising', debounce: 10 },
    );

    readOptions();
    draw();
  };

  return self;
}

CustomRadio().run();
