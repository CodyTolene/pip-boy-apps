// ============================================================================
//  Name: Custom Radio Waveform
//  License: CC-BY-NC-4.0
//  Repository: https://github.com/CodyTolene/pip-apps
//  Description: Waveform display class for Pip-Boy 3000 Mk V Custom Radio
// ============================================================================

global.Waveform = class Waveform {
  constructor() {
    this.animationAngle = 0;
    this.waveformGfx = null;
    this.waveformInterval = null;
    this.waveformPoints = null;
  }

  drawBorder() {
    for (let i = 0; i < 40; i++) {
      const color = i % 5 === 0 ? 3 : 1;
      const height = i % 5 === 0 ? 2 : 1;
      bC.setColor(color);
      bC.drawLine(245 + i * 3, 143 - height, 245 + i * 3, 143);
      bC.drawLine(367 - height, 22 + i * 3, 367, 22 + i * 3);
    }
    bC.setColor(3).drawLine(245, 144, 367, 144).drawLine(368, 144, 368, 22);
    bC.flip();
  }

  start() {
    this.stop();

    this.animationAngle = 0;
    this.waveformPoints = new Uint16Array(60);
    for (let i = 0; i < 60; i += 2) {
      this.waveformPoints[i] = i * 2;
    }

    this.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, { msb: true });
    if (E.getAddressOf(this.waveformGfx, 0) === 0) {
      this.waveformGfx = undefined;
      E.defrag();
      this.waveformGfx = Graphics.createArrayBuffer(120, 120, 2, { msb: true });
    }

    this.waveformInterval = setInterval(() => {
      try {
        if (
          !this.waveformGfx ||
          !this.waveformPoints ||
          !(this.waveformPoints instanceof Uint16Array)
        ) {
          print('[Waveform] Skipping frame - invalid state');
          return;
        }

        this.waveformGfx.clearRect(0, 0, 119, 119);

        if (Pip.radioClipPlaying) {
          Pip.getAudioWaveform(this.waveformPoints, 20, 100);
        } else {
          let a = this.animationAngle;
          for (let i = 1; i < 60; i += 2) {
            this.waveformPoints[i] =
              60 + Math.sin(a) * 45 * Math.sin((a += 0.6) * 0.13);
          }
        }

        this.waveformGfx.drawPolyAA(this.waveformPoints);
        this.animationAngle += 0.3;
        Pip.blitImage(this.waveformGfx, 285, 85, { noScanEffect: true });
      } catch (e) {
        print('[Waveform] Waveform draw error:', e);
      }
    }, 50);
  }

  stop() {
    print('[Waveform] stop() called');
    if (this.waveformInterval) {
      clearInterval(this.waveformInterval);
    }

    this.waveformInterval = null;
    this.waveformPoints = null;

    if (this.waveformGfx) {
      this.waveformGfx = null;
      E.defrag();
    }
  }

  get gfx() {
    return this.waveformGfx;
  }
};
