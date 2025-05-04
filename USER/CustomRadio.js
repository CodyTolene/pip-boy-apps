// =============================================================================
//  Name: Custom Radio
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A custom music player that allows you to choose the music you
//               want to play from the `/RADIO` directory without restriction.
//  Version: 2.1.1
// =============================================================================

const fs = require('fs');

const OPTIONS_PATH = 'USER/CustomRadio/options.json';

const COLOR_GREEN = '#0F0';
const COLOR_WHITE = '#FFF';

const HEIGHT = g.getHeight();
const WIDTH = g.getWidth();
const CENTER = WIDTH / 2;

let options = { enabled: false };

/*********************
 * GENERAL FUNCTIONS *
 *********************/

function readOptions() {
  try {
    options = JSON.parse(fs.readFileSync(OPTIONS_PATH));
  } catch {
    saveOptions();
  }
}

function saveOptions() {
  fs.writeFile(OPTIONS_PATH, JSON.stringify(options));
}

function draw() {
  g.clear();

  g.setFontMonofonto28();
  g.setColor(COLOR_GREEN);
  g.drawString('Custom Radio', CENTER, 30);

  g.setFontMonofonto18();
  g.setColor(COLOR_WHITE);
  g.drawString('Options Menu', CENTER, 55);

  g.drawString(
    '[ ' + (options.enabled ? 'X' : ' ') + ' ] Enable Custom Radio',
    CENTER,
    HEIGHT / 2,
  );

  g.drawString('Press wheel in to toggle.', CENTER, HEIGHT - 60);
  g.drawString('Press torch to exit.', CENTER, HEIGHT - 35);
}

/*******************
 * BUTTON HANDLERS *
 *******************/

function scrollDown() {
  draw();
}

function scrollUp() {
  draw();
}

function toggleOption(dir) {
  options.enabled = !options.enabled;
  saveOptions();
  draw();
}

function handleTorch() {
  E.reboot();
}

/*******************
 * ENTRY FUNCTIONS *
 *******************/

readOptions();
draw();

/****************************
 * BUTTON EVENT SUBSCRIBERS *
 ****************************/

Pip.on('knob1', function (dir) {
  Pip.knob1Click();

  if (dir < 0) scrollDown();
  else if (dir > 0) scrollUp();
  else toggleOption();
});

Pip.on('torch', handleTorch);
