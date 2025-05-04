// =============================================================================
//  Name: Custom Radio Bootloader
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Custom Radio overrides and functions for the Pip-Boy 3000 Mk V.
//  Version: 2.1.1
// =============================================================================

Pip.CustomRadio = {
  // Variables
  animationAngle: 0,
  currentAudio: null,
  waveformGfx: null,
  waveformInterval: null,
  waveformPoints: null,
  // Functions
  drawWaveformBorder: function () {
    for (let i = 0; i < 40; i++) {
      const color = i % 5 === 0 ? 3 : 1;
      const height = i % 5 === 0 ? 2 : 1;
      bC.setColor(color);
      bC.drawLine(245 + i * 3, 143 - height, 245 + i * 3, 143);
      bC.drawLine(367 - height, 22 + i * 3, 367, 22 + i * 3);
    }
    bC.setColor(3).drawLine(245, 144, 367, 144).drawLine(368, 144, 368, 22);
    bC.flip();
  },
  drawCurrentlyPlaying: function () {
    bC.setColor(0).fillRect(244, 154, 400, 180);

    if (Pip.CustomRadio.currentAudio) {
      const song = Pip.CustomRadio.currentAudio
        .split('/')
        .pop()
        .replace(/\.wav$/i, '');
      const displayName = song.length > 19 ? song.slice(0, 16) + '...' : song;

      bC.setFontMonofonto16()
        .setColor(3)
        .drawString(displayName, 244, 155)
        .flip();
    }
  },
  startWaveform: function () {
    Pip.CustomRadio.stopWaveform();
    Pip.CustomRadio.animationAngle = 0;
    Pip.CustomRadio.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, {
      msb: true,
    });
    if (E.getAddressOf(Pip.CustomRadio.waveformGfx, 0) === 0) {
      Pip.CustomRadio.waveformGfx = undefined;
      E.defrag();
      Pip.CustomRadio.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, {
        msb: true,
      });
    }

    Pip.CustomRadio.waveformPoints = new Uint16Array(60);
    for (let i = 0; i < 60; i += 2) Pip.CustomRadio.waveformPoints[i] = i * 2;

    Pip.CustomRadio.waveformInterval = setInterval(() => {
      if (!Pip.CustomRadio.waveformGfx) return;

      Pip.CustomRadio.waveformGfx.clearRect(0, 0, 119, 119);

      if (Pip.radioClipPlaying) {
        Pip.getAudioWaveform(Pip.CustomRadio.waveformPoints, 20, 100);
      } else if (Pip.radioOn && typeof RADIO_AUDIO !== 'undefined') {
        for (let i = 1; i < 60; i += 2) {
          Pip.CustomRadio.waveformPoints[i] = E.clip(
            60 + (analogRead(RADIO_AUDIO) - 0.263) * 600,
            0,
            119,
          );
        }
      } else {
        let a = Pip.CustomRadio.animationAngle;
        for (let i = 1; i < 60; i += 2) {
          Pip.CustomRadio.waveformPoints[i] =
            60 + Math.sin(a) * 45 * Math.sin((a += 0.6) * 0.13);
        }
      }

      Pip.CustomRadio.waveformGfx.drawPolyAA(Pip.CustomRadio.waveformPoints);
      Pip.CustomRadio.animationAngle += 0.3;
      Pip.blitImage(Pip.CustomRadio.waveformGfx, 285, 85, {
        noScanEffect: true,
      });
    }, 50);
  },
  stopWaveform: function () {
    if (Pip.CustomRadio.waveformInterval)
      clearInterval(Pip.CustomRadio.waveformInterval);
    Pip.CustomRadio.waveformInterval = null;
    if (Pip.CustomRadio.waveformGfx) {
      Pip.CustomRadio.waveformGfx = null;
      E.defrag();
    }
  },
};

/*******************
 * RADIO FUNCTIONS *
 *******************/

function submenuCustomRadio() {
  let selectedFile = null;
  let suppressKnob1 = false;

  if (!rd._options) rd.setupI2C();

  if (Pip.CustomRadio.currentAudio) {
    Pip.audioStop();
    Pip.CustomRadio.currentAudio = null;
    Pip.radioClipPlaying = false;
  }

  Pip.radioKPSS = false;
  if (rd.isOn()) rd.enable(false);

  Pip.radioClipPlaying = false;

  bC.clear(1);

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
  let playingRandom = false;
  let randomQueue = [];
  let randomIndex = 0;

  const menuHeader = {
    '': {
      x2: 200,
      predraw: () => {
        if (Pip.CustomRadio.waveformGfx)
          bC.drawImage(Pip.CustomRadio.waveformGfx, 245, 20);
      },
    },
  };

  function handleAudioStopped() {
    if (playingRandom) playRandom();
  }

  function playRandom() {
    if (randomIndex >= randomQueue.length) {
      randomQueue = files.slice().sort(() => Math.random() - 0.5);
      randomIndex = 0;
    }

    if (Pip.CustomRadio.currentAudio) {
      Pip.audioStop();
      Pip.CustomRadio.currentAudio = null;
      Pip.radioClipPlaying = false;
    }

    const f = randomQueue[randomIndex++];
    Pip.CustomRadio.currentAudio = '/RADIO/' + f;
    Pip.audioStart(Pip.CustomRadio.currentAudio);
    Pip.radioClipPlaying = true;

    Pip.removeListener('audioStopped', handleAudioStopped);
    Pip.on('audioStopped', handleAudioStopped);

    Pip.CustomRadio.drawCurrentlyPlaying();
  }

  function handleKnob1(dir) {
    if (suppressKnob1) {
      suppressKnob1 = false;
      return;
    }

    if (dir > 0 || dir < 0) {
      playingRandom = false;

      if (Pip.CustomRadio.currentAudio) {
        Pip.audioStop();
        Pip.CustomRadio.currentAudio = null;
        Pip.radioClipPlaying = false;
        bC.setColor(0).fillRect(244, 154, 400, 180);
        bC.flip();
      }
    } else {
      if (selectedFile && Pip.CustomRadio.currentAudio === selectedFile) {
        Pip.audioStop();
        Pip.CustomRadio.currentAudio = null;
        Pip.radioClipPlaying = false;
        bC.setColor(0).fillRect(244, 154, 400, 180);
        bC.flip();
      }
      Pip.CustomRadio.drawCurrentlyPlaying();
    }
  }

  function renderMenu() {
    Pip.radioClipPlaying = false;
    bC.clear(1);

    const maxPage = Math.floor((files.length - 1) / PAGE_SIZE);
    if (page < 0) page = 0;
    if (page > maxPage) page = maxPage;

    const start = page * PAGE_SIZE;
    const pageFiles = files.slice(start, start + PAGE_SIZE);
    const menu = Object.assign({}, menuHeader);

    if (page === 0) {
      menu['RANDOM'] = () => {
        playingRandom = true;
        randomQueue = files.slice().sort(() => Math.random() - 0.5);
        randomIndex = 0;
        playRandom();
      };
    }

    pageFiles.forEach((f) => {
      const name = f.replace(/\.wav$/i, '');
      const display = name.length > 19 ? name.slice(0, 16) + '...' : name;
      menu[display] = () => {
        Pip.radioClipPlaying = false;
        playingRandom = false;

        selectedFile = '/RADIO/' + f;
        suppressKnob1 = true;

        if (Pip.CustomRadio.currentAudio === selectedFile) {
          Pip.audioStop();
          Pip.CustomRadio.currentAudio = null;
          Pip.radioClipPlaying = false;
          bC.setColor(0).fillRect(244, 154, 400, 180);
          bC.flip();
        } else {
          Pip.CustomRadio.currentAudio = selectedFile;
          Pip.audioStart(Pip.CustomRadio.currentAudio);
          Pip.radioClipPlaying = true;
          Pip.CustomRadio.drawCurrentlyPlaying();
        }
      };
    });

    if (page > 0) {
      menu['< PREV'] = () => {
        page--;
        Pip.CustomRadio.stopWaveform();
        renderMenu();
        Pip.CustomRadio.startWaveform();
        Pip.CustomRadio.drawWaveformBorder();
      };
    }

    if ((page + 1) * PAGE_SIZE < files.length) {
      menu['NEXT >'] = () => {
        page++;
        Pip.CustomRadio.stopWaveform();
        renderMenu();
        Pip.CustomRadio.startWaveform();
        Pip.CustomRadio.drawWaveformBorder();
      };
    }

    E.showMenu(menu);
    Pip.CustomRadio.drawCurrentlyPlaying();

    Pip.removeListener('knob1', handleKnob1);
    Pip.on('knob1', handleKnob1);

    const previousSubmenu = Pip.removeSubmenu;
    Pip.removeSubmenu = function customRadioClose() {
      Pip.CustomRadio.stopWaveform();
      bC.clear(1);
      bC.flip();

      Pip.audioStop();
      Pip.CustomRadio.currentAudio = null;
      Pip.radioClipPlaying = false;
      playingRandom = false;

      Pip.removeListener('audioStopped', handleAudioStopped);
      Pip.removeListener('knob1', handleKnob1);

      if (Pip.removeSubmenu === customRadioClose) delete Pip.removeSubmenu;

      if (
        typeof previousSubmenu === 'function' &&
        previousSubmenu !== customRadioClose
      ) {
        previousSubmenu();
      }
    };
  }

  renderMenu();

  Pip.CustomRadio.stopWaveform();
  Pip.CustomRadio.startWaveform();
  Pip.CustomRadio.drawWaveformBorder();
}

function submenuLocalRadio() {
  if (!rd._options) rd.setupI2C();

  if (Pip.CustomRadio.currentAudio) {
    Pip.audioStop();
    Pip.CustomRadio.currentAudio = null;
    Pip.radioClipPlaying = false;
  }

  Pip.radioKPSS = false;

  Pip.CustomRadio.stopWaveform();

  bC.clear(1);

  rd.rdsTimer = setInterval(readRDSData, 100);
  if (rd.isOn()) {
    rd.getChannelInfo();
    rd.drawFreq();
  }

  Pip.CustomRadio.startWaveform();

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
        bC.drawImage(Pip.CustomRadio.waveformGfx, 245, 20);
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

  Pip.CustomRadio.drawWaveformBorder();

  const originalClose = Pip.removeSubmenu;
  Pip.removeSubmenu = function () {
    Pip.CustomRadio.stopWaveform();
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
