eval(fs.readFile("USER_BOOT/PIP_UI_PLUS/Menu.min.js"));

const SPECIAL_PATH = "USER_BOOT/PIP_UI_PLUS/SPECIAL/_special.dat";

class SpecialEntry extends Entry
{
	constructor(data, index, array)
	{
		super(data);
		this.index = index;
		this.array = array;
	}

	get value() { return this.data.v; }

	set value(value) { this.data.v = value; }

	get min() { return 1; }

	get max() { return 10; }

	onchange() { this.array.set(this.index, this.data); }
}



Pip.removeSubmenu && Pip.removeSubmenu();

const specialArray = new FileBackedArray(E.openFile(SPECIAL_PATH), E.openFile(SPECIAL_PATH, "w+"), 7, 301)
	.lazyMap((o, i, a) => new SpecialEntry(o, i, a));

const menu = new Menu({ x2: 180, compact: true }, specialArray)
	.show();

Pip.removeSubmenu = () => {
	specialArray.close();
	menu.close();
};