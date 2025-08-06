// Clear everything from memory that's not needed
function clearMemory() {
  if (Pip.remove) Pip.remove();
  if (Pip.removeSubmenu) Pip.removeSubmenu();

  [
    'demoTimeout',
    'idleTimer',
    // 'kickIdleTimer',
    'typeTimer',
  ].forEach((k) => {
    if (Pip[k]) clearTimeout(Pip[k]);
    Pip[k] = undefined;
  });

  // Disable bootloader functions for PipUI+
  if (global.ui) {
    if (global.ui.enableRamScan) {
      global.ui.enableRamScan = false;
    }
    if (global.ui.enableSpecialTab) {
      global.ui.enableSpecialTab = false;
    }
    if (global.ui.enablePerksTab) {
      global.ui.enablePerksTab = false;
    }
  }

  clearInterval();
  clearTimeout();
  clearWatch();

  Pip.removeAllListeners && Pip.removeAllListeners();

  // Display buffers
  g.clear(); // Used
  bF.clear(); // Used
  bH.clear(); // Used
  bC && bC.clear();
  bC = undefined;

  // Radio
  rd && rd.tuningInterval && clearInterval(rd.tuningInterval);
  rd = undefined;
  stationName = undefined;
  stationNameSegments = undefined;
  stationNameTemp = undefined;

  // Factory test and settings
  ftm = undefined;

  // Other objects
  SEQ = undefined;
  alarmTimeout = undefined;
  d0 = undefined;
  lastValue = undefined;
  mPrev = undefined;
  rd = undefined;
  settings = settings || {};
  settings.idleTimeout = 0; // Disable idle timeout
  sm0 = undefined;
  tm0 = undefined;
  ts0 = undefined;

  // Clear global variables that are not needed
  // log(Object.keys(global));
  [
    // 'A0',
    // 'A1',
    // 'A10',
    // 'A11',
    // 'A12',
    // 'A13',
    // 'A14',
    // 'A15',
    // 'A2',
    // 'A3',
    // 'A4',
    // 'A5',
    // 'A6',
    // 'A7',
    // 'A8',
    // 'A9',
    // 'Array',
    // 'B0',
    // 'B1',
    // 'B10',
    // 'B11',
    // 'B12',
    // 'B13',
    // 'B14',
    // 'B15',
    // 'B2',
    // 'B3',
    // 'B4',
    // 'B5',
    // 'B6',
    // 'B7',
    // 'B8',
    // 'B9',
    'BGRECT',
    // 'BTN_PLAY',
    // 'BTN_POWER',
    // 'BTN_TORCH',
    // 'BTN_TUNEDOWN',
    // 'BTN_TUNEUP',
    // 'C0',
    // 'C1',
    // 'C10',
    // 'C11',
    // 'C12',
    // 'C13',
    // 'C14',
    // 'C15',
    // 'C2',
    // 'C3',
    // 'C4',
    // 'C5',
    // 'C6',
    // 'C7',
    // 'C8',
    // 'C9',
    // 'CHARGE_STAT',
    'CLIP_TYPE',
    // 'D0',
    // 'D1',
    // 'D10',
    // 'D11',
    // 'D12',
    // 'D13',
    // 'D14',
    // 'D15',
    // 'D2',
    // 'D3',
    // 'D4',
    // 'D5',
    // 'D6',
    // 'D7',
    // 'D8',
    // 'D9',
    // 'Date',
    // 'E',
    // 'E0',
    // 'E1',
    // 'E10',
    // 'E11',
    // 'E12',
    // 'E13',
    // 'E14',
    // 'E15',
    // 'E2',
    // 'E3',
    // 'E4',
    // 'E5',
    // 'E6',
    // 'E7',
    // 'E8',
    // 'E9',
    // 'Error',
    // 'File',
    // 'Function',
    // 'Graphics',
    // 'H0',
    // 'H1',
    // 'I2C',
    // 'JSON',
    // 'KNOB1_A',
    // 'KNOB1_B',
    // 'KNOB1_BTN',
    // 'KNOB2_A',
    // 'KNOB2_B',
    // 'LCD_BL',
    // 'LED_BLUE',
    // 'LED_GREEN',
    // 'LED_RED',
    // 'LED_TUNING',
    // 'MEAS_ENB',
    'MIN_FW_VER',
    // 'MODE',
    // 'MODEINFO',
    'SEQ',
    'MODE_SELECTOR',
    // 'Math',
    // 'Number',
    // 'Object',
    // 'Pin',
    // 'Pip',
    // 'Promise',
    'RADIO_AUDIO',
    // 'RegExp',
    // 'SDCARD_DETECT',
    // 'String',
    // 'Uint16Array',
    // 'VBAT_MEAS',
    // 'VERSION',
    // 'VUSB_MEAS',
    // 'VUSB_PRESENT',
    'alarmTimeout',
    'bC',
    // 'bF',
    // 'bH',
    'checkBatteryAndSleep',
    'checkMode',
    'configureAlarm',
    // 'console',
    'createDateTimeSubmenu',
    'd0',
    // 'dc',
    // 'drawFooter',
    // 'drawHeader',
    'drawText',
    'drawVaultNumLogo',
    'drawVaultTecLogo',
    'enterDemoMode',
    'factoryTestMode',
    // 'fs',
    // 'g',
    'getRandomExcluding',
    'ftm',
    'getUserApps',
    'getUserAudio',
    'getUserVideos',
    // 'icons',
    'lastValue',
    'leaveDemoMode',
    // 'log',
    'mPrev',
    // 'modes',
    'playBootAnimation',
    // 'process',
    // 'radioPlayClip',
    'rd',
    'readRDSData',
    'saveSettings',
    // 'settings',
    'showAlarm',
    'showMainMenu',
    'showTorch',
    'showVaultAssignment',
    'sm0',
    'stationName',
    'stationNameSegments',
    'stationNameTemp',
    'submenuAbout',
    'submenuApparel',
    'submenuApps',
    'submenuAudio',
    'submenuBlank',
    'submenuClock',
    'submenuConnect',
    'submenuDiagnostics',
    'submenuExtTerminal',
    'submenuInvAttach',
    'submenuMaintenance',
    'submenuMap',
    'submenuPalette',
    'submenuRad',
    'submenuRadio',
    'submenuSetAlarm',
    'submenuSetAlarmTime',
    'submenuSetDateTime',
    'submenuStats',
    'submenuStatus',
    'submenuVideos',
    'tm0',
    // 'torchButtonHandler',
    'ts0',
    'ui',
    'wakeFromSleep',
    'wakeOnLongPress',
  ].forEach((k) => {
    try {
      delete global[k];
    } catch (e) {}
  });

  // Clear Pip object properties that are not needed
  // log(Object.keys(Pip));
  [
    '#onknob1',
    // 'addWatches',
    // 'brightness',
    'btnDownPrev',
    'btnPlayPrev',
    'btnUpPrev',
    'clockVertical',
    'demoMode',
    'demoTimeout',
    'fadeOff',
    'fadeOn',
    // 'getDateAndTime',
    // 'getID',
    // 'idleTimer',
    // 'isSDCardInserted',
    // 'kickIdleTimer',
    // 'knob1Click',
    // 'knob2Click',
    // 'measurePin',
    // 'mode',
    'offAnimation',
    // 'offButtonHandler',
    'offOrSleep',
    // 'powerButtonHandler',
    'setDateAndTime',
    // 'sleeping',
    'typeText',
    // 'typeTimer',
    // 'updateBrightness',
    // 'usbConnectHandler',
  ].forEach((k) => {
    try {
      delete Pip[k];
    } catch (e) {}
  });

  // Re-add watches for button handling
  Pip.addWatches();

  process.memory(true); // GC
}

function memoryCheck(run) {
  const mem = process.memory();
  log(
    '[DICE ROLLER] Memory ' +
      run +
      ' cleanup: ' +
      mem.usage +
      '/' +
      mem.total +
      ' (' +
      Math.round((mem.usage / mem.total) * 100) +
      '%)',
  );
}

log('[DICE ROLLER] Preloading...');

memoryCheck('before');
clearMemory();
memoryCheck('after');

clearMemory = undefined;
delete global.clearMemory;
memoryCheck = undefined;
delete global.memoryCheck;

process.memory(true); // GC

log('[DICE ROLLER] Loading app...');
eval(fs.readFile('USER/DICE_ROLLER/diceroller.min.js'));
