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
  const themeSettingsFolder = 'USER/ThemePicker/';
  const themeSettingsFile = 'USER/ThemePicker/theme.json';
  //try to read directory first, if we error, make the directory and return, nothing to read.
  try {
    require('fs').readdirSync(nD(themeSettingsFolder));
  } catch {
    require('fs').mkdir(nD(themeSettingsFolder));
    return null;
  }
  try {
    let fileString = require('fs').readFileSync(themeSettingsFile);
    log('read ' + fileString + 'from ' + themeSettingsFile);
    let fileObj = JSON.parse(fileString);
    return fileObj;
  } catch {
    //folder created but no theme file yet, ignore
    return null;
  }
}

function checkVer() {
  try {
    let s = require('Storage');
    let l = s.list();
    if (l.includes('VERSION') && l.includes('.bootcde')) {
      let vs = s.read('VERSION') || '';
      let vn = parseFloat(vs);
      imv = vn >= 1.29;
    }
  } catch (e) {
    console.log('Unable to determine JS version:', e);
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
        (pal[0][i] = g.toColor(
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
          (frac = 0.33);
        (pal[1][i] = g.toColor(
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
          (frac = 1);
        (pal[2][i] = g.toColor(
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
          (frac = 0.66);
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
        (pal[0][i] = g.toColor(
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
          ));
      Pip.setPalette(pal);
    }
  }
}

function run() {
  let imv = false;
  checkVer();
  let themeObj = readThemeFile();
  setTheme(themeObj);
  delete themeObj;
  delete pal;
  delete imv;
  delete setTheme;
  delete readThemeFile;
  delete nD;
  delete checkVer;
}

try {
  run();
  delete run;
} catch {
  //oops, error, don't crash out.
}
