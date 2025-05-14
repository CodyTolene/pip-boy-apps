// ============================================================================
//  Name: Custom Radio Bootloader
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A Custom Radio for the Pip-Boy 3000 Mk V.
//  Version: 2.2.0
// ============================================================================

function runScript(script) {
  try {
    const content = fs.readFile(script);
    global.eval(E.toString(content));
  } catch (err) {
    print('Error executing script:', script, err);
  }
}

function customRadio() {
  let options;
  try {
    const raw = fs.readFileSync('USER/CustomRadio/options.json');
    options = JSON.parse(raw);
  } catch (err) {
    print('Could not read options.json', err);
    options = null;
  }

  if (
    options &&
    options.enabled &&
    typeof MODEINFO !== 'undefined' &&
    typeof MODE !== 'undefined' &&
    MODEINFO[MODE.RADIO]
  ) {
    runScript('USER_BOOT/CustomRadio/waveform.js');
    runScript('USER_BOOT/CustomRadio/custom.submenu.js');
    runScript('USER_BOOT/CustomRadio/local.submenu.js');

    const waveform = new global.Waveform();

    const radioTab = MODEINFO[MODE.RADIO];
    if (radioTab.fn) delete radioTab.fn;

    radioTab.submenu = {
      LOCAL: function () {
        print('Opening LocalSubmenu...');
        new global.LocalSubmenu(waveform).show();
      },
      CUSTOM: function () {
        print('Opening CustomSubmenu...');
        new global.CustomSubmenu(waveform).show();
      },
    };
  }

  delete options;
  delete customRadio;
}

customRadio();
