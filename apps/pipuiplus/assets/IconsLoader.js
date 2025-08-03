if (global.ui === undefined) {
  try {
    global.ui = JSON.parse(
      require('fs').readFileSync('USER/PIP_UI_PLUS/options.json'),
    );
  } catch (e) {
    print('Error reading options:', e);
    global.ui = {};
    global.ui.hideCogIcon = false;
    global.ui.hideHolotapeIcon = false;
  }
}

function toggleIcons() {
  if (global.ui.hideCogIcon) {
    icons.cog = atob('gMBwMBgA');
  }
  if (global.ui.hideHolotapeIcon) {
    icons.holotape = atob('gMBwMBgA');
  }
}

toggleIcons();
