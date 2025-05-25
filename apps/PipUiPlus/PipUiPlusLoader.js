// =============================================================================
//  Name: PipUI+ Bootloader
//  Version: 1.0.0
// =============================================================================

// This function loads and evaluates a special submenu script dynamically
function specialSubmenu() {
  const script = fs.readFile('USER/PipUiPlus/Special.js');
  eval(script); // This executes the contents of the Special.js file
}

// This helper function renames keys in an object and optionally merges in more data
function alterProperties(originalObject, injectObject, renameMap) {
  return Object.keys(originalObject).reduce((result, key) => {
    // If renameMap has a new name for this key, use it, otherwise keep the key as-is
    const newKey = renameMap[key] || key;

    // Copy the original key's value to the new key
    result[newKey] = originalObject[key];

    // Also, if there's an injected object with the same key, merge it in
    Object.assign(result, injectObject[key]);

    return result;
  }, {});
}

// Modify the STAT mode's submenu by altering its properties
MODEINFO[MODE.STAT].submenu = alterProperties(
  MODEINFO[MODE.STAT].submenu,
  {
    // Add a new SPECIAL submenu item with the specialSubmenu handler
    STATUS: {
      SPECIAL: specialSubmenu,
    },
  },
  {
    // Rename submenu keys
    CONNECT: 'CONN',
    DIAGNOSTICS: 'DIAG',
  },
);
