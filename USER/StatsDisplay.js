// ============================================================================
//  Name: Stats Display
//  Link: https://athene.gay/
//  Description: Display the SPECIAL stats and skills of the player character.
//               Also allows the user to configure the SPECIAL stats and skills.
//  Version: 2.2.1
// ============================================================================

//SECTION: consts
const entryListDisplayMax = 6;
const configListDisplayMax = 18;
const configColumnDisplayMax = 9; //half of config display max
const titleOffsetY = 22;
const perkImageXMaxSize = 167;
const perkImageYMaxSize = 153;
const colourBlack = 0;
const colourGray1 = 1;
const colourGray2 = 2;
const colourWhite = 3;
const maxScreen = 2;
const perkScreen = 2;
const statScreen = 1;
const SPECIALScreen = 0;
const perkSelectionScreen = 3;
const enabledPerkFolder = 'USER/StatsDisplay/PERKS/ENABLED/';
const allPerkFolder = 'USER/StatsDisplay/PERKS/ALL/';
const skillsFolder = 'USER/StatsDisplay/SKILLS/';
const specialFolder = 'USER/StatsDisplay/SPECIAL/';

let isModernVersion = false;
try {
  let s = require('Storage');
  let l = s.list();
  if (l.includes('VERSION') && l.includes('.bootcde')) {
    let versionStr = s.read('VERSION') || '';
    let versionNum = parseFloat(versionStr);
    isModernVersion = versionNum >= 1.29;
  }
} catch (e) {
  console.log('Unable to determine JS version:', e);
}

function normalizeDir(dir) {
  if (isModernVersion && dir.endsWith('/')) {
    return dir.slice(0, -1);
  }
  if (!isModernVersion && !dir.endsWith('/')) {
    return dir + '/';
  }
  return dir;
}

Graphics.prototype.setFontMonofonto14 = function () {
  // Actual height 14 (13 - 0)
  // 1 BPP
  return this.setFontCustom(
    E.toString(
      require('heatshrink').decompress(
        atob(
          'AB0D/uP/0/7AICh+AnwNC8AGBAoMBwFnw4UB/H/8f/h4ZDgHxw/nn/e+/55/DEIV88P/w/4g/4v/j7+MvwNBu4iBx/2FIPz8EfwEyKAwjB/BZGgH/5///kPLQcD///n/whgIBAQMzgARB+E/wE/gHMMwUAgkAiEBJgPgAwQyFgPgg+AjAIDsCCBg0ABINgCwoKBnAKDgahBFYN+h/gnkA4BTCUAkBXgX4n4OCgEcgCSBRYP+HQUjweOn0zDYNj+ODG4INB4YNBt0zzDKCwZYCIIN+XQLYEMwkD/cP90/zHO8c/ZQZxBj+DJgOY/1jz+IBoXAkcHxhhDgfgWwUAmODLQU7zHusZhEnED/GP805/Hn8f+g/wWwuYg9wjOABQkZ8F3wOYWIakB+EHsAUB4cDH4UJgEkgGQgVAAwgNBmHAWwIwB8EPEQTUCsEDwOO9033H8kfggY+Cj5xB+f95v7m3s/+x/zVBgPgN4U/+H/AwOAjyuDBof4UAKEEv/DAwUwjHg8eDwUIBoLRCBoM4nDmD/ANGmOY41jSggNFwHGgbyCh5KBBoOOg0z/Hv8e/DYLfCBoOAsAGFFIXALQYNBAwMBBoQtBsEBxkODYZtCIowNB/fjgZTIEQhFGOwJFIDYfwh4NFN4yZEG5E54H/gKlCDYsHnE+//7cIIbHnY3C+YpDvHD+eP80z7Hn8efBoMwTIL7FAwIZCn43DwEGPoJTEng3BwYGBDYQGB4AbBnxFDwf+Po0ghHxAwOH/iZDwZFD/BFBDYINB/jCDmEY4fjn5TCzH4dogADh//AAJXCiEAnApBgH8AIV+QoLhBIoIfBg4ZCLoQMBh+AN4PwgPgGIkEFIVAgIGFBoMCgEMG4QtBDIcwhvgm6SBgfYcIM/ehEDjANF8EH4AGB8wNBh3gmINBgPwCgfGUAauCDYvWgdYCgM9BoLqBhj0F5j0DDYMPY4Ow43D/4GC8BTIWQJhFhljn+O/0zWgJ+BAAMDgcMh8//3/+f/aIY+C/4iC90CjAlDgBoGgf4G4Y+BAwgmDBohMGoCgF3ANBj53DN4Xw//DXgquGSwIUDG43AG4MOeAIpDh1AWoJTCfYMXSQiiBwf+h/4hlgcwUDXgIpCg0AIosDwEPMIU+PoXAnCuCKYUfRYs8BoMChEMEQV+BocgFInENAMfegQpDKYVgm4pEKYYADhB4Bn////+PwqOC/+/BYIVDCYP//h/BkAKBOQUAsEBPIYGBBoI',
        ),
      ),
    ),
    32,
    atob(
      'BwYHCAgICAYHBggIBgcGCAgGCAgICAgICAgGBggICAgICAgICAcICAgICAgICAgICAgICAgICAgICAgICAUICAcICAgICAgICAcHCAYICAgICAgICAgICAgICAgGBwg=',
    ),
    14 | 65536,
  );
};

//SECTION: Screen drawing

function draw() {
  if (drawing) return;
  drawing = true;
  bC.clear();
  if (screenSelected == perkScreen) {
    buildScreen(enabledPerkFolder);
  } else if (screenSelected == statScreen) {
    buildScreen(skillsFolder);
  } else if (screenSelected == SPECIALScreen) {
    buildScreen(specialFolder);
  } else if (screenSelected == perkSelectionScreen) {
    buildPerkSelectionScreen();
  }
  bH.flip();
  bF.flip();
  bC.flip();
  drawing = false;
}

function buildScreen(directory) {
  //directory will only be used when we need to go to SD, which will be when perk changes or we scroll to the next page.
  if (lastReload == null) {
    displayedPerks = [];
    //time to populate the displayedPerks array and currentPerk
    var files;
    try {
      files = require('fs').readdirSync(normalizeDir(directory));
    } catch {
      require('fs').mkdir(normalizeDir(directory));
      files = require('fs').readdirSync(normalizeDir(directory));
    }

    files = files.filter((f) => f !== '.' && f !== '..');

    if (isModernVersion) {
      files = files.filter((file) => {
        try {
          let stat = require('fs').statSync(
            normalizeDir(directory) + '/' + file,
          );
          return !stat.isDirectory;
        } catch (e) {
          console.log('Skipping bad file or folder:', file);
          return false;
        }
      });
    }

    loadedListMax = files.length;
    if (files.length == 0) {
      drawEmptyScreen();
      return;
    }

    let entryListMax = Math.min(entryListDisplayMax, loadedListMax);
    let a = 0;
    while (entrySelected >= entryListMax) {
      a++;
      //We're beyond the number of entries we can see on one page.
      //We need to get the next set of files and display them
      entryListMax = Math.min(entryListDisplayMax * (a + 1), loadedListMax);
    }

    for (let i = a * entryListDisplayMax; i < entryListMax; i++) {
      let file = files[i];
      const fullPath = normalizeDir(directory) + '/' + file;
      let fileString;
      try {
        fileString = require('fs').readFileSync(fullPath);
      } catch (e) {
        console.log('Skipping unreadable file:', fullPath, e);
        continue;
      }
      let fileObj;
      try {
        fileObj = JSON.parse(fileString);
      } catch (e) {
        console.log('Invalid JSON in file:', fullPath);
        continue;
      }
      if (screenSelected != perkScreen) {
        displayedPerks.push({
          title: fileObj.title,
          filename: file,
          entryNum: i,
          points: fileObj.points,
        });
      } else {
        displayedPerks.push({
          title: fileObj.title,
          filename: file,
          entryNum: i,
        });
      }
    }
    lastReload = entrySelected;
  }
  if (currentPerk == null) {
    let currPerkInt = entrySelected % 6;
    let file = displayedPerks[currPerkInt].filename;
    const fullPath = normalizeDir(directory) + '/' + file;
    try {
      let fileString = require('fs').readFileSync(fullPath);
      currentPerk = JSON.parse(fileString);
    } catch (e) {
      console.log('Error loading currentPerk file:', fullPath, e);
      currentPerk = null;
    }
  }
  for (let i = 0; i < displayedPerks.length; i++) {
    let perkObj = displayedPerks[i];
    if (perkObj.entryNum == entrySelected) {
      drawEntry(currentPerk);
      drawSelectedEntryOutline(i);
      if (!configMode && screenSelected != perkScreen) {
        pointsOfSelected = perkObj.points;
      }
    }
    drawEntryTitle(perkObj.title, i, perkObj.entryNum == entrySelected);
    if (screenSelected != perkScreen) {
      drawEntryPoints(perkObj.points, i, perkObj.entryNum == entrySelected);
    }
  }
}

function buildPerkSelectionScreen() {
  if (allPerks.length == 0) {
    generatePerksConfigLists();
  }
  //ok, now for each element in allPerks, we draw it.
  //I think we can draw two columns of 8 titles, so sixteen on screen
  //at a time. Then scroll further and it's a new screen of sixteen.
  let entryListMax = Math.min(configListDisplayMax, loadedListMax);
  let a = 0;
  while (entrySelected >= entryListMax) {
    a++;
    //We're beyond the number of entries we can see on one page.
    //We need to get the next set of files and display them
    entryListMax = Math.min(configListDisplayMax * (a + 1), loadedListMax);
  }
  let col = 0;
  for (i = a * configListDisplayMax; i < entryListMax; i++) {
    if (i != a * configListDisplayMax && i % configColumnDisplayMax == 0) {
      col = 1;
    }
    let perk = allPerks[i];
    if (i == entrySelected) {
      drawSelectedEntryOutlineConfig(i % configListDisplayMax, col);
    }
    drawEntryTitleConfig(
      perk.title,
      i % configListDisplayMax,
      i == entrySelected,
      col,
      enabledPerks.includes(perk.filename),
    );
  }
}

function generatePerksConfigLists() {
  //first load of screen, build the full list.
  var files;
  try {
    files = require('fs').readdirSync(normalizeDir(enabledPerkFolder));
  } catch {
    require('fs').mkdir(enabledPerkFolder);
    files = require('fs').readdirSync(normalizeDir(enabledPerkFolder));
  }

  files = files.filter((f) => f !== '.' && f !== '..');

  for (let file of files) {
    enabledPerks.push(file);
  }

  try {
    files = require('fs').readdirSync(normalizeDir(allPerkFolder));
    files = files.filter((f) => f !== '.' && f !== '..');
  } catch {
    console.log('ERROR: Missing ALL perk folder!');
    files = [];
  }
  loadedListMax = files.length;

  for (let file of files) {
    let fullPath = normalizeDir(allPerkFolder) + '/' + file;
    let fileString;
    try {
      fileString = require('fs').readFileSync(fullPath);
    } catch (e) {
      console.log('Skipping missing perk file:', fullPath, e);
      continue;
    }
    let fileObj;
    try {
      fileObj = JSON.parse(fileString);
    } catch (e) {
      console.log('Skipping invalid JSON perk file:', fullPath, e);
      continue;
    }
    let perkObj = { filename: file, title: fileObj.title };
    allPerks.push(perkObj);
  }
}

//SECTION: Element Drawing

function drawEmptyScreen() {
  bC.setFontMonofonto18();
  bC.setColor(colourWhite);
  bC.drawString('No Perks selected, press wheel to configure.', 2, 100);
}

function drawEntry(perkObj) {
  drawEntryImage(perkObj.img, perkObj.xSize, perkObj.ySize);
  drawEntryDesc(perkObj.description);
}

function drawEntryImage(imgStr, xSize, ySize) {
  //so we want to try and draw as central as possible.
  //our 'window' for how big the perk can be is 167x153 (y truncated for the desc at the bottom)
  //to figure out how to centre the image we need to get the difference
  //between the size of the image and our window, halve it, and add it on
  //to the location.
  let xOffset = Math.floor((perkImageXMaxSize - xSize) / 2);
  let yOffset = Math.floor((perkImageYMaxSize - ySize) / 2);
  bC.setColor(colourGray2);
  bC.drawImage(
    {
      width: xSize,
      height: ySize,
      bpp: 1,
      buffer: require('heatshrink').decompress(atob(imgStr)),
    },
    200 + xOffset,
    0 + yOffset,
  );
}

function drawEntryTitle(title, i, selected) {
  bC.setFontMonofonto18();
  if (selected) {
    bC.setColor(colourBlack);
  } else {
    bC.setColor(colourWhite);
  }
  bC.drawString(title, 10, titleOffsetY * i + 5);
}

function drawEntryTitleConfig(title, i, selected, col, enabled) {
  bC.setFontMonofonto18();
  let finalTitle = '';
  if (enabled) {
    finalTitle = title + ' *';
  } else {
    finalTitle = title;
  }
  if (selected) {
    bC.setColor(colourBlack);
  } else {
    bC.setColor(colourWhite);
  }
  if (col == 0) {
    bC.drawString(finalTitle, 10, titleOffsetY * i + 5);
  } else {
    bC.drawString(
      finalTitle,
      210,
      titleOffsetY * (i - configColumnDisplayMax) + 5,
    );
  }
}

function drawEntryPoints(points, i, selected) {
  bC.setFontMonofonto18();
  if (selected) {
    bC.setColor(colourBlack);
  } else {
    bC.setColor(colourWhite);
  }
  if (configMode && selected) {
    bC.fillPoly([
      129,
      titleOffsetY * i + 12,
      140,
      titleOffsetY * i + 12,
      135,
      titleOffsetY * i + 5,
    ]);
    bC.fillPoly([
      141,
      titleOffsetY * i + 12,
      151,
      titleOffsetY * i + 12,
      146,
      titleOffsetY * i + 17,
    ]);
    bC.drawString(pointsOfSelected, 160, titleOffsetY * i + 5);
  } else {
    bC.drawString(points, 160, titleOffsetY * i + 5);
  }
}

function drawEntryDesc(desc) {
  bC.setFontMonofonto14();
  bC.setColor(colourWhite);
  bC.drawString(desc, 10, 150);
}

function drawSelectedEntryOutline(i) {
  bC.setColor(colourWhite);
  bC.fillRect(5, titleOffsetY * i + 1, 190, titleOffsetY * i + 23);
}

function drawSelectedEntryOutlineConfig(i, col) {
  bC.setColor(colourWhite);
  if (col == 0) {
    bC.fillRect(5, titleOffsetY * i + 1, 190, titleOffsetY * i + 23);
  } else {
    bC.fillRect(
      205,
      titleOffsetY * (i - configColumnDisplayMax) + 1,
      390,
      titleOffsetY * (i - configColumnDisplayMax) + 23,
    );
  }
}

//SECTION: config saving

function saveFile(directory) {
  if (entrySelected % entryListDisplayMax >= displayedPerks.length) {
    console.log('Invalid entrySelected index');
    return;
  }
  let file = displayedPerks[entrySelected % entryListDisplayMax].filename;
  let fileToSave = normalizeDir(directory) + '/' + file;

  let fileString;
  try {
    fileString = require('fs').readFileSync(fileToSave);
  } catch (e) {
    console.log('Error reading file to save:', fileToSave, e);
    return;
  }

  let fileObj;
  try {
    fileObj = JSON.parse(fileString);
  } catch (e) {
    console.log('Error parsing JSON in file to save:', fileToSave, e);
    return;
  }

  fileObj.points = pointsOfSelected;
  fileString = JSON.stringify(fileObj);

  try {
    require('fs').writeFile(fileToSave, fileString);
  } catch (e) {
    console.log('Error writing file:', fileToSave, e);
  }

  // update in-memory data
  displayedPerks[entrySelected % entryListDisplayMax].points = pointsOfSelected;
  currentPerk = fileObj;
}

function saveNewValue() {
  if (screenSelected == SPECIALScreen) {
    saveFile(specialFolder);
  } else if (screenSelected == statScreen) {
    saveFile(skillsFolder);
  }
}

function saveEnabledPerk(filename) {
  //"USER/PERKS/ALL"
  let fileString = require('fs').readFileSync(
    normalizeDir(allPerkFolder) + '/' + filename,
  );
  require('fs').writeFile(
    normalizeDir(enabledPerkFolder) + '/' + filename,
    fileString,
  );
}

function saveNewPerkSelection() {
  let enabledFiles;
  try {
    enabledFiles = require('fs').readdirSync(normalizeDir(enabledPerkFolder));
  } catch (e) {
    console.log('Enabled folder missing, creating...');
    require('fs').mkdir(normalizeDir(enabledPerkFolder));
    enabledFiles = [];
  }

  enabledFiles = enabledFiles.filter((f) => f !== '.' && f !== '..');

  for (let i = 0; i < allPerks.length; i++) {
    let perk = allPerks[i];
    if (
      enabledPerks.includes(perk.filename) &&
      enabledFiles.includes(perk.filename)
    ) {
      continue; //was enabled, still enabled, nothing to do.
    } else if (
      enabledPerks.includes(perk.filename) &&
      !enabledFiles.includes(perk.filename)
    ) {
      //wasn't enabled, is enabled now, copy the file to enabled folder.
      saveEnabledPerk(perk.filename);
    } else if (
      !enabledPerks.includes(perk.filename) &&
      enabledFiles.includes(perk.filename)
    ) {
      //was enabled, no longer is, delete the file from ENABLED
      require('fs').unlink(
        normalizeDir(enabledPerkFolder) + '/' + perk.filename,
      );
    }
  }
  //everything done, wipe out the in-memory enabled/disabled lists.
  enabledPerks = [];
  allPerks = [];
}

function togglePerkEnabled() {
  let perkObj = allPerks[entrySelected];
  if (enabledPerks.includes(perkObj.filename)) {
    let index = enabledPerks.indexOf(perkObj.filename);
    enabledPerks.splice(index, 1);
  } else {
    enabledPerks.push(perkObj.filename);
  }
}

//SECTION: Button handlers

function handleKnob1Config(dir) {
  //first, play the click.
  Pip.knob1Click(dir);

  if (dir == 0) {
    //pressed in, this is the config trigger.
    //toggle configuration mode on special/skills screens
    configMode = !configMode;
    saveNewValue();
    Pip.removeListener('knob1', handleKnob1Config);
    Pip.on('knob1', handleKnob1);
    registeredKnob1Func = handleKnob1;
  } else {
    pointsOfSelected += dir;
    if (pointsOfSelected < 0) {
      pointsOfSelected = 100;
    } else if (pointsOfSelected > 100) {
      entrySelected = 0;
    }
  }
}

function handleKnob1(dir) {
  //first, play the click.
  Pip.knob1Click(dir);

  if (dir == 0) {
    //pressed in, this is the config trigger.
    if (screenSelected == perkScreen) {
      //change screen to perk selection screen.
      entrySelected = 0;
      screenSelected = perkSelectionScreen;
      currentPerk = null;
    } else if (screenSelected == perkSelectionScreen) {
      togglePerkEnabled();
    } else {
      //toggle configuration mode on special/skills screens
      configMode = !configMode;
      Pip.removeListener('knob1', handleKnob1);
      Pip.on('knob1', handleKnob1Config);
      registeredKnob1Func = handleKnob1Config;
    }
  } else {
    //then, we need to change our position in the list.
    entrySelected -= dir; //-1 is scroll down, but our list increases numerically. so we need to subtract
    currentPerk = null;
    if (entrySelected < 0) {
      entrySelected = loadedListMax - 1;
      if (loadedListMax > entryListDisplayMax) {
        lastReload = null; //always reload page if wrapping.
      }
    } else if (entrySelected >= loadedListMax) {
      entrySelected = 0;
    }
    if (dir > 0 && lastReload - 1 == entrySelected) {
      //scrolling up, so e.g. 6 -> 5
      lastReload = null;
    } else if (
      entrySelected % entryListDisplayMax == 0 &&
      entrySelected != lastReload
    ) {
      lastReload = null; //reset lastReload value, that's our cue that we need to pull from SD card.
    }
  }
}

function handleKnob2(dir) {
  //first, play the click.
  Pip.knob2Click(dir);
  //if switching screens we need to boot immediately out of config without saving.
  configMode = false;
  //then switch stats screen.
  if (screenSelected == perkSelectionScreen) {
    //if scrolling away from perk selection screen, save changes and reset to perk screen.
    saveNewPerkSelection();
    screenSelected = perkScreen;
  } else {
    screenSelected += dir;
  }
  entrySelected = 0; //reset to top of list
  currentPerk = null;
  lastReload = null;
  if (screenSelected > maxScreen) {
    screenSelected = 0;
  } else if (screenSelected < 0) {
    screenSelected = maxScreen;
  }
}

function handleTorch() {
  gracefulClose();
  torchButtonHandler();
}

function powerHandler() {
  gracefulClose();
}

function gracefulClose() {
  //shut down interval triggers first in case one fires while we're tearing down
  clearInterval(intervalId);
  Pip.removeListener('knob1', registeredKnob1Func);
  Pip.removeListener('knob2', handleKnob2);
  Pip.removeListener('torch', handleTorch);
  E.reboot(); //we're using too much memory, we gotta full reboot now.
}

//SECTION: main entry point

let loadedListMax = 0;
let entrySelected = 0;
let screenSelected = 0;
let pointsOfSelected = 0;
let drawing = false;
let configMode = false;
let allPerks = [];
let enabledPerks = [];
let displayedPerks = []; //contains title and filename.
let currentPerk = null; //contains all data
let lastReload = null;
let registeredKnob1Func = handleKnob1;

Pip.on('knob1', registeredKnob1Func);
Pip.on('knob2', handleKnob2);
Pip.on('torch', handleTorch);

setWatch(powerHandler, BTN_POWER, { repeat: false });

let intervalId = setInterval(() => {
  checkMode();
  if (Pip.mode == 2) {
    draw();
  } else {
    gracefulClose();
  }
}, 16);
