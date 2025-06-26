function PortaHack() {
  const self = {};

  const GAME_NAME = 'Porta Hack';
  const GAME_VERSION = '1.0.0';

  // Graphics buffer
  const gb = g;

  // Visible Screen Area
  const SCREEN_WIDTH = g.getWidth();
  const SCREEN_HEIGHT = g.getHeight();
  const SCREEN_AREA = {
    x1: 60, // Left margin
    x2: SCREEN_WIDTH - 60, // Right margin
    y1: 10, // Top margin
    y2: SCREEN_HEIGHT - 10, // Bottom margin
  };

  // Header Area
  const HEADER_AREA = {
    x1: SCREEN_AREA.x1,
    x2: SCREEN_AREA.x2,
    y1: SCREEN_AREA.y1,
    y2: SCREEN_AREA.y1 + 30,
  };

  // Colors
  const BLACK = '#000000';
  const GREEN = '#00ff00';
  const GREEN_DARK = '#007f00';
  const GREEN_DARKER = '#003300';

  function clearScreen() {
    gb.setColor(BLACK).fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  function drawBoundaries(area) {
    gb.setColor(GREEN_DARK).drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function drawHeader() {
    gb.setColor(BLACK).fillRect(
      HEADER_AREA.x1 + 1,
      HEADER_AREA.y1 + 1,
      HEADER_AREA.x2 - 1,
      HEADER_AREA.y2 - 1,
    );

    const textHeight = 8;
    gb.setColor(GREEN)
      .setFont('6x' + textHeight)
      .setFontAlign(-1, -1)
      .drawString(
        'Welcome to ROBCO Industries (TM) Termlink',
        HEADER_AREA.x1 + 10,
        HEADER_AREA.y1 + textHeight / 2 + 1,
      )
      .drawString(
        'Password Required',
        HEADER_AREA.x1 + 10,
        HEADER_AREA.y1 + textHeight / 2 + textHeight + 6,
      );
  }

  self.run = function () {
    if (!gb) {
      throw new Error('Pip-Boy graphics buffer not available!');
    }

    bC.clear();
    clearScreen();

    drawBoundaries(SCREEN_AREA);
    drawBoundaries(HEADER_AREA);

    drawHeader();
  };

  return self;
}

PortaHack().run();
