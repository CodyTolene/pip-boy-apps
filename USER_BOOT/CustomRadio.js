// =============================================================================
//  Name: Custom Radio Bootloader
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Custom Radio overrides and functions for the Pip-Boy 3000 Mk V.
//  Version: 2.0.0
// =============================================================================

/***************
 * GLOBAL VARS *
 ***************/

E.animationAngle = 0;
E.currentAudio = null;
E.waveformGfx = null;
E.waveformInterval = null;
E.waveformPoints = null;

/********************
 * GLOBAL FUNCTIONS *
 ********************/

E.drawWaveformBorder = function () {
  for (let i = 0; i < 40; i++) {
    const color = i % 5 === 0 ? 3 : 1;
    const height = i % 5 === 0 ? 2 : 1;
    bC.setColor(color);
    bC.drawLine(245 + i * 3, 143 - height, 245 + i * 3, 143);
    bC.drawLine(367 - height, 22 + i * 3, 367, 22 + i * 3);
  }
  bC.setColor(3).drawLine(245, 144, 367, 144).drawLine(368, 144, 368, 22);
  bC.flip();
};

E.startWaveform = function () {
  // Clear any existing interval
  if (E.waveformInterval) clearInterval(E.waveformInterval);

  // Re-initialize
  E.animationAngle = 0;
  E.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, { msb: true });
  if (E.getAddressOf(E.waveformGfx, 0) === 0) {
    E.waveformGfx = undefined;
    E.defrag();
    E.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, { msb: true });
  }

  E.waveformPoints = new Uint16Array(60);
  for (let i = 0; i < 60; i += 2) E.waveformPoints[i] = i * 2;

  // Start drawing loop
  E.waveformInterval = setInterval(() => {
    if (!E.waveformGfx) return;

    E.waveformGfx.clearRect(0, 0, 119, 119);

    if (Pip.radioClipPlaying) {
      Pip.getAudioWaveform(E.waveformPoints, 20, 100);
    } else if (Pip.radioOn && typeof RADIO_AUDIO !== 'undefined') {
      for (let i = 1; i < 60; i += 2) {
        E.waveformPoints[i] = E.clip(
          60 + (analogRead(RADIO_AUDIO) - 0.263) * 600,
          0,
          119,
        );
      }
    } else {
      let a = E.animationAngle;
      for (let i = 1; i < 60; i += 2) {
        E.waveformPoints[i] =
          60 + Math.sin(a) * 45 * Math.sin((a += 0.6) * 0.13);
      }
    }

    E.waveformGfx.drawPolyAA(E.waveformPoints);
    E.animationAngle += 0.3;
    Pip.blitImage(E.waveformGfx, 285, 85, { noScanEffect: true });
  }, 50);
};

E.stopWaveform = function () {
  if (E.waveformInterval) clearInterval(E.waveformInterval);
  E.waveformInterval = null;
};

/*******************
 * RADIO FUNCTIONS *
 *******************/

function submenuCustomRadio() {
  if (!rd._options) rd.setupI2C();

  if (E.currentAudio) Pip.audioStop();
  E.currentAudio = null;

  Pip.radioKPSS = false;
  if (rd.isOn()) rd.enable(false);

  E.stopWaveform();
  Pip.radioClipPlaying = false;

  bC.clear(1);
  E.startWaveform();

  let files = [];
  try {
    files = require('fs')
      .readdir('/RADIO')
      .filter((f) => f.endsWith('.wav'))
      .sort();
  } catch (e) {
    print('Failed to load radio files:', e);
  }

  const PAGE_SIZE = 5;
  let page = 0;

  const menuHeader = {
    '': {
      x2: 200,
      predraw: () => bC.drawImage(E.waveformGfx, 245, 20),
    },
  };

  function renderMenu() {
    const start = page * PAGE_SIZE;
    const pageFiles = files.slice(start, start + PAGE_SIZE);
    const menu = Object.assign({}, menuHeader);

    pageFiles.forEach((f) => {
      menu[f] = () => {
        if (E.currentAudio) Pip.audioStop();
        E.currentAudio = '/RADIO/' + f;

        E.stopWaveform();
        Pip.radioClipPlaying = false;

        Pip.radioClipPlaying = true;
        Pip.audioStart(E.currentAudio);

        E.startWaveform();
        E.drawWaveformBorder();
      };
    });

    if (page > 0) {
      menu['< PREV'] = () => {
        E.stopWaveform();
        Pip.radioClipPlaying = false;
        page--;
        renderMenu();
        E.startWaveform();
        E.drawWaveformBorder();
      };
    }

    if ((page + 1) * PAGE_SIZE < files.length) {
      menu['NEXT >'] = () => {
        E.stopWaveform();
        Pip.radioClipPlaying = false;
        page++;
        renderMenu();
        E.startWaveform();
        E.drawWaveformBorder();
      };
    }

    E.showMenu(menu);
  }

  renderMenu();
  E.drawWaveformBorder();

  const originalClose = Pip.removeSubmenu;
  Pip.removeSubmenu = function () {
    E.stopWaveform();
    Pip.radioKPSS = false;
    if (E.currentAudio) Pip.audioStop();
    E.currentAudio = null;
    if (typeof originalClose === 'function') originalClose();
  };
}

function submenuLocalRadio() {
  if (!rd._options) rd.setupI2C();

  if (E.currentAudio) Pip.audioStop();
  E.currentAudio = null;

  Pip.radioKPSS = false;

  E.stopWaveform();
  Pip.radioClipPlaying = false;

  bC.clear(1);

  rd.rdsTimer = setInterval(readRDSData, 100);
  if (rd.isOn()) {
    rd.getChannelInfo();
    rd.drawFreq();
  }

  E.startWaveform();

  let tuneDelayTimeout = null;
  let knobInputTimeout = null;
  let lastInput = 0;

  function handleKnob2(dir) {
    if (!knobInputTimeout || dir !== lastInput) {
      rd.freq += dir * 0.1;
      if (rd.freq < rd.start / 100) rd.freq = rd.end / 100;
      if (rd.freq > rd.end / 100) rd.freq = rd.start / 100;
      rd.drawFreq();

      if (tuneDelayTimeout) clearTimeout(tuneDelayTimeout);
      tuneDelayTimeout = setTimeout(() => {
        try {
          rd.freqSet(rd.freq);
        } catch (err) {
          print('Error tuning radio:', err);
        }
        tuneDelayTimeout = null;
      }, 200);

      if (knobInputTimeout) clearTimeout(knobInputTimeout);
      knobInputTimeout = setTimeout(() => {
        knobInputTimeout = null;
      }, 20);
    }
    lastInput = dir;
  }

  Pip.on('knob2', handleKnob2);

  E.showMenu({
    '': {
      x2: 200,
      predraw: () => {
        bC.drawImage(E.waveformGfx, 245, 20);
        rd.drawFreq(bC);
      },
    },
    'FM Radio': {
      value: rd.isOn(),
      format: (v) => (v ? 'On' : 'Off'),
      onchange: (v) => {
        if (v) {
          rd.enable(true);
          Pip.audioStart('UI/RADIO_ON.wav');
        } else {
          rd.enable(false);
          rd.drawFreq();
          Pip.audioStart('UI/RADIO_OFF.wav');
        }
      },
    },
    'FM Volume': {
      value: rd.getVol(),
      min: 0,
      max: 15,
      step: 1,
      onchange: (v) => rd.setVol(v),
    },
  });

  E.drawWaveformBorder();

  const originalClose = Pip.removeSubmenu;
  Pip.removeSubmenu = function () {
    E.stopWaveform();
    if (rd.tuningInterval) clearInterval(rd.tuningInterval);
    if (rd.rdsTimer) clearInterval(rd.rdsTimer);
    Pip.removeListener('knob2', handleKnob2);
    if (tuneDelayTimeout) clearTimeout(tuneDelayTimeout);
    if (typeof originalClose === 'function') originalClose();
  };
}

/*******************
 * RADIO OVERRIDES *
 *******************/

(function () {
  const optionsPath = 'USER/CustomRadio/options.json';

  function readCustomRadioOptions() {
    try {
      let file = require('fs').readFileSync(optionsPath);
      return JSON.parse(file);
    } catch {
      return null;
    }
  }

  const options = readCustomRadioOptions();
  if (options && options.enabled) {
    MODEINFO = [
      0,
      {
        name: 'STAT',
        submenu: {
          STATUS: submenuStatus,
          CONNECT: submenuConnect,
          DIAGNOSTICS: submenuDiagnostics,
        },
      },
      {
        name: 'INV',
        submenu: {
          ATTACHMENTS: submenuInvAttach,
          APPAREL: submenuApparel,
          APPS: submenuApps,
          AID: showVaultAssignment,
        },
      },
      {
        name: 'DATA',
        submenu: {
          CLOCK: submenuClock,
          STATS: submenuStats,
          MAINTENANCE: submenuMaintenance,
        },
      },
      {
        name: 'MAP',
        fn: submenuMap,
      },
      {
        name: 'RADIO',
        submenu: {
          LOCAL: submenuLocalRadio,
          CUSTOM: submenuCustomRadio,
        },
      },
    ];
  }

  delete readCustomRadioOptions;
  delete options;
})();
