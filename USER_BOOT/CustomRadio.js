// =============================================================================
//  Name: Custom Radio Bootloader
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Custom Radio overrides and functions for the Pip-Boy 3000 Mk V.
//  Version: 2.3.0
// =============================================================================

const DEBUG = false;

function debug() {
  if (!DEBUG) return;
  print.apply(null, arguments);
}

Pip.Radio = {
  currentAudio: null,
  waveformGfx: null,
};

Pip.Radio.Waveform = {
  animationAngle: 0,
  interval: null,
  lastDrawnSong: null,
  waveformPoints: null,
  drawBorder: function () {
    debug('[drawBorder] Drawing waveform border');
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
    if (Pip.Radio.currentAudio !== Pip.Radio.Waveform.lastDrawnSong) {
      debug('[drawCurrentlyPlaying] Song changed, clearing song display');
      bC.setColor(0).fillRect(244, 154, 400, 180);
      Pip.Radio.Waveform.lastDrawnSong = Pip.Radio.currentAudio;
    }

    if (Pip.Radio.currentAudio) {
      const song = Pip.Radio.currentAudio
        .split('/')
        .pop()
        .replace(/\.wav$/i, '');
      const displayName = song.length > 19 ? song.slice(0, 16) + '...' : song;
      debug(
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
    debug('[start] Starting waveform');

    Pip.Radio.Waveform.animationAngle = 0;
    Pip.Radio.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, {
      msb: true,
    });
    if (E.getAddressOf(Pip.Radio.waveformGfx, 0) === 0) {
      debug('[start] Waveform defragging');
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
    debug('[stop] Stopping waveform');

    if (Pip.Radio.Waveform.interval) clearInterval(Pip.Radio.Waveform.interval);
    Pip.Radio.Waveform.interval = null;
    if (Pip.Radio.waveformGfx) {
      Pip.Radio.waveformGfx = null;
      E.defrag();
    }
  },
};

Pip.Radio.Custom = {
  btnPlayInterval: null,
  btnPlayPressed: false,
  frontButtonToggledOn: false,
  page: null,
  pageSize: 5,
  playingRandom: false,
  previousKnob1Click: null,
  randomIndex: null,
  randomQueue: null,
  selectedFile: null,
  supressLeftKnob: false,
  handleAudioStoppedEvent: function (files) {
    debug('[handleAudioStoppedEvent] Audio stop event triggered');
    if (Pip.Radio.Custom.playingRandom) {
      debug('[handleAudioStoppedEvent] Playing next random song');
      Pip.Radio.Custom.playRandom(files);
    }
  },
  handleLeftKnobEvent: function (dir) {
    if (Pip.Radio.Custom.supressLeftKnob) {
      debug(
        '[handleLeftKnobEvent] Suppressing left knob event, handled in menu callback',
      );
      Pip.Radio.Custom.supressLeftKnob = false;
      return;
    }

    if (dir !== 0) {
      debug('[handleLeftKnobEvent] Scrolling', dir > 0 ? 'up' : 'down');
    } else {
      if (
        Pip.Radio.Custom.selectedFile &&
        Pip.Radio.currentAudio === Pip.Radio.Custom.selectedFile
      ) {
        debug(
          '[handleLeftKnobEvent] Selected audio is already playing, stopping it',
        );
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
  handlePlayButtonEvent: function (files) {
    if (Pip.Radio.Custom.btnPlayInterval) {
      clearInterval(Pip.Radio.Custom.btnPlayInterval);
      Pip.Radio.Custom.btnPlayInterval = null;
    }

    Pip.Radio.Custom.btnPlayInterval = setInterval(() => {
      const isPressed = BTN_PLAY.read();

      if (!Pip.Radio.Custom.btnPlayPressed && isPressed) {
        if (rd.isOn()) rd.enable(false);
        Pip.radioKPSS = false;
        Pip.radioClipPlaying = false;
        Pip.audioStop();
        Pip.Radio.Custom.selectedFile = null;
        Pip.Radio.currentAudio = null;
        Pip.radioClipPlaying = false;

        if (Pip.Radio.Custom.frontButtonToggledOn) {
          debug('[BTN_PLAY] Stopping all sounds');
          Pip.Radio.Custom.stopAllSounds();
          Pip.Radio.Custom.playingRandom = false;
          Pip.Radio.Custom.randomQueue = [];
          Pip.Radio.Custom.randomIndex = 0;
          Pip.fadeOff([LED_TUNING], Math.pow(2, Pip.brightness / 2) / 1024);
          Pip.Radio.Custom.frontButtonToggledOn = false;
        } else {
          debug('[BTN_PLAY] Starting random song');
          Pip.Radio.Custom.playingRandom = true;
          Pip.Radio.Custom.randomQueue = files
            .slice()
            .sort(() => Math.random() - 0.5);
          Pip.Radio.Custom.randomIndex = 0;
          Pip.Radio.Custom.playRandom(files);
          Pip.fadeOn([LED_TUNING], Math.pow(2, Pip.brightness / 2) / 1024);
          Pip.Radio.Custom.frontButtonToggledOn = true;
        }
      }

      Pip.Radio.Custom.btnPlayPressed = isPressed;
    }, 100);
  },
  init: function () {
    debug('[init] Initializing custom radio');

    let options;
    try {
      const path = 'USER/CustomRadio/options.json';
      const raw = fs.readFileSync(path);
      options = JSON.parse(raw);
      debug('[init] Options loaded from', path);
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

      // Add default radio + new custom radio options
      radioTab.submenu = {
        LOCAL: Pip.Radio.Default.Extended.menu,
        CUSTOM: Pip.Radio.Custom.menu,
      };
    }

    delete options;
    debug('[init] Custom radio initialized');
  },
  menu: function () {
    debug('[menu] Custom radio menu triggered');

    if (!rd._options) rd.setupI2C();

    Pip.Radio.Custom.stopAllSounds();

    bC.clear(1);

    Pip.Radio.Custom.previousKnob1Click = Pip.knob1Click;
    // Prevent default knob1Click reset
    Pip.knob1Click = Pip.Radio.Custom.noop;

    let files = [];
    try {
      files = require('fs')
        .readdir('/RADIO')
        .filter((f) => f.endsWith('.wav'))
        .sort();
      debug('[menu] Files loaded from "/radio":', files.length);
    } catch (e) {
      print('Failed to load radio files:', e);
      files = [];
    }

    Pip.Radio.Custom.page = 0;
    Pip.Radio.Custom.randomQueue = [];
    Pip.Radio.Custom.randomIndex = 0;

    Pip.Radio.Custom.renderMenu(files);
    Pip.Radio.Waveform.stop();
    Pip.Radio.Waveform.start();
    Pip.Radio.Waveform.drawBorder();

    Pip.Radio.Custom.handlePlayButtonEvent(files);

    debug('[menu] Custom radio menu rendered');
  },
  onFileSelect: function (file) {
    debug('[renderMenu] Menu item callback, playing file:', file);

    Pip.radioClipPlaying = false;
    Pip.Radio.Custom.playingRandom = false;

    Pip.Radio.Custom.selectedFile = '/RADIO/' + file;
    Pip.Radio.Custom.supressLeftKnob = true;

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
  },
  noop: function () {},
  playRandom: function (files) {
    debug('[playRandom] Playing random song');

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

    Pip.removeListener(
      'audioStopped',
      Pip.Radio.Custom.handleAudioStoppedEvent,
    );
    Pip.on('audioStopped', Pip.Radio.Custom.handleAudioStoppedEvent);

    Pip.Radio.Waveform.drawCurrentlyPlaying();
  },
  renderMenu: function (files) {
    debug('[renderMenu] Rendering menu');

    Pip.radioClipPlaying = false;
    bC.clear(1);

    const maxPage = Math.floor((files.length - 1) / Pip.Radio.Custom.pageSize);
    if (Pip.Radio.Custom.page < 0) Pip.Radio.Custom.page = 0;
    if (Pip.Radio.Custom.page > maxPage) Pip.Radio.Custom.page = maxPage;

    const start = Pip.Radio.Custom.page * Pip.Radio.Custom.pageSize;
    const pageFiles = files.slice(start, start + Pip.Radio.Custom.pageSize);

    // Create a 200x200 pixel area for the file list
    const menu = Object.assign({}, { '': { x2: 200 } });

    if (Pip.Radio.Custom.page === 0) {
      debug('[renderMenu] Adding "RANDOM" option to file list');
      menu['RANDOM'] = () => {
        Pip.Radio.Custom.playingRandom = true;
        Pip.Radio.Custom.randomQueue = files
          .slice()
          .sort(() => Math.random() - 0.5);
        Pip.Radio.Custom.randomIndex = 0;
        Pip.Radio.Custom.playRandom(files);
      };
    }

    pageFiles.forEach((file) => {
      const name = file.replace(/\.wav$/i, '');
      const display = name.length > 19 ? name.slice(0, 16) + '...' : name;
      // Set menu item callbacks, on click/select
      menu[display] = () => Pip.Radio.Custom.onFileSelect(file);
    });

    if (Pip.Radio.Custom.page > 0) {
      debug('[renderMenu] Adding "PREV" option & callback');
      menu['< PREV'] = () => {
        Pip.Radio.Custom.supressLeftKnob = true;
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
      debug('[renderMenu] Adding "NEXT" option & callback');
      menu['NEXT >'] = () => {
        Pip.Radio.Custom.supressLeftKnob = true;
        Pip.Radio.Custom.page++;
        Pip.Radio.Waveform.stop();
        Pip.Radio.Custom.renderMenu(files);
        Pip.Radio.Waveform.start();
        Pip.Radio.Waveform.drawBorder();
      };
    }

    E.showMenu(menu);

    Pip.Radio.Waveform.drawCurrentlyPlaying();

    Pip.Radio.Custom.handlePlayButtonEvent(files);

    Pip.removeListener('knob1', Pip.Radio.Custom.handleLeftKnobEvent);
    Pip.on('knob1', Pip.Radio.Custom.handleLeftKnobEvent);
    Pip.knob1Click = Pip.Radio.Custom.noop;

    Pip.removeListener(
      'audioStopped',
      Pip.Radio.Custom.handleAudioStoppedEvent,
    );
    if (Pip.Radio.Custom.playingRandom) {
      Pip.on('audioStopped', Pip.Radio.Custom.handleAudioStoppedEvent);
    }

    const previousSubmenu = Pip.removeSubmenu;
    Pip.removeSubmenu = function customRadioClose() {
      debug('[customRadioClose] Closing custom radio menu');

      if (LED_TUNING.read()) {
        // Turn off the LED if it was on
        LED_TUNING.write(0);
      }

      Pip.Radio.Waveform.stop();
      bC.clear(1);
      bC.flip();

      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
      Pip.Radio.Custom.playingRandom = false;

      Pip.removeListener(
        'audioStopped',
        Pip.Radio.Custom.handleAudioStoppedEvent,
      );
      Pip.removeListener('knob1', Pip.Radio.Custom.handleLeftKnobEvent);

      if (Pip.Radio.Custom.btnPlayInterval) {
        clearInterval(Pip.Radio.Custom.btnPlayInterval);
        Pip.Radio.Custom.btnPlayInterval = null;
      }

      if (Pip.removeSubmenu === customRadioClose) {
        delete Pip.removeSubmenu;
      }

      if (
        typeof previousSubmenu === 'function' &&
        previousSubmenu !== customRadioClose
      ) {
        previousSubmenu();
      }

      Pip.knob1Click = Pip.Radio.Custom.previousKnob1Click;
    };
  },
  stopAllSounds: function () {
    debug('[stopAllSounds] Stopping all sounds');
    Pip.audioStop();
    Pip.Radio.currentAudio = null;
    Pip.radioClipPlaying = false;
    if (rd.isOn()) {
      rd.enable(false);
    }
    Pip.radioKPSS = false;
    Pip.radioClipPlaying = false;
    // Clear the currently playing song displayed
    bC.setColor(0).fillRect(244, 154, 400, 180);
    bC.flip();
  },
};

Pip.Radio.Default = {
  menu: submenuRadio,
};

Pip.Radio.Default.Extended = {
  menu: function () {
    Pip.Radio.Default.Extended.stopAllSounds();
    Pip.Radio.Waveform.stop();
    bC.clear(1);
    Pip.Radio.Default.menu();
  },
  stopAllSounds: function () {
    if (Pip.Radio.currentAudio) {
      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
      Pip.radioKPSS = false;
    }
  },
};

Pip.Radio.Custom.init();
