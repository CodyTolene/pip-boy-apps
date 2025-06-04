eval(fs.readFile("USER_BOOT/PIP_UI_PLUS/Menu.min.js"));

const ENABLED_PERKS_PATH = "USER_BOOT/PIP_UI_PLUS/PERKS/_enabled_perks.dat";
const PERKS_PATH = "USER_BOOT/PIP_UI_PLUS/PERKS/_perks.dat";

function insertSorted(array, num)
{
	let low = 0, high = array.length;

	// Binary search
	while (low < high)
	{
		const mid = (low + high) >> 1;
		const midNum = array[mid];

		if (midNum == num) return false; // ignore dupes
		else if (midNum < num) low = mid + 1;
		else high = mid;
	}

	array.splice(low, 0, num);
	return true;
}

function remove(array, element)
{
	const index = array.indexOf(element);
	if (index < 0) return false;
	array.splice(index, 1);
	return true;
}

class PerkEntry extends Entry
{
	static STAR_IMAGE = { width: 11, height: 11, bpp: 1 };
	static FILLED_STAR_BUFFER = atob("BAHAOH///v+P4fx7zjmDAA==");
	static HOLLOW_STAR_BUFFER = atob("BAFAKHj4AoCIISRKSimDAA==");
	static STAR_GAP = 2;

	constructor(data)
	{
		super(data);
		this.column.replace(2, this.drawStars.bind(this), 20);
	}

	get description() { return this.data.d[Math.max(0, this.data.r - 1)]; }

	drawStars(bounds)
	{
		const starImage = PerkEntry.STAR_IMAGE;
		const starGap = PerkEntry.STAR_GAP;
		const starCount = this.data.d.length;
		const totalWidth = starCount * (starImage.width + starGap) - starGap;

		const starsX = (bounds.left + bounds.right - totalWidth) >> 1;
		const starsY = (bounds.top + bounds.bottom - starImage.height) >> 1;

		for (let i = 0; i < starCount; ++i)
		{
			const filled = i + 1 <= this.data.r;
			starImage.buffer = filled ? PerkEntry.FILLED_STAR_BUFFER : PerkEntry.HOLLOW_STAR_BUFFER;
			bC.drawImage(starImage, starsX + i * (starImage.width + starGap), starsY, { scale: 1 });
		}
	}
}

class PerkEditorEntry extends PerkEntry
{
	constructor(data, index, array, indices) // TODO: weird that we pass so much stuff in. Would be nice to shorten this
	{
		super(data);
		this.index = index;
		this.array = array;
		this.indices = indices;
	}

	get value() { return this.data.r; }

	set value(value) { this.data.r = value; }

	get min() { return 0; }

	get max() { return this.data.d.length; }

	onchange(value)
	{
		this.array.set(this.index, this.data);

		const changed = value == 0
			? remove(this.indices, this.index)
			: insertSorted(this.indices, this.index);
		
		if (changed) fs.writeFile(ENABLED_PERKS_PATH, this.indices.join(","));
	}
}

class IndexedFileBackedArray extends FileBackedArray
{
	constructor(array, indices)
	{
		super(array.readableFile, array.writableFile, -1, array.lineLength);
		this.indices = indices;
	}

	get length() { return this.indices ? this.indices.length : -1; } // TODO: weird that we need the null check here, getter shouldn't be called anywhere when constructing the object

	set length(_) {}

	get(index) { return super.get(this.indices[index]); }
}



Pip.removeSubmenu && Pip.removeSubmenu();

const enabledPerkIndices = fs.readFile(ENABLED_PERKS_PATH)
	.split(",").map(s => parseInt(s));
const perksArray = new FileBackedArray(E.openFile(PERKS_PATH), E.openFile(PERKS_PATH, "w+"), 74, 701)
	.lazyMap((o, i, a) => new PerkEditorEntry(o, i, a, enabledPerkIndices));
const enabledPerksArray = new IndexedFileBackedArray(perksArray, enabledPerkIndices)
	.lazyMap(o => new PerkEntry(o));

let menu = null;
let editorEnabled = false;

function swapMenu()
{
	menu && (menu.close(), Pip.audioStartVar(Pip.audioBuiltin("OK")));

	menu = editorEnabled
		? new Menu({ x2: 190, titlePadX: 5, compact: true, wrap: true }, perksArray)
		: new Menu({ x2: 190, compact: true }, enabledPerksArray);
	menu.show();

	editorEnabled = !editorEnabled;
}

function resetTorchHandler(handler)
{
	Pip.removeAllListeners("torch");
	Pip.on("torch", handler);
}

swapMenu();
resetTorchHandler(swapMenu); // replace default handler with ours

Pip.removeSubmenu = () => {
	perksArray.close();
	menu.close();
	resetTorchHandler(torchButtonHandler); // restore default torch handler
};