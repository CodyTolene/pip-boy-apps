// =============================================================================
//  Name: Custom Radio Bootloader
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Custom Radio overrides and functions for the Pip-Boy 3000 Mk V.
//  Version: 2.3.0
// =============================================================================

const DEBUG = false;

Pip.Radio = {
  currentAudio: null,
  lastDrawnSong: null,
  waveformGfx: null,
};

Pip.Radio.Waveform = {
  animationAngle: 0,
  interval: null,
  waveformPoints: null,
  drawBorder: function () {
    if (DEBUG) print('[drawBorder] Drawing waveform border');
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
    if (Pip.Radio.currentAudio !== Pip.Radio.lastDrawnSong) {
      if (DEBUG)
        print('[drawCurrentlyPlaying] Song changed, clearing song display');
      bC.setColor(0).fillRect(244, 154, 400, 180);
      Pip.Radio.lastDrawnSong = Pip.Radio.currentAudio;
    }

    if (Pip.Radio.currentAudio) {
      const song = Pip.Radio.currentAudio
        .split('/')
        .pop()
        .replace(/\.wav$/i, '');
      const displayName = song.length > 19 ? song.slice(0, 16) + '...' : song;
      if (DEBUG)
        print(
          '[drawCurrentlyPlaying] Drawing currently playing song:',
          displayName,
        );
      bC.setFontMonofonto16()
        .setColor(3)
        .drawString(displayName, 244, 155)
        .flip();
    }
  },
  start: function () {
    if (DEBUG) print('[start] Starting waveform');

    Pip.Radio.Waveform.animationAngle = 0;
    Pip.Radio.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, {
      msb: true,
    });
    if (E.getAddressOf(Pip.Radio.waveformGfx, 0) === 0) {
      Pip.Radio.waveformGfx = undefined;
      E.defrag();
      Pip.Radio.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, {
        msb: true,
      });
    }

    Pip.Radio.Waveform.waveformPoints = new Uint16Array(60);
    for (let i = 0; i < 60; i += 2)
      Pip.Radio.Waveform.waveformPoints[i] = i * 2;

    Pip.Radio.Waveform.interval = setInterval(() => {
      if (!Pip.Radio.waveformGfx) return;

      Pip.Radio.waveformGfx.clearRect(0, 0, 119, 119);

      if (Pip.radioClipPlaying) {
        Pip.getAudioWaveform(Pip.Radio.Waveform.waveformPoints, 20, 100);
      } else if (Pip.radioOn && typeof RADIO_AUDIO !== 'undefined') {
        for (let i = 1; i < 60; i += 2) {
          Pip.Radio.Waveform.waveformPoints[i] = E.clip(
            60 + (analogRead(RADIO_AUDIO) - 0.263) * 600,
            0,
            119,
          );
        }
      } else {
        let a = Pip.Radio.Waveform.animationAngle;
        for (let i = 1; i < 60; i += 2) {
          Pip.Radio.Waveform.waveformPoints[i] =
            60 + Math.sin(a) * 45 * Math.sin((a += 0.6) * 0.13);
        }
      }

      Pip.Radio.waveformGfx.drawPolyAA(Pip.Radio.Waveform.waveformPoints);
      Pip.Radio.Waveform.animationAngle += 0.3;
      Pip.blitImage(Pip.Radio.waveformGfx, 285, 85, {
        noScanEffect: true,
      });
    }, 50);
  },
  stop: function () {
    if (DEBUG) print('[stop] Stopping waveform');

    if (Pip.Radio.Waveform.interval) clearInterval(Pip.Radio.Waveform.interval);
    Pip.Radio.Waveform.interval = null;
    if (Pip.Radio.waveformGfx) {
      Pip.Radio.waveformGfx = null;
      E.defrag();
    }
  },
};

Pip.Radio.Custom = {
  page: null,
  pageSize: 5,
  playingRandom: false,
  previousKnob1Click: null,
  randomIndex: null,
  randomQueue: null,
  selectedFile: null,
  suppressKnob1: false,
  customKnob1Click: function (val) {
    if (DEBUG) print('[customKnob1Click] Custom knob1 click:', val);
  },
  handleAudioStopped: function (files) {
    if (DEBUG) print('[handleAudioStopped] Audio stop event triggered');
    if (Pip.Radio.Custom.playingRandom) {
      if (DEBUG) print('[handleAudioStopped] Playing next random song');
      Pip.Radio.Custom.playRandom(files);
    }
  },
  handleKnob1: function (dir) {
    if (DEBUG) print('[handleKnob1] Knob1 event triggered:', dir);

    if (Pip.Radio.Custom.suppressKnob1) {
      if (DEBUG) print('[handleKnob1] Suppressing knob1 event');
      Pip.Radio.Custom.suppressKnob1 = false;
      return;
    }

    if (dir !== 0) {
      if (DEBUG) print('[handleKnob1] Scrolling', dir > 0 ? 'up' : 'down');
      if (Pip.knob1Click !== Pip.Radio.Custom.customKnob1Click) {
        if (DEBUG) print('[handleKnob1] Overriding default knob1 click');
        Pip.knob1Click = Pip.Radio.Custom.customKnob1Click;
      }
    } else {
      if (
        Pip.Radio.Custom.selectedFile &&
        Pip.Radio.currentAudio === Pip.Radio.Custom.selectedFile
      ) {
        if (DEBUG) {
          print('[handleKnob1] Selected audio is already playing, stopping it');
        }

        Pip.Radio.Custom.playingRandom = false;
        Pip.audioStop();
        Pip.Radio.currentAudio = null;
        Pip.radioClipPlaying = false;
        bC.setColor(0).fillRect(244, 154, 400, 180);
        bC.flip();
      }
      Pip.Radio.Waveform.drawCurrentlyPlaying();
    }
  },
  init: function () {
    if (DEBUG) print('[init] Initializing custom radio');

    let options;
    try {
      const path = 'USER/CustomRadio/options.json';
      const raw = fs.readFileSync(path);
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
      const radioTab = MODEINFO[MODE.RADIO];
      if (radioTab.fn) delete radioTab.fn;

      radioTab.submenu = {
        LOCAL: Pip.Radio.Default.Extended.menu,
        CUSTOM: Pip.Radio.Custom.menu,
      };
    }

    delete options;
    if (DEBUG) print('[init] Custom radio initialized');
  },
  menu: function () {
    if (DEBUG) print('[menu] Custom radio menu triggered');

    if (!rd._options) rd.setupI2C();

    if (Pip.Radio.currentAudio) {
      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
    }

    Pip.radioKPSS = false;
    if (rd.isOn()) rd.enable(false);
    Pip.radioClipPlaying = false;

    bC.clear(1);

    Pip.Radio.Custom.previousKnob1Click = Pip.knob1Click;
    Pip.knob1Click = Pip.Radio.Custom.customKnob1Click;

    let files = [];
    try {
      files = require('fs')
        .readdir('/RADIO')
        .filter((f) => f.endsWith('.wav'))
        .sort();
      if (DEBUG) print('[menu] Files loaded from "/radio":', files.length);
    } catch (e) {
      print('Failed to load radio files:', e);
      files = [];
    }

    Pip.Radio.Custom.page = 0;
    Pip.Radio.Custom.randomQueue = [];
    Pip.Radio.Custom.randomIndex = 0;

    const menuHeader = {
      '': {
        x2: 200,
        predraw: () => {
          if (Pip.Radio.Waveform.waveformGfx) {
            if (DEBUG) print('[menuHeader] Predrawing waveform graphics');
            bC.drawImage(Pip.Radio.Waveform.waveformGfx, 245, 20);
          }
        },
      },
    };

    Pip.Radio.Custom.renderMenu(files);
    Pip.Radio.Waveform.stop();
    Pip.Radio.Waveform.start();
    Pip.Radio.Waveform.drawBorder();

    if (DEBUG) print('[menu] Custom radio menu rendered');
  },
  playRandom: function (files) {
    if (DEBUG) print('[playRandom] Playing random song');

    if (Pip.Radio.Custom.randomIndex >= Pip.Radio.Custom.randomQueue.length) {
      Pip.Radio.Custom.randomQueue = files
        .slice()
        .sort(() => Math.random() - 0.5);
      Pip.Radio.Custom.randomIndex = 0;
    }

    if (Pip.Radio.currentAudio) {
      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
    }

    const f = Pip.Radio.Custom.randomQueue[Pip.Radio.Custom.randomIndex++];
    Pip.Radio.currentAudio = '/RADIO/' + f;
    Pip.audioStart(Pip.Radio.currentAudio);
    Pip.radioClipPlaying = true;

    Pip.removeListener('audioStopped', Pip.Radio.Custom.handleAudioStopped);
    Pip.on('audioStopped', Pip.Radio.Custom.handleAudioStopped);

    Pip.Radio.Waveform.drawCurrentlyPlaying();
  },
  renderMenu: function (files) {
    if (DEBUG) print('[renderMenu] Rendering menu with files:', files.length);

    Pip.radioClipPlaying = false;
    bC.clear(1);

    const maxPage = Math.floor((files.length - 1) / Pip.Radio.Custom.pageSize);
    if (Pip.Radio.Custom.page < 0) Pip.Radio.Custom.page = 0;
    if (Pip.Radio.Custom.page > maxPage) Pip.Radio.Custom.page = maxPage;

    const start = Pip.Radio.Custom.page * Pip.Radio.Custom.pageSize;
    const pageFiles = files.slice(start, start + Pip.Radio.Custom.pageSize);
    const menu = Object.assign(
      {},
      {
        '': {
          x2: 200,
          predraw: () => {
            if (Pip.Radio.Waveform.waveformGfx) {
              if (DEBUG) print('[renderMenu] Predrawing waveform graphics');
              bC.drawImage(Pip.Radio.Waveform.waveformGfx, 245, 20);
            }
          },
        },
      },
    );

    if (Pip.Radio.Custom.page === 0) {
      if (DEBUG) print('[renderMenu] Adding "RANDOM" option');
      menu['RANDOM'] = () => {
        Pip.Radio.Custom.playingRandom = true;
        Pip.Radio.Custom.randomQueue = files
          .slice()
          .sort(() => Math.random() - 0.5);
        Pip.Radio.Custom.randomIndex = 0;
        Pip.Radio.Custom.playRandom(files);
      };
    }

    pageFiles.forEach((f) => {
      const name = f.replace(/\.wav$/i, '');
      const display = name.length > 19 ? name.slice(0, 16) + '...' : name;
      menu[display] = () => {
        if (DEBUG) print('[renderMenu] Menu item callback, playing file:', f);

        Pip.radioClipPlaying = false;
        Pip.Radio.Custom.playingRandom = false;

        Pip.Radio.Custom.selectedFile = '/RADIO/' + f;
        Pip.Radio.Custom.suppressKnob1 = true;

        if (Pip.Radio.currentAudio === Pip.Radio.Custom.selectedFile) {
          Pip.audioStop();
          Pip.Radio.currentAudio = null;
          Pip.radioClipPlaying = false;
          bC.setColor(0).fillRect(244, 154, 400, 180);
          bC.flip();
        } else {
          Pip.Radio.currentAudio = Pip.Radio.Custom.selectedFile;
          Pip.audioStart(Pip.Radio.currentAudio);
          Pip.radioClipPlaying = true;
          Pip.Radio.Waveform.drawCurrentlyPlaying();
        }
      };
    });

    if (Pip.Radio.Custom.page > 0) {
      if (DEBUG) print('[renderMenu] Adding "PREV" option & callback');
      menu['< PREV'] = () => {
        Pip.Radio.Custom.page--;
        Pip.Radio.Waveform.stop();
        Pip.Radio.Custom.renderMenu(files);
        Pip.Radio.Waveform.start();
        Pip.Radio.Waveform.drawBorder();
      };
    }

    if (
      (Pip.Radio.Custom.page + 1) * Pip.Radio.Custom.pageSize <
      files.length
    ) {
      if (DEBUG) print('[renderMenu] Adding "NEXT" option & callback');
      menu['NEXT >'] = () => {
        Pip.Radio.Custom.page++;
        Pip.Radio.Waveform.stop();
        Pip.Radio.Custom.renderMenu(files);
        Pip.Radio.Waveform.start();
        Pip.Radio.Waveform.drawBorder();
      };
    }

    E.showMenu(menu);
    Pip.Radio.Waveform.drawCurrentlyPlaying();

    Pip.removeListener('knob1', Pip.Radio.Custom.handleKnob1);
    Pip.on('knob1', Pip.Radio.Custom.handleKnob1);

    Pip.removeListener('audioStopped', Pip.Radio.Custom.handleAudioStopped);
    if (Pip.Radio.Custom.playingRandom) {
      Pip.on('audioStopped', Pip.Radio.Custom.handleAudioStopped);
    }

    if (Pip.knob1Click !== Pip.Radio.Custom.customKnob1Click) {
      Pip.knob1Click = Pip.Radio.Custom.customKnob1Click;
    }

    const previousSubmenu = Pip.removeSubmenu;
    Pip.removeSubmenu = function customRadioClose() {
      if (DEBUG) print('[customRadioClose] Closing custom radio menu');

      Pip.Radio.Waveform.stop();
      bC.clear(1);
      bC.flip();

      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
      Pip.Radio.Custom.playingRandom = false;

      Pip.removeListener('audioStopped', Pip.Radio.Custom.handleAudioStopped);
      Pip.removeListener('knob1', Pip.Radio.Custom.handleKnob1);

      if (Pip.removeSubmenu === customRadioClose) delete Pip.removeSubmenu;

      if (
        typeof previousSubmenu === 'function' &&
        previousSubmenu !== customRadioClose
      ) {
        previousSubmenu();
      }

      Pip.knob1Click = Pip.Radio.Custom.previousKnob1Click;
    };
  },
};

Pip.Radio.Default = {
  menu: submenuRadio,
};

Pip.Radio.Default.Extended = {
  menu: function () {
    if (Pip.Radio.currentAudio) {
      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
    }

    Pip.radioKPSS = false;
    Pip.Radio.Waveform.stop();
    bC.clear(1);

    Pip.Radio.Default.menu();
  },
};

Pip.Radio.Custom.init();
