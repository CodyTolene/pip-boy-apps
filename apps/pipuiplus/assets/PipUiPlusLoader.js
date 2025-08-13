if (global.ui === undefined) {
  try {
    global.ui = JSON.parse(fs.readFileSync('USER/PIP_UI_PLUS/options.json'));
  } catch (e) {
    print('Error reading options:', e);
    global.ui = {};
    global.ui.enableSpecialTab = false;
    global.ui.enablePerksTab = false;
  }
}

function specialSubmenu() {
  if (global.ui.enableSpecialTab) {
    // Avoid loading the bulk of the app into memory permanently, and instead
    // emulate flash memory by loading from SD only when needed.
    eval(fs.readFile('USER_BOOT/PIP_UI_PLUS/Special.min.js'));
  }
}

function perksSubmenu() {
  if (global.ui.enablePerksTab) {
    eval(fs.readFile('USER_BOOT/PIP_UI_PLUS/Perks.min.js'));
  }
}

function readdirSafely(path) {
  try {
    return fs.readdir(path).filter((n) => n != '.' && n != '..');
  } catch (_) {
    return [];
  }
}

function deleteSafely(path) {
  try {
    fs.unlink(path);
  } catch (_) {}
}

function deleteRecursively(path) {
  readdirSafely(path).forEach((n) => deleteRecursively(path + '/' + n));
  deleteSafely(path);
}

// Clean up the previous app files (this should be a temporary addition).
deleteRecursively('USER_BOOT/PipUiPlus');
deleteSafely('USER_BOOT/PipUiPlusLoader.js');

// Renames properties, adds new properties after specific properties, while
// maintaining their order in an object.
function alter(object, renames, properties) {
  const propertiesAlreadyMoved = {};
  const entries = Object.entries(object);

  for (let i = 0; i < entries.length; i++) {
    const key = entries[i][0];
    const value = entries[i][1];

    if (propertiesAlreadyMoved[key]) {
      continue;
    }

    delete object[key];
    object[renames[key] || key] = value;
    const newProperties = properties[key];

    for (const newKey in newProperties) {
      delete object[newKey];
      object[newKey] = newProperties[newKey];
      propertiesAlreadyMoved[newKey] = true;
    }
  }
}

const statusProperties = {};
if (global.ui.enableSpecialTab) statusProperties.SPECIAL = specialSubmenu;
if (global.ui.enablePerksTab) statusProperties.PERKS = perksSubmenu;

const renameMap =
  global.ui.enableSpecialTab && global.ui.enablePerksTab
    ? { CONNECT: 'CONN', DIAGNOSTICS: 'DIAG' }
    : {};

alter(MODEINFO[MODE.STAT].submenu, renameMap, { STATUS: statusProperties });
