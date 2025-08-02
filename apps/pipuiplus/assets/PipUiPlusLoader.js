function specialSubmenu()
{
	// Avoid loading the bulk of the app into memory permanently,
	// and instead emulate flash memory by loading from SD only when needed
	eval(fs.readFile("USER_BOOT/PIP_UI_PLUS/Special.min.js"));
}

function perksSubmenu()
{
	eval(fs.readFile("USER_BOOT/PIP_UI_PLUS/Perks.min.js"));
}



function readdirSafely(path)
{
	try { return fs.readdir(path).filter(n => n != "." && n != ".."); }
	catch (_) { return []; }
}

function deleteSafely(path)
{
	try { fs.unlink(path); }
	catch (_) {};
}

function deleteRecursively(path)
{
	readdirSafely(path).forEach(n => deleteRecursively(path + "/" + n));
	deleteSafely(path);
};

// Clean up the previous app files (this should be a temporary addition)
deleteRecursively("USER_BOOT/PipUiPlus");
deleteSafely("USER_BOOT/PipUiPlusLoader.js");


// renames properties, adds new properties after specific properties, while maintaining their order in an object
function alter(object, renames, properties)
{
	const propertiesAlreadyMoved = {};

	for (const entry of Object.entries(object))
	{
		const key = entry[0];
		const value = entry[1];

		if (propertiesAlreadyMoved[key]) continue;

		delete object[key];
		object[renames[key] || key] = value;

		const newProperties = properties[key];

		for (const newKey in newProperties)
		{
			delete object[newKey];
			object[newKey] = newProperties[newKey];

			propertiesAlreadyMoved[newKey] = true;
		}
	}
}

alter(
	MODEINFO[MODE.STAT].submenu,
	{ "CONNECT": "CONN", "DIAGNOSTICS": "DIAG" },
	{ "STATUS": { "SPECIAL": specialSubmenu, "PERKS": perksSubmenu } },
);