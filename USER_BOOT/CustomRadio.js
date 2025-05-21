Pip.Radio = { currentAudio: null, waveform: null };

if (!Pip.remove) {
  Pip.remove = function () {
    if (Pip.Radio.waveform) {
      Pip.Radio.waveform.stop();
      Pip.Radio.waveform = null;
    }
    Pip.removeAllListeners();
    if (typeof E.gc === 'function') E.gc();
  };
}

function Waveform() {
  const self = {};

  let animationAngle = 0;
  let interval = null;
  let lastDrawnSong = null;
  let waveformGfx = null;
  let waveformPoints = null;

  self.drawBorder = function () {
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

  self.drawCurrentlyPlaying = function () {
    if (Pip.Radio.currentAudio !== lastDrawnSong) {
      bC.setColor(0).fillRect(244, 154, 400, 180);
      lastDrawnSong = Pip.Radio.currentAudio;
    }

    if (Pip.Radio.currentAudio) {
      const song = Pip.Radio.currentAudio
        .split('/')
        .pop()
        .replace(/\.wav$/i, '');
      const displayName = song.length > 19 ? song.slice(0, 16) + '...' : song;
      bC.setFontMonofonto16()
        .setColor(3)
        .drawString(displayName, 244, 155)
        .flip();
    }
  };

  self.start = function () {
    animationAngle = 0;
    waveformGfx = Graphics.createArrayBuffer(120, 120, 2, {
      msb: true,
    });
    if (E.getAddressOf(waveformGfx, 0) === 0) {
      waveformGfx = undefined;
      E.defrag();
      waveformGfx = Graphics.createArrayBuffer(120, 120, 2, {
        msb: true,
      });
    }

    waveformPoints = new Uint16Array(60);
    for (let i = 0; i < 60; i += 2) waveformPoints[i] = i * 2;

    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      if (!waveformGfx) return;

      waveformGfx.clearRect(0, 0, 119, 119);

      if (Pip.radioClipPlaying) {
        Pip.getAudioWaveform(waveformPoints, 20, 100);
      } else if (Pip.radioOn && typeof RADIO_AUDIO !== 'undefined') {
        for (let i = 1; i < 60; i += 2) {
          waveformPoints[i] = E.clip(
            60 + (analogRead(RADIO_AUDIO) - 0.263) * 600,
            0,
            119,
          );
        }
      } else {
        let a = animationAngle;
        for (let i = 1; i < 60; i += 2) {
          waveformPoints[i] =
            60 + Math.sin(a) * 45 * Math.sin((a += 0.6) * 0.13);
        }
      }

      waveformGfx.drawPolyAA(waveformPoints);
      animationAngle += 0.3;
      Pip.blitImage(waveformGfx, 285, 85, {
        noScanEffect: true,
      });
    }, 50);
  };

  self.stop = function () {
    if (interval) clearInterval(interval);
    interval = null;
    lastDrawnSong = null;
    waveformPoints = null;
    if (waveformGfx) {
      waveformGfx = null;
      E.defrag();
    }
  };

  return self;
}

function CustomMenu() {
  const self = {};

  if (!Pip.Radio.waveform) {
    Pip.Radio.waveform = Waveform();
  }

  let btnPlayInterval = null;
  let btnPlayPressed = false;
  let frontButtonToggledOn = false;
  let page = null;
  let pageSize = 5;
  let playingRandom = false;
  let previousKnob1Click = null;
  let randomIndex = null;
  let randomQueue = null;
  let selectedFile = null;
  let supressLeftKnob = false;

  function handleAudioStoppedEvent(files) {
    if (playingRandom) {
      playRandom(files);
    }
  }

  function handleLeftKnobEvent(dir) {
    if (supressLeftKnob) {
      supressLeftKnob = false;
      return;
    }

    if (dir !== 0) {
    } else {
      if (selectedFile && Pip.Radio.currentAudio === selectedFile) {
        playingRandom = false;
        Pip.audioStop();
        Pip.Radio.currentAudio = null;
        Pip.radioClipPlaying = false;
        bC.setColor(0).fillRect(244, 154, 400, 180);
        bC.flip();
      }

      if (Pip.Radio.waveform) {
        Pip.Radio.waveform.drawCurrentlyPlaying();
      }
    }
  }

  function handlePlayButtonEvent(files) {
    if (btnPlayInterval) {
      clearInterval(btnPlayInterval);
      btnPlayInterval = null;
    }

    btnPlayInterval = setInterval(() => {
      const isPressed = BTN_PLAY.read();

      if (!btnPlayPressed && isPressed) {
        if (rd.isOn()) rd.enable(false);
        Pip.radioKPSS = false;
        Pip.radioClipPlaying = false;
        Pip.audioStop();
        selectedFile = null;
        Pip.Radio.currentAudio = null;
        Pip.radioClipPlaying = false;

        if (frontButtonToggledOn) {
          stopAllSounds();
          playingRandom = false;
          randomQueue = [];
          randomIndex = 0;
          Pip.fadeOff([LED_TUNING], Math.pow(2, Pip.brightness / 2) / 1024);
          frontButtonToggledOn = false;
        } else {
          playingRandom = true;
          randomQueue = files.slice().sort(() => Math.random() - 0.5);
          randomIndex = 0;
          playRandom(files);
          Pip.fadeOn([LED_TUNING], Math.pow(2, Pip.brightness / 2) / 1024);
          frontButtonToggledOn = true;
        }
      }

      btnPlayPressed = isPressed;
    }, 100);
  }

  function onFileSelect(file) {
    Pip.radioClipPlaying = false;
    playingRandom = false;

    selectedFile = '/RADIO/' + file;
    supressLeftKnob = true;

    if (Pip.Radio.currentAudio === selectedFile) {
      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
      bC.setColor(0).fillRect(244, 154, 400, 180);
      bC.flip();
    } else {
      Pip.Radio.currentAudio = selectedFile;
      Pip.audioStart(Pip.Radio.currentAudio);
      Pip.radioClipPlaying = true;

      if (Pip.Radio.waveform) {
        Pip.Radio.waveform.drawCurrentlyPlaying();
      }
    }
  }

  function noop() {}

  function playRandom(files) {
    if (randomIndex >= randomQueue.length) {
      randomQueue = files.slice().sort(() => Math.random() - 0.5);
      randomIndex = 0;
    }

    if (Pip.Radio.currentAudio) {
      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
    }

    const f = randomQueue[randomIndex++];
    Pip.Radio.currentAudio = '/RADIO/' + f;
    Pip.audioStart(Pip.Radio.currentAudio);
    Pip.radioClipPlaying = true;

    Pip.removeListener('audioStopped', handleAudioStoppedEvent);
    Pip.on('audioStopped', handleAudioStoppedEvent);

    if (Pip.Radio.waveform) {
      Pip.Radio.waveform.drawCurrentlyPlaying();
    }
  }

  function renderMenu(files) {
    Pip.radioClipPlaying = false;
    bC.clear(1);

    const maxPage = Math.floor((files.length - 1) / pageSize);
    if (page < 0) page = 0;
    if (page > maxPage) page = maxPage;

    const start = page * pageSize;
    const pageFiles = files.slice(start, start + pageSize);

    // Create a 200x200 pixel area for the file list
    const menu = Object.assign({}, { '': { x2: 200 } });

    if (page === 0) {
      menu['RANDOM'] = () => {
        playingRandom = true;
        randomQueue = files.slice().sort(() => Math.random() - 0.5);
        randomIndex = 0;
        playRandom(files);
      };
    }

    pageFiles.forEach((file) => {
      const name = file.replace(/\.wav$/i, '');
      const display = name.length > 19 ? name.slice(0, 16) + '...' : name;
      // Set menu item callbacks, on click/select
      menu[display] = () => onFileSelect(file);
    });

    if (page > 0) {
      menu['< PREV'] = () => {
        supressLeftKnob = true;
        page--;
        if (Pip.Radio.waveform) {
          Pip.Radio.waveform.stop();
          Pip.Radio.waveform = null;
        }
        renderMenu(files);
        Pip.Radio.waveform = Waveform();
        if (Pip.Radio.waveform) {
          Pip.Radio.waveform.start();
          Pip.Radio.waveform.drawBorder();
        }
      };
    }

    if ((page + 1) * pageSize < files.length) {
      menu['NEXT >'] = () => {
        supressLeftKnob = true;
        page++;
        if (Pip.Radio.waveform) {
          Pip.Radio.waveform.stop();
          Pip.Radio.waveform = null;
        }
        renderMenu(files);
        Pip.Radio.waveform = Waveform();
        if (Pip.Radio.waveform) {
          Pip.Radio.waveform.start();
          Pip.Radio.waveform.drawBorder();
        }
      };
    }

    E.showMenu(menu);

    if (Pip.Radio.waveform) {
      Pip.Radio.waveform.drawCurrentlyPlaying();
    }

    handlePlayButtonEvent(files);

    Pip.removeListener('knob1', handleLeftKnobEvent);
    Pip.on('knob1', handleLeftKnobEvent);
    Pip.knob1Click = noop;

    Pip.removeListener('audioStopped', handleAudioStoppedEvent);
    if (playingRandom) {
      Pip.on('audioStopped', handleAudioStoppedEvent);
    }

    const previousSubmenu = Pip.removeSubmenu;
    Pip.removeSubmenu = function customRadioClose() {
      if (LED_TUNING.read()) {
        // Turn off the LED if it was on
        LED_TUNING.write(0);
      }

      if (Pip.Radio.waveform) {
        Pip.Radio.waveform.stop();
        Pip.Radio.waveform = null;
      }
      bC.clear(1);
      bC.flip();

      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
      playingRandom = false;

      Pip.removeListener('audioStopped', handleAudioStoppedEvent);
      Pip.removeListener('knob1', handleLeftKnobEvent);

      if (btnPlayInterval) {
        clearInterval(btnPlayInterval);
        btnPlayInterval = null;
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

      Pip.knob1Click = previousKnob1Click;
    };
  }

  function stopAllSounds() {
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
  }

  self.run = function () {
    if (!rd._options) rd.setupI2C();

    stopAllSounds();

    bC.clear(1);

    previousKnob1Click = Pip.knob1Click;
    // Prevent default knob1Click reset
    Pip.knob1Click = noop;

    let files = [];
    try {
      files = fs
        .readdir('/RADIO')
        .filter((f) => f.endsWith('.wav'))
        .sort();
      print('Files loaded from "/radio":', files.length);
    } catch (e) {
      print('Failed to load radio files:', e);
      files = [];
    }

    page = 0;
    randomQueue = [];
    randomIndex = 0;

    renderMenu(files);
    if (Pip.Radio.waveform) {
      Pip.Radio.waveform.stop();
      Pip.Radio.waveform = null;
    }
    Pip.Radio.waveform = Waveform();
    Pip.Radio.waveform.start();
    Pip.Radio.waveform.drawBorder();

    handlePlayButtonEvent(files);
  };

  return self;
}

function DefaultRadioExtended() {
  const self = {};

  if (!Pip.Radio.waveform) {
    Pip.Radio.waveform = Waveform();
  }

  function stopAllSounds() {
    if (Pip.Radio.currentAudio) {
      Pip.audioStop();
      Pip.Radio.currentAudio = null;
      Pip.radioClipPlaying = false;
      Pip.radioKPSS = false;
    }
  }

  self.run = function () {
    stopAllSounds();
    if (Pip.Radio.waveform) {
      Pip.Radio.waveform.stop();
      Pip.Radio.waveform = null;
    }
    bC.clear(1);
    submenuRadio();
  };

  return self;
}

function CustomRadioBootloader() {
  const self = {};

  const APP_NAME = 'Custom Radio Bootloader';
  const GAME_VERSION = '2.5.0';

  self.run = function () {
    let options;
    try {
      const path = 'USER/CustomRadio/options.json';
      const raw = fs.readFileSync(path);
      options = JSON.parse(raw);
    } catch (err) {
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
        LOCAL: DefaultRadioExtended().run,
        CUSTOM: CustomMenu().run,
      };
    }

    delete options;
  };

  return self;
}

CustomRadioBootloader().run();
