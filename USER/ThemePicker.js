let theme0 = [1, 1, 1];
let theme1 = [1, 1, 1];
let selected = 0;
let gradient = false;

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
    theme0 = fileObj.theme0;
    theme1 = fileObj.theme1;
    gradient = fileObj.gradient;
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
  let jobj = {
    gradient: gradient,
    theme0: theme0,
    theme1: theme1,
  };
  let jsonString = JSON.stringify(jobj);
  require('fs').writeFile(themeSettingsFile, jsonString);
}

function resetTheme() {
  try {
    require('fs').unlink(themeSettingsFile);
  } catch {}
}

function drawBlocks() {
  let offset = -120;

  if (gradient) {
    for (i = 0; i < 16; i++) {
      let frac = 0;
      g.setColor(
        (((theme1[0] - theme0[0]) * frac + theme0[0]) * i) / 16,
        (((theme1[1] - theme0[1]) * frac + theme0[1]) * i) / 16,
        (((theme1[2] - theme0[2]) * frac + theme0[2]) * i) / 16,
      );
      g.fillRect(
        SCREEN_WIDTH / 2 - offset,
        SCREEN_HEIGHT / 2 - 20,
        SCREEN_WIDTH / 2 - offset + 16,
        SCREEN_HEIGHT / 2 - 4,
      );
      frac = 0.33;
      g.setColor(
        (((theme1[0] - theme0[0]) * frac + theme0[0]) * i) / 16 -
          (i * 0.2) / 16,
        (((theme1[1] - theme0[1]) * frac + theme0[1]) * i) / 16 -
          (i * 0.2) / 16,
        (((theme1[2] - theme0[2]) * frac + theme0[2]) * i) / 16 -
          (i * 0.2) / 16,
      );
      g.fillRect(
        SCREEN_WIDTH / 2 - offset,
        SCREEN_HEIGHT / 2 + -4,
        SCREEN_WIDTH / 2 - offset + 16,
        SCREEN_HEIGHT / 2 + 12,
      );
      frac = 1;
      g.setColor(
        (((theme1[0] - theme0[0]) * frac + theme0[0]) * i) / 16 +
          (i * 0.2) / 16,
        (((theme1[1] - theme0[1]) * frac + theme0[1]) * i) / 16 +
          (i * 0.2) / 16,
        (((theme1[2] - theme0[2]) * frac + theme0[2]) * i) / 16 +
          (i * 0.2) / 16,
      );
      g.fillRect(
        SCREEN_WIDTH / 2 - offset,
        SCREEN_HEIGHT / 2 + 12,
        SCREEN_WIDTH / 2 - offset + 16,
        SCREEN_HEIGHT / 2 + 28,
      );
      frac = 0.66;
      g.setColor(
        (((theme1[0] - theme0[0]) * frac + theme0[0]) * i) / 16 -
          (i * 0.4) / 16,
        (((theme1[1] - theme0[1]) * frac + theme0[1]) * i) / 16 -
          (i * 0.4) / 16,
        (((theme1[2] - theme0[2]) * frac + theme0[2]) * i) / 16 -
          (i * 0.4) / 16,
      );
      g.fillRect(
        SCREEN_WIDTH / 2 - offset,
        SCREEN_HEIGHT / 2 + 28,
        SCREEN_WIDTH / 2 - offset + 16,
        SCREEN_HEIGHT / 2 + 44,
      );
      offset += 16;
    }
  } else {
    for (i = 0; i < 16; i++) {
      g.setColor(
        (theme0[0] * i) / 16,
        (theme0[1] * i) / 16,
        (theme0[2] * i) / 16,
      );
      g.fillRect(
        SCREEN_WIDTH / 2 - offset,
        SCREEN_HEIGHT / 2 - 20,
        SCREEN_WIDTH / 2 - offset + 16,
        SCREEN_HEIGHT / 2 - 4,
      );
      g.setColor(
        (theme0[0] * i) / 16 - (i * 0.2) / 16,
        (theme0[1] * i) / 16 - (i * 0.2) / 16,
        (theme0[2] * i) / 16 - (i * 0.2) / 16,
      );
      g.fillRect(
        SCREEN_WIDTH / 2 - offset,
        SCREEN_HEIGHT / 2 + -4,
        SCREEN_WIDTH / 2 - offset + 16,
        SCREEN_HEIGHT / 2 + 12,
      );
      g.setColor(
        (theme0[0] * i) / 16 + (i * 0.2) / 16,
        (theme0[1] * i) / 16 + (i * 0.2) / 16,
        (theme0[2] * i) / 16 + (i * 0.2) / 16,
      );
      g.fillRect(
        SCREEN_WIDTH / 2 - offset,
        SCREEN_HEIGHT / 2 + 12,
        SCREEN_WIDTH / 2 - offset + 16,
        SCREEN_HEIGHT / 2 + 28,
      );
      g.setColor(
        (theme0[0] * i) / 16 - (i * 0.4) / 16,
        (theme0[1] * i) / 16 - (i * 0.4) / 16,
        (theme0[2] * i) / 16 - (i * 0.4) / 16,
      );
      g.fillRect(
        SCREEN_WIDTH / 2 - offset,
        SCREEN_HEIGHT / 2 + 28,
        SCREEN_WIDTH / 2 - offset + 16,
        SCREEN_HEIGHT / 2 + 44,
      );
      offset += 16;
    }
  }
}

function draw() {
  g.clear();
  g.setFontMonofonto18();
  g.setColor(theme0[0], theme0[1], theme0[2]);
  g.drawString(
    'Select the primary color of the theme',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 110,
  );
  g.drawString(
    'Move the tuner up to toggle 1 or 2 colours.',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 - 90,
  );
  if (gradient) {
    switch (selected) {
      case 0:
        g.drawString(
          '1: R*:' +
            theme0[0] +
            'G:' +
            theme0[1] +
            'B:' +
            theme0[2] +
            '   2: R:' +
            theme1[0] +
            'G:' +
            theme1[1] +
            'B:' +
            theme1[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      case 1:
        g.drawString(
          '1: R:' +
            theme0[0] +
            'G*:' +
            theme0[1] +
            'B:' +
            theme0[2] +
            '   2: R:' +
            theme1[0] +
            'G:' +
            theme1[1] +
            'B:' +
            theme1[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      case 2:
        g.drawString(
          '1: R:' +
            theme0[0] +
            'G:' +
            theme0[1] +
            'B*:' +
            theme0[2] +
            '   2: R:' +
            theme1[0] +
            'G:' +
            theme1[1] +
            'B:' +
            theme1[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      case 3:
        g.drawString(
          '1: R:' +
            theme0[0] +
            'G:' +
            theme0[1] +
            'B:' +
            theme0[2] +
            '   2: R*:' +
            theme1[0] +
            'G:' +
            theme1[1] +
            'B:' +
            theme1[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      case 4:
        g.drawString(
          '1: R:' +
            theme0[0] +
            'G:' +
            theme0[1] +
            'B:' +
            theme0[2] +
            '   2: R:' +
            theme1[0] +
            'G*:' +
            theme1[1] +
            'B:' +
            theme1[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      case 5:
        g.drawString(
          '1: R:' +
            theme0[0] +
            'G:' +
            theme0[1] +
            'B:' +
            theme0[2] +
            '   2: R:' +
            theme1[0] +
            'G:' +
            theme1[1] +
            'B*:' +
            theme1[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      default:
        break;
    }
  } else {
    switch (selected) {
      case 0:
        g.drawString(
          'R*:' + theme0[0] + 'G:' + theme0[1] + 'B:' + theme0[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      case 1:
        g.drawString(
          'R:' + theme0[0] + 'G*:' + theme0[1] + 'B:' + theme0[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      case 2:
        g.drawString(
          'R:' + theme0[0] + 'G:' + theme0[1] + 'B*:' + theme0[2],
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 50,
        );
        break;
      default:
        break;
    }
  }
  g.drawString(
    'Press wheel in to save and reboot',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 90,
  );
  g.drawString(
    'Press torch to reset theme and reboot',
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2 + 110,
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
    gradient != gradient;
    writeThemeFile();
    gracefulClose();
  } else {
    if (gradient && selected > 2) {
      theme1[selected % 3] += dir * 0.01;
      if (theme1[selected % 3] < 0) {
        theme1[selected % 3] = 0;
        return; //skip draw at cap.
      } else if (theme1[selected % 3] > 1) {
        theme1[selected % 3] = 1;
        return; //skip draw at cap.
      }
    } else {
      theme0[selected] += dir * 0.01;
      if (theme0[selected] < 0) {
        theme0[selected] = 0;
        return; //skip draw at cap.
      } else if (theme0[selected] > 1) {
        theme0[selected] = 1;
        return; //skip draw at cap.
      }
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
    return; //skip draw at cap.
  } else if (!gradient && selected > 2) {
    selected = 2;
    return; //skip draw at cap.
  } else if (gradient && selected > 5) {
    selected = 5;
    return; //skip draw at cap.
  }
  draw();
}

function handleTorch() {
  resetTheme();
  gracefulClose();
}

function checkTuner() {
  if (BTN_TUNEUP.read()) {
    gradient = !gradient;
    draw();
  }
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
  } else {
    //only load the blocks every yeigh-often to prevent slow draws.
    drawBlocks();
    checkTuner();
  }
}, 250);
