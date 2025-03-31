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
  var files;
  try {
    files = require('fs').readdirSync(directory);
  } catch {
    require('fs').mkdir(directory);
    files = require('fs').readdirSync(directory);
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
  for (i = a * entryListDisplayMax; i < entryListMax; i++) {
    let file = files[i];
    let fileString = require('fs').readFileSync(directory + file);
    let fileObj = JSON.parse(fileString);
    if (i == entrySelected) {
      drawEntry(fileObj);
      drawSelectedEntryOutline(i % entryListDisplayMax);
      if (!configMode && screenSelected != perkScreen) {
        //only update pointsOfSelected when not actively configuring.
        pointsOfSelected = fileObj.points;
      }
    }
    drawEntryTitle(fileObj.title, i % entryListDisplayMax, i == entrySelected);
    if (screenSelected != perkScreen) {
      drawEntryPoints(
        fileObj.points,
        i % entryListDisplayMax,
        i == entrySelected,
      );
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
    files = require('fs').readdirSync(enabledPerkFolder);
  } catch {
    require('fs').mkdir(enabledPerkFolder);
    files = require('fs').readdirSync(enabledPerkFolder);
  }
  for (file of files) {
    enabledPerks.push(file);
  }
  files = require('fs').readdirSync(allPerkFolder);
  loadedListMax = files.length;
  for (file of files) {
    let fileString = require('fs').readFileSync(allPerkFolder + file);
    let fileObj = JSON.parse(fileString);
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
  let files = require('fs').readdirSync(directory);
  let fileToSave = directory + files[entrySelected];
  let fileString = require('fs').readFileSync(fileToSave);
  let fileObj = JSON.parse(fileString);
  fileObj.points = pointsOfSelected;
  fileString = JSON.stringify(fileObj);
  require('fs').writeFile(fileToSave, fileString);
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
  let fileString = require('fs').readFileSync(allPerkFolder + filename);
  require('fs').writeFile(enabledPerkFolder + filename, fileString);
}

function saveNewPerkSelection() {
  let enabledFiles = require('fs').readdirSync(enabledPerkFolder);
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
      require('fs').unlink(enabledPerkFolder + perk.filename);
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

function gracefulClose() {
  //shut down interval triggers first in case one fires while we're tearing down
  clearInterval(modeCheck);
  clearInterval(intervalId);
  Pip.removeListener('knob1', registeredKnob1Func);
  Pip.removeListener('knob2', handleKnob2);
  Pip.removeListener('torch', handleTorch);
  showMainMenu(); //this causes a brief flicker but if we don't do it the controls stop working.
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
  draw();
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
    if (entrySelected < 0) {
      entrySelected = loadedListMax - 1;
    } else if (entrySelected >= loadedListMax) {
      entrySelected = 0;
    }
  }

  draw();
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
  if (screenSelected > maxScreen) {
    screenSelected = 0;
  } else if (screenSelected < 0) {
    screenSelected = maxScreen;
  }
  draw();
}

function handleTorch() {
  gracefulClose();
  torchButtonHandler();
}

function ourModeHandler() {
  checkMode();
  if (Pip.mode != 2) {
    gracefulClose();
  }
}

function powerHandler() {
  gracefulClose();
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

Pip.on('knob1', handleKnob1);
let registeredKnob1Func = handleKnob1;
Pip.on('knob2', handleKnob2);
Pip.on('torch', handleTorch);
setWatch(powerHandler, BTN_POWER, { repeat: false });
draw();
let modeCheck = setInterval(ourModeHandler, 100);
let intervalId = setInterval(() => {
  if (Pip.mode == 2) {
    draw();
  } else {
    gracefulClose();
  }
}, 1000);
