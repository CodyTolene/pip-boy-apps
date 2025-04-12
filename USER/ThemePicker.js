// =============================================================================
//  Name: UI Color - Custom Theme
//  Link: https://log.robco-industries.org/log/entry016/
//  Description: Update the Pip-Boy UI color to a custom palette. Custom
//  palettes can be set with the Theme Picker user app
//  Version: 1.0.1
// =============================================================================

let theme = [1, 1, 1];
let selected = 0;

const SCREEN_WIDTH = g.getWidth();
const SCREEN_HEIGHT = g.getHeight();
const themeSettingsFolder = 'USER/ThemePicker';
const themeSettingsFile = 'USER/ThemePicker/theme.json';

function readThemeFile() {
  //try to read directory first, if we error, make the directory and return, nothing to read.
  try {
    require('fs').readdirSync(themeSettingsFolder);
  } catch {
    require('fs').mkdir(themeSettingsFolder);
    return;
  }
  try {
    let fileString = require('fs').readFileSync(themeSettingsFile);
    let fileObj = JSON.parse(fileString);
    theme = fileObj;
  } catch {
    //folder created but no theme file yet, ignore
    return;
  }
}

function writeThemeFile() {
  try {
    require('fs').readdirSync(themeSettingsFolder);
  } catch {
    require('fs').mkdir(themeSettingsFolder);
  }
  let jsonString = JSON.stringify(theme);
  require('fs').writeFile(themeSettingsFile, jsonString);
}

function resetTheme() {
  try {
    require('fs').unlink(themeSettingsFile);
  } catch {}
}

function draw() {
  g.clear();
  g.setFontMonofonto18();
  g.setColor(theme[0], theme[1], theme[2]);
  g.drawString(
    'Select the primary color of\nthe theme',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 110,
  );
  switch (selected) {
    case 0:
      g.drawString(
        'R*:' + theme[0] + 'G:' + theme[1] + 'B:' + theme[2],
        SCREEN_WIDTH / 2,
        SCREEN_HEIGHT / 2 - 50,
      );
      break;
    case 1:
      g.drawString(
        'R:' + theme[0] + 'G*:' + theme[1] + 'B:' + theme[2],
        SCREEN_WIDTH / 2,
        SCREEN_HEIGHT / 2 - 50,
      );
      break;
    case 2:
      g.drawString(
        'R:' + theme[0] + 'G:' + theme[1] + 'B*:' + theme[2],
        SCREEN_WIDTH / 2,
        SCREEN_HEIGHT / 2 - 50,
      );
      break;
    default:
      break;
  }
  g.drawString(
    'Press wheel in to save\nand reboot',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 70,
  );
  g.drawString(
    'Press torch to reset theme\nand reboot',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 110,
  );

  g.fillRect(
    SCREEN_WIDTH / 2 - 120,
    SCREEN_HEIGHT / 2 - 20,
    SCREEN_WIDTH / 2 - 60,
    SCREEN_HEIGHT / 2 + 30,
  );
  g.setColor(theme[0] - 0.1, theme[1] - 0.1, theme[2] - 0.1);
  g.fillRect(
    SCREEN_WIDTH / 2 - 60,
    SCREEN_HEIGHT / 2 - 20,
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 30,
  );
  g.setColor(theme[0] - 0.2, theme[1] - 0.2, theme[2] - 0.2);
  g.fillRect(
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 20,
    SCREEN_WIDTH / 2 + 60,
    SCREEN_HEIGHT / 2 + 30,
  );
  g.setColor(theme[0] - 0.3, theme[1] - 0.3, theme[2] - 0.3);
  g.fillRect(
    SCREEN_WIDTH / 2 + 60,
    SCREEN_HEIGHT / 2 - 20,
    SCREEN_WIDTH / 2 + 120,
    SCREEN_HEIGHT / 2 + 30,
  );
}

function gracefulClose() {
  //shut down interval triggers first in case one fires while we're tearing down
  clearInterval(intervalId);
  Pip.removeListener('knob1', handleKnob1);
  Pip.removeListener('knob2', handleKnob2);
  Pip.removeListener('torch', handleTorch);
  E.reboot(); //we're using too much memory, we gotta full reboot now.
}

function handleKnob1(dir) {
  //first, play the click.
  Pip.knob1Click(dir);

  if (dir == 0) {
    writeThemeFile();
    gracefulClose();
  } else {
    theme[selected] += dir * 0.01;
    if (theme[selected] < 0) {
      theme[selected] = 0;
    } else if (theme[selected] > 1) {
      theme[selected] = 1;
    }
  }
  draw();
}

function handleKnob2(dir) {
  //first, play the click.
  Pip.knob2Click(dir);

  selected += dir;
  if (selected < 0) {
    selected = 0;
  } else if (selected > 2) {
    selected = 2;
  }
  draw();
}

function handleTorch() {
  resetTheme();
  gracefulClose();
}

Pip.on('knob1', handleKnob1);
Pip.on('knob2', handleKnob2);
Pip.on('torch', handleTorch);

readThemeFile();
draw();
let intervalId = setInterval(() => {
  checkMode();
  if (Pip.mode != 2) {
    gracefulClose();
  }
}, 100);
