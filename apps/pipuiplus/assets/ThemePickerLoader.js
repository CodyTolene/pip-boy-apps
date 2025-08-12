function ThemePickerLoader() {
  const self = {};
  const fs = require('fs');

  const THEME_SETTINGS_FOLDER = 'USER/ThemePicker';
  const THEME_SETTINGS_FILE = 'USER/ThemePicker/theme.json';

  const RETRY_MAX = 5;
  let retry = 0;

  let imv = false;
  let themeObj = null;

  function nD(d) {
    if (imv && d.endsWith('/')) {
      return d.slice(0, -1);
    }
    if (!imv && !d.endsWith('/')) {
      return d + '/';
    }
    return d;
  }

  function readThemeFile() {
    // Confirm 'USER'
    try {
      fs.readdirSync('USER');
    } catch (e) {
      print('[Theme Picker Loader] USER directory missing.');
      return null;
    }

    // Theme folder
    try {
      fs.readdirSync(THEME_SETTINGS_FOLDER);
    } catch (e) {
      try {
        print(
          '[Theme Picker Loader] Creating missing folder:',
          THEME_SETTINGS_FOLDER,
        );
        fs.mkdir(THEME_SETTINGS_FOLDER);
      } catch (mkdirErr) {
        print('[Theme Picker Loader] Failed to create folder:', mkdirErr);
        return null;
      }
      return null;
    }

    // Theme file
    try {
      let fileString = fs.readFileSync(THEME_SETTINGS_FILE);
      print('[Theme Picker Loader] Read theme file:', fileString);
      return JSON.parse(fileString);
    } catch (e) {
      print('[Theme Picker Loader] No theme file found or invalid JSON.');
      return null;
    }
  }

  function setTheme(themeObj) {
    if (themeObj == null) {
      if (settings.palette) {
        //if user palette set through TWC settings, don't bother trying to reset the palette.
        themeObj = null;
      } else {
        //if user palette NOT set through TWC settings, make sure we have a default green palette or the screen goes blank.
        themeObj = {
          gradient: false,
          theme0: [0, 1, 0],
          theme1: [1, 1, 1],
        };
      }
    }
    if (themeObj != null) {
      if (themeObj.gradient) {
        //edit this later
        var pal = [
          new Uint16Array(16),
          new Uint16Array(16),
          new Uint16Array(16),
          new Uint16Array(16),
        ];
        for (i = 0; i < 16; i++) {
          let frac = 0;
          ((pal[0][i] = g.toColor(
            (((themeObj.theme1[0] - themeObj.theme0[0]) * frac +
              themeObj.theme0[0]) *
              i) /
              16,
            (((themeObj.theme1[1] - themeObj.theme0[1]) * frac +
              themeObj.theme0[1]) *
              i) /
              16,
            (((themeObj.theme1[2] - themeObj.theme0[2]) * frac +
              themeObj.theme0[2]) *
              i) /
              16,
          )),
            (frac = 0.33));
          ((pal[1][i] = g.toColor(
            (((themeObj.theme1[0] - themeObj.theme0[0]) * frac +
              themeObj.theme0[0]) *
              i) /
              16 -
              (i * 0.2) / 16,
            (((themeObj.theme1[1] - themeObj.theme0[1]) * frac +
              themeObj.theme0[1]) *
              i) /
              16 -
              (i * 0.2) / 16,
            (((themeObj.theme1[2] - themeObj.theme0[2]) * frac +
              themeObj.theme0[2]) *
              i) /
              16 -
              (i * 0.2) / 16,
          )),
            (frac = 1));
          ((pal[2][i] = g.toColor(
            (((themeObj.theme1[0] - themeObj.theme0[0]) * frac +
              themeObj.theme0[0]) *
              i) /
              16 +
              (i * 0.2) / 16,
            (((themeObj.theme1[1] - themeObj.theme0[1]) * frac +
              themeObj.theme0[1]) *
              i) /
              16 +
              (i * 0.2) / 16,
            (((themeObj.theme1[2] - themeObj.theme0[2]) * frac +
              themeObj.theme0[2]) *
              i) /
              16 +
              (i * 0.2) / 16,
          )),
            (frac = 0.66));
          pal[3][i] = g.toColor(
            (((themeObj.theme1[0] - themeObj.theme0[0]) * frac +
              themeObj.theme0[0]) *
              i) /
              16 -
              (i * 0.4) / 16,
            (((themeObj.theme1[1] - themeObj.theme0[1]) * frac +
              themeObj.theme0[1]) *
              i) /
              16 -
              (i * 0.4) / 16,
            (((themeObj.theme1[2] - themeObj.theme0[2]) * frac +
              themeObj.theme0[2]) *
              i) /
              16 -
              (i * 0.4) / 16,
          );
        }
        Pip.setPalette(pal);
      } else {
        for (
          var pal = [
              new Uint16Array(16),
              new Uint16Array(16),
              new Uint16Array(16),
              new Uint16Array(16),
            ],
            i = 0;
          i < 16;
          i++
        )
          ((pal[0][i] = g.toColor(
            (themeObj.theme0[0] * i) / 16,
            (themeObj.theme0[1] * i) / 16,
            (themeObj.theme0[2] * i) / 16,
          )),
            (pal[1][i] = g.toColor(
              (themeObj.theme0[0] * i) / 16 - (i * 0.2) / 16,
              (themeObj.theme0[1] * i) / 16 - (i * 0.2) / 16,
              (themeObj.theme0[2] * i) / 16 - (i * 0.2) / 16,
            )),
            (pal[2][i] = g.toColor(
              (themeObj.theme0[0] * i) / 16 + (i * 0.2) / 16,
              (themeObj.theme0[1] * i) / 16 + (i * 0.2) / 16,
              (themeObj.theme0[2] * i) / 16 + (i * 0.2) / 16,
            )),
            (pal[3][i] = g.toColor(
              (themeObj.theme0[0] * i) / 16 - (i * 0.4) / 16,
              (themeObj.theme0[1] * i) / 16 - (i * 0.4) / 16,
              (themeObj.theme0[2] * i) / 16 - (i * 0.4) / 16,
            )));
        Pip.setPalette(pal);
      }
    }
  }

  self.run = function () {
    themeObj = readThemeFile();
    setTheme(themeObj);
  };

  return self;
}

function onUserMount(callback, attempt) {
  attempt = attempt || 0;
  try {
    fs.readdirSync('USER');
    callback();
  } catch (e) {
    print('[Theme Picker Loader] USER not mounted yet, retrying...');
    if (attempt < 10) {
      setTimeout(() => onUserMount(callback, attempt + 1), 300);
    } else {
      print('[Theme Picker Loader] USER drive did not mount in time.');
    }
  }
}

onUserMount(() => {
  try {
    ThemePickerLoader().run();
    delete onUserMount;
    delete ThemePickerLoader;
  } catch (e) {
    print('[Theme Picker Loader] Error loading:', e);
  }
});
