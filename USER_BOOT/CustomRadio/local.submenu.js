// ============================================================================
//  Name: Custom Radio Waveform
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: A local radio submenu for the Pip-Boy 3000 Mk V.
// ============================================================================

global.LocalSubmenu = class LocalSubmenu {
  constructor(waveform) {
    this.knobInputTimeout = null;
    this.lastInput = 0;
    this.tuneDelayTimeout = null;
    this.waveform = waveform;
    this.knob2Handler = this.handleKnob2.bind(this);
  }

  handleKnob2(dir) {
    if (!this.knobInputTimeout || dir !== this.lastInput) {
      rd.freq += dir * 0.1;
      if (rd.freq < rd.start / 100) {
        rd.freq = rd.end / 100;
      }
      if (rd.freq > rd.end / 100) {
        rd.freq = rd.start / 100;
      }
      rd.drawFreq();

      if (this.tuneDelayTimeout) {
        clearTimeout(this.tuneDelayTimeout);
      }

      this.tuneDelayTimeout = setTimeout(() => {
        try {
          rd.freqSet(rd.freq);
        } catch (err) {
          print('Error tuning radio:', err);
        }
        this.tuneDelayTimeout = null;
      }, 200);

      if (this.knobInputTimeout) {
        clearTimeout(this.knobInputTimeout);
      }

      this.knobInputTimeout = setTimeout(() => {
        this.knobInputTimeout = null;
      }, 20);
    }
    this.lastInput = dir;
  }

  show() {
    if (!rd._options) {
      rd.setupI2C();
    }

    Pip.audioStop();
    Pip.radioKPSS = false;

    bC.clear(1);

    rd.rdsTimer = setInterval(readRDSData, 100);
    if (rd.isOn()) {
      rd.getChannelInfo();
      rd.drawFreq();
    }

    this.waveform.start();
    this.waveform.drawBorder();

    Pip.on('knob2', this.knob2Handler);

    E.showMenu({
      '': {
        x2: 200,
        predraw: () => {
          bC.drawImage(this.waveform.gfx, 245, 20);
          rd.drawFreq(bC);
        },
      },
      'FM Radio': {
        value: rd.isOn(),
        format: (v) => (v ? 'On' : 'Off'),
        onchange: (v) => {
          v ? rd.enable(true) : rd.enable(false);
          rd.drawFreq();
          Pip.audioStart(v ? 'UI/RADIO_ON.wav' : 'UI/RADIO_OFF.wav');
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

    const previousClose = Pip.removeSubmenu;
    Pip.removeSubmenu = () => {
      this.waveform.stop();
      if (rd.tuningInterval) {
        clearInterval(rd.tuningInterval);
      }
      if (rd.rdsTimer) {
        clearInterval(rd.rdsTimer);
      }
      if (this.tuneDelayTimeout) {
        clearTimeout(this.tuneDelayTimeout);
      }
      Pip.removeListener('knob2', this.knob2Handler);
      if (typeof previousClose === 'function') {
        previousClose();
      }
    };
  }
};
