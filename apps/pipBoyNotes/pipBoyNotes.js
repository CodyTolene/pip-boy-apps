let pbkb = require('pbkb').initKeyboard();

try {
  pbkb.assembledString = fs.readFileSync('USER/note.txt');
} catch {}

//main loop of the keyboard library. This draws to the whole screen and clears all
//input on knob1 - so make sure not to draw or attach to knob1 before pbkb.finished == true!
pbkb.textEntryLoop();

let intervalId = setInterval(() => {
  if (pbkb.finished) {
    fs.writeFileSync('USER/note.txt', pbkb.assembledString);
    clearInterval(intervalId);
    delete pbkb;
    showMainMenu();
  }
}, 50);
