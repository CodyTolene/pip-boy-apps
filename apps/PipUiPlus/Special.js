// =============================================================================
//  Name: PipUI+ - Special Menu
//  Version: 1.0.0
// =============================================================================

// Helper function for modulo that wraps around
const mod = (value, modulus) => ((value % modulus) + modulus) % modulus;

// Bounds a value between min and max, inclusive
const boundedValue = (value, min, max) => mod(value - min, max - min + 1) + min;

// Main menu class
class PipMenu {
  constructor(options, rows) {
    this.rows = rows;

    // Apply default options
    this.options = options = Object.assign(
      {
        x1: 10,
        x2: -20,
        y1: 0,
        y2: -1,
        compact: false,
      },
      options,
    );

    // Wrap coordinates within screen bounds
    options.x1 = mod(options.x1, bC.getWidth());
    options.x2 = mod(options.x2, bC.getWidth());
    options.y1 = mod(options.y1, bC.getHeight());
    options.y2 = mod(options.y2, bC.getHeight());

    this.selectedIndex = 0;
    this.isEditing = false;
  }

  get selectedRow() {
    return this.rows[this.selectedIndex];
  }

  draw() {
    bC.reset();
    this.options.compact ? bC.setFontMonofonto16() : bC.setFontMonofonto18();

    const x1 = this.options.x1;
    const x2 = this.options.x2;
    const y1 = this.options.y1;
    const y2 = this.options.y2;
    const centerX = (x2 + x1) >> 1;

    const topMargin = 10;
    const rowHeight = this.options.compact ? 25 : 27;
    const verticalPadding = (rowHeight - bC.getFontHeight()) >> 1;
    const visibleRows = Math.floor(
      Math.min((y2 - y1 - 20) / rowHeight, this.rows.length),
    );
    const firstRow = E.clip(
      this.selectedIndex - (visibleRows >> 1),
      0,
      this.rows.length - visibleRows,
    );

    // Up arrow
    bC.setColor(firstRow > 0 ? 3 : 0).fillPoly([
      centerX - topMargin,
      y1 + topMargin,
      centerX + topMargin,
      y1 + topMargin,
      centerX,
      y1,
    ]);

    // Render rows
    for (let i = 0; i < visibleRows; ++i) {
      const index = firstRow + i;
      const row = this.rows[index];
      const isSelected = index === this.selectedIndex;
      const isValueEdit = isSelected && !this.isEditing;

      const rowTop = y1 + topMargin + rowHeight * i;
      const rowBottom = rowTop + rowHeight - 1;

      bC.setBgColor(isValueEdit ? 3 : 0)
        .clearRect(x1, rowTop, x2, rowBottom)
        .setColor(isValueEdit ? 0 : 3)
        .setFontAlign(-1, -1)
        .drawString(row.title, x1 + 20, rowTop + verticalPadding);

      if (row.value != null) {
        const valueText = row.format ? row.format(row.value) : row.value;
        const valueX = isSelected && this.isEditing ? x2 - 24 : x2;

        if (isSelected && this.isEditing) {
          bC.setBgColor(3)
            .clearRect(
              valueX - bC.stringWidth(valueText) - 6,
              rowTop,
              x2,
              rowBottom,
            )
            .setColor(0)
            .drawImage(
              {
                width: 12,
                height: 5,
                buffer: '\x20\x07\x00\xf9\xf0\x0e\x00\x40',
                transparent: 0,
              },
              valueX,
              rowTop + ((rowHeight - 10) >> 1),
              { scale: 2 },
            );
        }

        bC.setFontAlign(1, -1).drawString(
          valueText.toString(),
          valueX - 3,
          rowTop + verticalPadding,
        );
      }
    }

    // Down arrow
    const arrowY = y1 + topMargin + rowHeight * visibleRows;
    bC.setColor(firstRow + visibleRows < this.rows.length ? 3 : 0).fillPoly([
      centerX - topMargin,
      arrowY,
      centerX + topMargin,
      arrowY,
      centerX,
      arrowY + topMargin,
    ]);

    bC.flip();
  }

  move(delta) {
    if (this.isEditing) {
      const row = this.selectedRow;
      const oldValue = row.value;
      row.value -= delta * (row.step || 1);
      row.value = row.wrap
        ? boundedValue(row.value, row.min, row.max)
        : E.clip(row.value, row.min, row.max);

      if (row.value !== oldValue && row.onchange) {
        row.onchange(row.value, -delta);
      }
    } else {
      const prevIndex = this.selectedIndex;
      this.selectedIndex = E.clip(
        this.selectedIndex + delta,
        0,
        this.rows.length - 1,
      );

      if (prevIndex !== this.selectedIndex) {
        if (this.selectedRow.onselect) this.selectedRow.onselect(this);
        Pip.knob1Click(delta);
      }
    }

    this.draw();
  }

  click() {
    const row = this.selectedRow;
    Pip.audioStartVar(Pip.audioBuiltin('OK'));

    const type = typeof row.value;
    if (type[0] === 'n') {
      this.isEditing = !this.isEditing;
    } else {
      if (type[0] === 'b') row.value = !row.value;
      if (row.onchange) row.onchange(row.value);
    }

    this.draw();
  }

  handleKnob1(delta) {
    if (delta) {
      this.move(-delta);
    } else {
      this.click();
    }
  }

  show() {
    if (Pip.removeSubmenu) Pip.removeSubmenu();
    bC.clear(1);
    if (this.selectedRow.onselect) this.selectedRow.onselect(this);
    this.draw();

    const handler = this.handleKnob1.bind(this);
    Pip.addListener('knob1', handler);

    Pip.removeSubmenu = () => {
      Pip.removeListener('knob1', handler);
      Pip.videoStop();
    };
  }
}

// Simple JSON-backed menu item
class JsonRow {
  constructor(path, entry) {
    this.path = path;
    this.title = entry.t;
  }

  read() {
    return JSON.parse(fs.readFile(this.path));
  }

  write(data) {
    fs.writeFile(this.path, JSON.stringify(data));
  }

  onselect(menu) {
    const data = this.read();
    const textX = menu.options.x2 + 10;
    const textRight = bC.getWidth();
    const videoX = menu.options.x2;
    const screenRight = bC.getWidth() - 10;

    Pip.videoStop();
    Pip.videoStart(data.f, {
      x: 40 + ((videoX + screenRight - data.w) >> 1),
      y: 65 + Math.max(0, 120 - data.h),
      repeat: true,
    });

    bC.reset()
      .setFont('Vector', 12)
      .clearRect(textX, 130, textRight, bC.getHeight())
      .drawString(
        bC.wrapString(data.d, textRight - textX).join('\n'),
        textX,
        130,
      );
  }
}

// Editable value row backed by JSON
class JsonValueRow extends JsonRow {
  constructor(path, entry) {
    super(path, entry);
    this.value = entry.v;
  }

  onchange(newValue) {
    const data = this.read();
    data.v = newValue;
    this.write(data);
  }
}

// Range-constrained value row
class JsonRangeRow extends JsonValueRow {
  constructor(path, entry) {
    super(path, entry);
    this.min = 1;
    this.max = 10;
  }
}

// Load menu
const basePath = 'USER/PipUiPlus/Special';

const menu = new PipMenu(
  { x2: 180, compact: true },
  fs
    .readdir(basePath)
    .filter((file) => file.endsWith('.json'))
    .map((file) => `${basePath}/${file}`)
    .map((file) => new JsonRangeRow(file, JSON.parse(fs.readFile(file)))),
);

menu.show();
