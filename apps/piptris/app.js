// =============================================================================
//  Name: Piptris
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-boy-apps
// =============================================================================

Pip.cleanLoad = function cleanLoad(path) {
  function cleanup() {
    try {
      bC.clear();
      g.clear();
      Pip.removeSubmenu && Pip.removeSubmenu();
      delete Pip.removeSubmenu;

      Pip.remove && Pip.remove();
      delete Pip.remove;

      Pip.removeAllListeners('torch');
      Pip.removeAllListeners('knob1');
      Pip.removeAllListeners('knob2');
      Pip.removeAllListeners('audioStopped');

      process.memory(true);
    } catch (e) {
      console.log(e);
    }
  }

  function load() {
    try {
      eval(fs.readFile(path));
    } catch (e) {
      g.reset().setFontAlign(0, 0).setFontMonofonto28();
      g.drawString(
        'Error loading ' + path.split('/').pop(),
        g.getWidth() / 2,
        g.getHeight() / 2,
      );
    }
  }

  cleanup();
  load();
};

Pip.cleanLoad('USER/PIPTRIS/piptris.min.js');
delete Pip.cleanLoad;
