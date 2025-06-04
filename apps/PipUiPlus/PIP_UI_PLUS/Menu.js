const mod = (n, d) => (n % d + d) % d; // we need to do this since js doesn't have a normal modulo operator

const wrap = (value, min, max) => mod(value - min, max - min + 1) + min; // wrap values outside of the range to the opposite side

const copy = original => Object.assign(Object.create(Object.getPrototypeOf(original)), original); // shallow copy preserving prototype

// Represents a file on the SD as an array. The file must be separated into chunks of a fixed length to ensure fast lookups and fit it any exctra data that might need to be written.
class FileBackedArray
{
	constructor(readableFile, writableFile, lineCount, lineLength)
	{
		this.readableFile = readableFile;
		this.writableFile = writableFile; // TODO: it's dumb that we have to do this since espruino doesn't expose the r+ mode
		this.length = lineCount;
		this.lineLength = lineLength;
	}

	get(index)
	{
		this.readableFile.seek(index * this.lineLength);
		const line = this.readableFile.read(this.lineLength);
		return line != undefined ? JSON.parse(line) : line;
	}

	set(index, line)
	{
		this.writableFile.seek(index * this.lineLength);
		this.writableFile.write(JSON.stringify(line).padEnd(this.lineLength, " "));
	}

	slice(start, end)
	{
		start = start == null ? 0           : start;
		end   = end   == null ? this.length : end;

		start = start >= 0 ? Math.min(start, this.length) : Math.max(start + this.length, 0);
		end   = end   >= 0 ? Math.min(end,   this.length) : Math.max(end   + this.length, 0);

		const slice = [];
		for (let i = start; i < end; ++i)
			slice.push(this.get(i));
		return slice;
	}

	lazyMap(map)
	{
		const array = copy(this);
		const get = this.get.bind(this);
		array.get = index => {
			const element = get(index);
			return element != undefined ? map(element, index, this) : element;
		};
		return array;
	}

	close()
	{
		this.readableFile.close();
		this.writableFile.close();
	}
}



// Represents a window over an array with a fixed size of n elements, which caches its elements
// (this is important so we can load and keep only the visible entries in memory)
class CachingWindow
{
	constructor(array, size)
	{
		this.array = array;
		this.size = size;

		this.values = array.slice(0, size);
		this.startIndex = 0;
	}

	moveTo(index)
	{
		const newStartIndex = E.clip(index, 0, this.array.length - this.size);
		const newEndIndex = newStartIndex + this.size;
		const delta = E.clip(newStartIndex - this.startIndex, -this.size, this.size);

		if (delta > 0)
		{
			this.values.splice(0, delta);
			this.values.push.apply(this.values, this.array.slice(newEndIndex - delta, newEndIndex));
		}
		else if (delta < 0)
		{
			this.values.splice(delta);
			this.values.unshift.apply(this.values, this.array.slice(newStartIndex, newStartIndex - delta))
		}
		
		this.startIndex = newStartIndex;
	}
}

// This used to be E.showMenu, but now it's been deobfuscated, completely refactored, made more flexible and efficient, and expanded with many new features!
class Menu
{
	static EDIT_ARROW_IMAGE = {
		width: 12,
		height: 5,
		buffer: atob("IAcA+fAOAEA=")
	};
	static ARROW_SIZE = 10;
	static VALUE_PAD_X = 3;

	constructor(options, rows)
	{
		this.rows = rows;

		this.options = options = Object.assign({ x1: 10, x2: -20, y1: 0, y2: -1, titlePadX: 20 }, options);
		options.x1 = wrap(options.x1, 0, bC.getWidth());
		options.x2 = wrap(options.x2, 0, bC.getWidth());
		options.y1 = wrap(options.y1, 0, bC.getHeight());
		options.y2 = wrap(options.y2, 0, bC.getHeight());
		options.rowHeight = options.compact ? 25 : 27;

		this.visibleRows = new CachingWindow(rows, Math.min((options.y2 - options.y1 - Menu.ARROW_SIZE * 2) / options.rowHeight, rows.length) | 0); // | 0 to quickly floor
		this.selectedIndex = 0;
		this.isEditing = false;
		this.knob1Handler = this.handleKnob1.bind(this);
	}

	get selectedRow() { return this.visibleRows.values[this.selectedIndex - this.visibleRows.startIndex]; }

	draw()
	{
		const selectedRow = this.selectedRow;
		selectedRow && selectedRow.draw && selectedRow.draw(this);

		bC.reset();
		this.options.compact ? bC.setFontMonofonto16() : bC.setFontMonofonto18();

		const rowHeight = this.options.rowHeight;
		const x1 = this.options.x1;
		const x2 = this.options.x2;
		const y1 = this.options.y1;
		const cx = (x2 + x1) >> 1;

		const arrowSize = Menu.ARROW_SIZE;
		const titlePadX = this.options.titlePadX;
		const titlePadY = (rowHeight - bC.getFontHeight()) >> 1; // >> n to divide by 2^n and floor in one operation

		const firstVisibleRowIndex = this.visibleRows.startIndex;
		const visibleRowCount = this.visibleRows.values.length;
		const lastVisibleRowIndex = firstVisibleRowIndex + visibleRowCount;

		// draw up arrow if the first row is no longer on screen
		bC.setColor(firstVisibleRowIndex > 0 ? 3 : 0).fillPoly([
			cx - arrowSize, y1 + arrowSize,
			cx + arrowSize, y1 + arrowSize,
			cx			  , y1
		]);

		this.visibleRows.values.forEach( (row, visibleRowIndex) => 
		{
			const isSelected = firstVisibleRowIndex + visibleRowIndex == this.selectedIndex;
			const drawHighlight = isSelected && !this.isEditing;

			const rowY1 = y1 + arrowSize + rowHeight * visibleRowIndex;
			const rowY2 = rowY1 + rowHeight - 1;

			// draw row
			bC.setBgColor(drawHighlight ? 3 : 0)
			  .clearRect(x1, rowY1, x2, rowY2) // draw highlight
			  .setColor(drawHighlight ? 0 : 3)
			  .setFontAlign(-1, -1)
			  .drawString(row.title, x1 + titlePadX, rowY1 + titlePadY); // draw title

			if (row.value == null) return; // null OR undefined

			const rowValue = row.format ? row.format(row.value) : row.value;
			const isEditing = isSelected && this.isEditing;

			const arrowsImage = Menu.EDIT_ARROW_IMAGE;
			const valueX = isEditing ? x2 - arrowsImage.width * 2 : x2;
			const valuePadX = Menu.VALUE_PAD_X;

			isEditing && // draw edit box
			bC.setBgColor(3)
			  .clearRect(valueX - bC.stringWidth(rowValue) - valuePadX * 2, rowY1, x2, rowY2) // draw highlight
			  .setColor(0)
			  .drawImage(arrowsImage, valueX, rowY1 + ((rowHeight - arrowsImage.height * 2) >> 1), { scale: 2 }); // draw up/down arrows

			// draw value
			bC.setFontAlign(1, -1)
			  .drawString(rowValue.toString(), valueX - valuePadX, rowY1 + titlePadY);
		});

		const by = y1 + arrowSize + rowHeight * visibleRowCount;

		// draw down arrow if the last row is not on screen
		bC.setColor(lastVisibleRowIndex < this.rows.length ? 3 : 0).fillPoly([
			cx - arrowSize, by,
			cx + arrowSize, by,
			cx			  , by + arrowSize
		]).flip();
	}

	move(delta)
	{
		if (this.isEditing) // edit value
		{
			const row = this.selectedRow;
			const lastValue = row.value;

			row.value -= delta * (row.step || 1);
			row.value = E.clip(row.value, row.min, row.max);

			if (row.value == lastValue) return;
			if (row.onchange) row.onchange(row.value, -delta);

			this.draw();
		}
		else if (this.rows.length > 0) // move selection
		{
			const newIndex = this.options.wrap
				? wrap(this.selectedIndex + delta, 0, this.rows.length - 1)
				: E.clip(this.selectedIndex + delta, 0, this.rows.length - 1);
			if (newIndex == this.selectedIndex) return;

			this.selectedIndex = newIndex;
			this.visibleRows.moveTo(newIndex - (this.visibleRows.size >> 1)); // make sure the selected index is in the middle of the window when possible

			this.draw();
			Pip.knob1Click(delta);
		}
	}

	click()
	{
		const row = this.selectedRow;
		if (!row) return;

		Pip.audioStartVar(Pip.audioBuiltin("OK"));

		const valueType = (typeof row.value)[0];
		if (valueType == "n") this.isEditing = !this.isEditing; // number
		else
		{
			if (valueType == "b") row.value = !row.value; // boolean
			if (row.onchange)	  row.onchange(row.value);
		}

		this.draw();
	}

	handleKnob1(delta)
	{
		delta ? this.move(-delta) : this.click();
	}

	show()
	{
		bC.clear(1);
		this.draw();
		Pip.on("knob1", this.knob1Handler);
		return this;
	}

	close()
	{
		Pip.removeListener("knob1", this.knob1Handler);
		Pip.videoStop();
	}
}

// Represents a column of UI elements. Each element has a specified height and its width scales with the column width.
class Column
{
	constructor()
	{
		this.elements = [];
	}

	add(draw, height)
	{
		this.elements.push({ draw, height });
		return this;
	}

	replace(index, draw, height)
	{
		const element = this.elements[index];
		element.draw = draw;
		element.height = height;
		return this;
	}

	draw(bounds)
	{
		bounds.bottom = bounds.top;

		this.elements.forEach( element => {
			bounds.bottom += element.height;
			element.draw && element.draw(bounds);
			bounds.top += element.height;
		});
	}
}

class Entry
{
	constructor(data)
	{
		this.data = data;

		this.column = new Column()
			.add(this.clear.bind(this), 0)
			.add(this.drawImage.bind(this), Math.max(120, this.data.h))
			.add(null, 10)
			.add(this.drawDescription.bind(this), 100);
	}

	get title() { return this.data.t; }

	get description() { return this.data.d; }

	clear(bounds)
	{
		bC.reset()
		  .clearRect(bounds.left, bounds.top, bounds.right, bC.getHeight());
	}

	drawImage(bounds)
	{
		const imageX = (bounds.left + (bounds.right - 10) - this.data.w) >> 1; // centered horizontally (but bounds are padded 10 from the right)
		const imageY = bounds.top + (bounds.bottom - bounds.top - this.data.h) * 3/4; // 3/4ths vertically

		const videoOffsetX = 40; // videos seem to be offset differently for some reason...
		const videoOffsetY = 65; // these values were obtained by pure tireless trial and error o_o

		Pip.videoStop();
		Pip.videoStart(this.data.f, {
			x: videoOffsetX + imageX,
			y: videoOffsetY + imageY,
			repeat: true
		});
	}

	drawDescription(bounds)
	{
		bC.setFont("Vector", 12)
		  .drawString(bC.wrapString(this.description, (bounds.right - 10) - (bounds.left + 10)).join("\n"), bounds.left + 10, bounds.top); // padded 10 left and right
	}

	draw(menu)
	{
		this.column.draw({ top: 0, left: menu.options.x2, right: bC.getWidth() });
	}
}