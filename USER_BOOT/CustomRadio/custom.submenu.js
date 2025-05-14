// ============================================================================
//  Name: Custom Radio Waveform
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A custom radio submenu for the Pip-Boy 3000 Mk V.
// ============================================================================

global.CustomSubmenu = class CustomSubmenu {
  constructor(waveform) {
    this.page = 0;
    this.pageSize = 5;
    this.playingRandom = false;
    this.randomIndex = 0;
    this.randomQueue = [];
    this.selectedFile = null;
    this.suppressKnob1 = false;
    this.waveform = waveform;

    try {
      this.files = fs
        .readdir('/RADIO')
        .filter(function (f) {
          return f.endsWith('.wav');
        })
        .sort();
    } catch (e) {
      this.files = [];
    }
  }

  handleAudioStopped() {
    if (this.playingRandom) {
      this.playRandom();
    }
  }

  playRandom() {
    if (this.randomIndex >= this.randomQueue.length) {
      this.randomQueue = this.files.slice().sort(function () {
        return Math.random() - 0.5;
      });
      this.randomIndex = 0;
    }

    const f = this.randomQueue[this.randomIndex++];
    const path = '/RADIO/' + f;

    Pip.audioStart(path);
    Pip.radioClipPlaying = true;
    Pip.currentAudio = path;
    this.selectedFile = path;

    this.drawCurrentlyPlaying(path);
  }

  drawCurrentlyPlaying(filePath) {
    bC.setColor(0).fillRect(244, 154, 400, 180);

    if (!filePath) {
      return;
    }

    const song = filePath
      .split('/')
      .pop()
      .replace(/\.wav$/i, '');
    const displayName = song.length > 19 ? song.slice(0, 16) + '...' : song;

    bC.setFontMonofonto16()
      .setColor(3)
      .drawString(displayName, 244, 155)
      .flip();
  }

  handleKnob1(dir) {
    if (this.suppressKnob1) {
      this.suppressKnob1 = false;
      return;
    }

    if (dir !== 0) {
      this.playingRandom = false;
      Pip.audioStop();
      Pip.radioClipPlaying = false;
      Pip.currentAudio = null;
      this.selectedFile = null;
      this.drawCurrentlyPlaying();
    } else {
      this.drawCurrentlyPlaying(Pip.currentAudio);
    }
  }

  renderMenu() {
    const maxPage = Math.floor((this.files.length - 1) / this.pageSize);
    this.page = E.clip(this.page, 0, maxPage);

    const start = this.page * this.pageSize;
    const pageFiles = this.files.slice(start, start + this.pageSize);

    const menu = {
      '': {
        x2: 200,
        predraw: () => {
          const gfx = this.waveform.gfx;
          if (gfx) {
            bC.drawImage(gfx, 245, 20);
          }
        },
      },
    };

    if (this.page === 0) {
      menu['RANDOM'] = () => {
        this.playingRandom = true;
        this.randomQueue = this.files.slice().sort(() => Math.random() - 0.5);
        this.randomIndex = 0;
        this.playRandom();
      };
    }

    pageFiles.forEach((f) => {
      const name = f.replace(/\.wav$/i, '');
      const display = name.length > 19 ? name.slice(0, 16) + '...' : name;

      menu[display] = () => {
        this.playingRandom = false;
        const path = '/RADIO/' + f;
        this.selectedFile = path;
        this.suppressKnob1 = true;

        if (Pip.radioClipPlaying && path === Pip.currentAudio) {
          Pip.audioStop();
          Pip.radioClipPlaying = false;
          Pip.currentAudio = null;
          this.drawCurrentlyPlaying();
        } else {
          Pip.audioStart(path);
          Pip.radioClipPlaying = true;
          Pip.currentAudio = path;
          this.drawCurrentlyPlaying(path);
        }
      };
    });

    if (this.page > 0) {
      menu['< PREV'] = () => {
        this.page--;
        this.drawPage();
      };
    }

    if ((this.page + 1) * this.pageSize < this.files.length) {
      menu['NEXT >'] = () => {
        this.page++;
        this.drawPage();
      };
    }

    E.showMenu(menu);

    if (E.menu && typeof E.menu.scrollSound === 'function') {
      E.menu.scrollSound = function () {};
    }
  }

  drawPage() {
    bC.clear(1);
    this.renderMenu();
    this.waveform.start();
    this.waveform.drawBorder();
    this.drawCurrentlyPlaying(Pip.currentAudio);
  }

  show() {
    if (!rd._options) {
      rd.setupI2C();
    }

    if (rd.isOn()) {
      rd.enable(false);
    }

    Pip.radioKPSS = false;
    bC.clear(1);

    this.audioStopHandler = this.handleAudioStopped.bind(this);
    this.knobHandler = this.handleKnob1.bind(this);

    Pip.removeListener('knob1', this.knobHandler);
    Pip.on('knob1', this.knobHandler);

    Pip.removeListener('audioStopped', this.audioStopHandler);
    Pip.on('audioStopped', this.audioStopHandler);

    this.waveform.start();
    this.drawPage();

    const previousSubmenu = Pip.removeSubmenu;
    Pip.removeSubmenu = () => {
      this.waveform.stop();
      bC.clear(1).flip();

      Pip.audioStop();
      Pip.radioClipPlaying = false;
      Pip.currentAudio = null;
      this.playingRandom = false;

      Pip.removeListener('audioStopped', this.audioStopHandler);
      Pip.removeListener('knob1', this.knobHandler);

      if (typeof previousSubmenu === 'function') {
        previousSubmenu();
      }
    };
  }
};
