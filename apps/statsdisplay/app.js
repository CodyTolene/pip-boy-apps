const perkFiles = [
  'perk_actionboy.json',
  'perk_actiongirl.json',
  'perk_blackwidow.json',
  'perk_cannibal.json',
  'perk_cherchez.json',
  'perk_childatheart.json',
  'perk_comprehension.json',
  'perk_computerwhiz.json',
  'perk_confirmedbachelor.json',
  'perk_educated.json',
  'perk_entomologist.json',
  'perk_fortunefinder.json',
  'perk_foureyes.json',
  'perk_friendofthenight.json',
  'perk_heaveho.json',
  'perk_hunter.json',
  'perk_intensetraining.json',
  'perk_ladykiller.json',
  'perk_missfortune.json',
  'perk_mysteriousstranger.json',
  'perk_radchild.json',
  'perk_rapidreload.json',
  'perk_retention.json',
  'perk_runngun.json',
  'perk_stealthgirl.json',
  'perk_swiftlearner.json',
  'perk_weaponhandling.json',
];

const skillFiles = [
  'skill_barter.json',
  'skill_energyweapons.json',
  'skill_explosives.json',
  'skill_guns.json',
  'skill_lockpicks.json',
  'skill_medicine.json',
  'skill_meleeweapons.json',
  'skill_repair.json',
  'skill_science.json',
  'skill_sneak.json',
  'skill_speech.json',
  'skill_survival.json',
  'skill_unarmed.json',
];

const specialFiles = [
  'special_strength.json',
  'special_perception.json',
  'special_endurance.json',
  'special_charisma.json',
  'special_intelligence.json',
  'special_agility.json',
  'special_luck.json',
];

//SECTION: consts
const eldm = 6;
const cldm = 18;
const ccdm = 9; //half of config display max
const toy = 22;
const pixm = 167;
const piym = 153;
const cb = 0;
const cg = 2;
const cw = 3;
const ms = 2;
const ps = 2;
const ss = 1;
const sps = 0;
const pss = 3;
const statsDisplayFile = 'USER/stats_display.json';

function nD(d) {
  if (imv && d.endsWith('/')) {
    return d.slice(0, -1);
  }
  if (!imv && !d.endsWith('/')) {
    return d + '/';
  }
  return d;
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
  if (dr) return;
  dr = true;
  bC.clear();
  if (scs == ps || scs == ss || scs == sps) {
    bS();
  } else if (scs == pss) {
    bPSS();
  }
  dr = false;
}

function bS() {
  if (lr == null) {
    dp = [];

    let fi = [];
    if (scs == ps) {
      fi = ep;
    } else if (scs == ss) {
      fi = skillFiles;
    } else if (scs == sps) {
      fi = specialFiles;
    } else {
      console.log('Unknown section in bS, skipping');
      return;
    }

    llm = fi.length;
    if (llm == 0) {
      dES();
      return;
    }

    let elm = Math.min(eldm, llm);
    let a = 0;
    while (es >= elm) {
      a++;
      elm = Math.min(eldm * (a + 1), llm);
    }

    for (let i = a * eldm; i < elm; i++) {
      let f = fi[i];
      let fullPath = 'USER/' + f;
      let fis;
      try {
        fis = fs.readFileSync(fullPath);
      } catch (e) {
        console.log('Skipping unreadable file:', fullPath, e);
        continue;
      }
      let fo;
      try {
        fo = JSON.parse(fis);
      } catch (e) {
        console.log('Invalid JSON in file:', fullPath, e);
        continue;
      }
      dp.push({
        t: fo.t,
        fn: f,
        en: i,
        p: fo.p || 0,
      });
    }
    lr = es;
  }

  if (cp == null && dp.length > 0) {
    let cpi = es % 6;
    if (!dp[cpi]) {
      console.log('Invalid dp index in bS:', cpi);
      return;
    }
    let f = dp[cpi].fn;
    let fp = 'USER/' + f;
    try {
      let fis = fs.readFileSync(fp);
      cp = JSON.parse(fis);
    } catch (e) {
      console.log('Error loading currentPerk file:', fp, e);
      cp = null;
    }
  }

  for (let i = 0; i < dp.length; i++) {
    let po = dp[i];
    if (po.en == es) {
      dE(cp);
      dSEO(i);
      if (!cm && scs != ps) {
        pos = po.p;
      }
    }
    dET(po.t, i, po.en == es);
    if (scs != ps) {
      dEP(po.p, i, po.en == es);
    }
  }
}

function bPSS() {
  if (ap.length == 0) {
    gPCL();
  }
  //ok, now for each element in allPerks, we draw it.
  //I think we can draw two columns of 8 ts, so sixteen on screen
  //at a time. Then scroll further and it's a new screen of sixteen.
  let elm = Math.min(cldm, llm);
  let a = 0;
  while (es >= elm) {
    a++;
    //We're beyond the number of entries we can see on one page.
    //We need to get the next set of files and display them
    elm = Math.min(cldm * (a + 1), llm);
  }
  let col = 0;
  for (i = a * cldm; i < elm; i++) {
    if (i != a * cldm && i % ccdm == 0) {
      col = 1;
    }
    let p = ap[i];
    if (i == es) {
      dSEOC(i % cldm, col);
    }
    dETC(p.t, i % cldm, i == es, col, ep.includes(p.fn));
  }
}

function gPCL() {
  ap = [];
  let fi = perkFiles;
  llm = fi.length;

  for (let f of fi) {
    let fp = 'USER/' + f;
    let fis;
    try {
      fis = fs.readFileSync(fp);
    } catch (e) {
      console.log('Skipping missing perk file:', fp, e);
      continue;
    }
    let fo;
    try {
      fo = JSON.parse(fis);
    } catch (e) {
      console.log('Skipping invalid JSON perk file:', fp, e);
      continue;
    }
    let perkObj = { fn: f, t: fo.t };
    ap.push(perkObj);
  }
}

//SECTION: Element Drawing

function dES() {
  bC.setFontMonofonto18();
  bC.setColor(cw);
  bC.drawString('No Perks selected, press wheel to configure.', 2, 100);
}

function dE(po) {
  dEI(po.i, po.x, po.y);
  dED(po.d);
}

function dEI(i, x, y) {
  //so we want to try and draw as central as possible.
  //our 'window' for how big the perk can be is 167x153 (y truncated for the desc at the bottom)
  //to figure out how to centre the image we need to get the difference
  //between the size of the image and our window, halve it, and add it on
  //to the location.
  let xo = Math.floor((pixm - x) / 2);
  let yo = Math.floor((piym - y) / 2);
  bC.setColor(cg);
  bC.drawImage(
    {
      width: x,
      height: y,
      bpp: 1,
      buffer: require('heatshrink').decompress(atob(i)),
    },
    200 + xo,
    0 + yo,
  );
}

function dET(t, i, s) {
  bC.setFontMonofonto18();
  if (s) {
    bC.setColor(cb);
  } else {
    bC.setColor(cw);
  }
  bC.drawString(t, 10, toy * i + 5);
}

function dETC(t, i, s, c, e) {
  bC.setFontMonofonto18();
  let ft = '';
  if (e) {
    ft = t + ' *';
  } else {
    ft = t;
  }
  if (s) {
    bC.setColor(cb);
  } else {
    bC.setColor(cw);
  }
  if (c == 0) {
    bC.drawString(ft, 10, toy * i + 5);
  } else {
    bC.drawString(ft, 210, toy * (i - ccdm) + 5);
  }
}

function dEP(p, i, s) {
  //drawEntryPoints(points, i, selected)
  bC.setFontMonofonto18();
  if (s) {
    bC.setColor(cb);
  } else {
    bC.setColor(cw);
  }
  if (cm && s) {
    bC.fillPoly([129, toy * i + 12, 140, toy * i + 12, 135, toy * i + 5]);
    bC.fillPoly([141, toy * i + 12, 151, toy * i + 12, 146, toy * i + 17]);
    bC.drawString(pos, 160, toy * i + 5);
  } else {
    bC.drawString(p, 160, toy * i + 5);
  }
}

function dED(d) {
  bC.setFontMonofonto14();
  bC.setColor(cw);
  bC.drawString(d, 10, 150);
}

function dSEO(i) {
  bC.setColor(cw);
  bC.fillRect(5, toy * i + 1, 190, toy * i + 23);
}

function dSEOC(i, c) {
  bC.setColor(cw);
  if (c == 0) {
    bC.fillRect(5, toy * i + 1, 190, toy * i + 23);
  } else {
    bC.fillRect(205, toy * (i - ccdm) + 1, 390, toy * (i - ccdm) + 23);
  }
}

//SECTION: config saving

function sF() {
  if (es % eldm >= dp.length) {
    console.log('Invalid entrySelected index');
    return;
  }
  let f = dp[es % eldm].fn;
  let fts = 'USER/' + f;

  let fis;
  try {
    fis = fs.readFileSync(fts);
  } catch (e) {
    console.log('Error reading file to save:', fts, e);
    return;
  }

  let fo;
  try {
    fo = JSON.parse(fis);
  } catch (e) {
    console.log('Error parsing JSON in file to save:', fts, e);
    return;
  }

  fo.p = pos;
  fis = JSON.stringify(fo);

  try {
    fs.writeFile(fts, fis);
  } catch (e) {
    console.log('Error writing file:', fts, e);
  }

  // update in-memory data
  dp[es % eldm].p = pos;
  cp = fo;
}

function sNV() {
  if (scs == sps || scs == ss) {
    sF();
  }
}

function sNPS() {
  try {
    let json = JSON.stringify({ enabled: ep });
    fs.writeFile(statsDisplayFile, json);
  } catch (e) {
    console.log('Failed to save stats_display.json:', e);
  }
}

function tPE() {
  let po = ap[es];
  let idx = ep.indexOf(po.fn);
  if (idx >= 0) {
    ep.splice(idx, 1);
  } else {
    ep.push(po.fn);
  }
  sNPS();
}

//SECTION: Button handlers

function hK1C(d) {
  //first, play the click.
  Pip.knob1Click(d);

  if (d == 0) {
    //pressed in, this is the config trigger.
    //toggle configuration mode on special/skills screens
    cm = !cm;
    sNV();
    Pip.removeListener('knob1', hK1C);
    Pip.on('knob1', hK1);
    rk1f = hK1;
  } else {
    pos += d;
    if (pos < 0) {
      pos = 100;
    } else if (pos > 100) {
      es = 0;
    }
  }
  draw();
}

function hK1(d) {
  //first, play the click.
  Pip.knob1Click(d);

  if (d == 0) {
    //pressed in, this is the config trigger.
    if (scs == ps) {
      //change screen to perk selection screen.
      es = 0;
      scs = pss;
      cp = null;
    } else if (scs == pss) {
      tPE();
    } else {
      //toggle configuration mode on special/skills screens
      cm = !cm;
      Pip.removeListener('knob1', hK1);
      Pip.on('knob1', hK1C);
      rk1f = hK1C;
    }
  } else {
    //then, we need to change our position in the list.
    es -= d; //-1 is scroll down, but our list increases numerically. so we need to subtract
    cp = null;
    if (es < 0) {
      es = llm - 1;
      if (llm > eldm) {
        lr = null; //always reload page if wrapping.
      }
    } else if (es >= llm) {
      es = 0;
    }
    if (d > 0 && lr - 1 == es) {
      //scrolling up, so e.g. 6 -> 5
      lr = null;
    } else if (es % eldm == 0 && es != lr) {
      lr = null; //reset lastReload value, that's our cue that we need to pull from SD card.
    }
  }
  draw();
}

function hK2(d) {
  //first, play the click.
  Pip.knob2Click(d);
  //if switching screens we need to boot immediately out of config without saving.
  cm = false;
  //then switch stats screen.
  if (scs == pss) {
    //if scrolling away from perk selection screen, save changes and reset to perk screen.
    sNPS();
    scs = ps;
    ap = [];
  } else {
    scs += d;
  }
  es = 0; //reset to top of list
  cp = null;
  dp = [];
  lr = null;
  if (scs > ms) {
    scs = 0;
  } else if (scs < 0) {
    scs = ms;
  }
  draw();
}

function hT() {
  gC();
  torchButtonHandler();
}

function pH() {
  gC();
}

function gC() {
  //shut down interval triggers first in case one fires while we're tearing down
  clearInterval(intervalId);
  Pip.removeListener('knob1', rk1f);
  Pip.removeListener('knob2', hK2);
  Pip.removeListener('torch', hT);

  E.reboot(); //we're using too much memory, we gotta full reboot now.
}

//SECTION: main entry point

let llm = 0;
let es = 0;
let scs = 0;
let pos = 0;
let dr = false;
let cm = false;
let ap = [];
try {
  let sd = fs.readFileSync(statsDisplayFile);
  ep = JSON.parse(sd).enabled || [];
} catch (e) {
  console.log('No stats_display.json or invalid JSON. Starting fresh.');
  ep = [];
}
let dp = []; //contains t and filename.
let cp = null; //contains all data
let lr = null;
let rk1f = hK1;
let imv = false;

try {
  let s = require('Storage');
  let l = s.list();
  if (l.includes('VERSION') && l.includes('.bootcde')) {
    let vs = s.read('VERSION') || '';
    let vn = parseFloat(vs);
    imv = vn >= 1.29;
  }
} catch (e) {
  console.log('Unable to determine JS version:', e);
}

Pip.on('knob1', rk1f);
Pip.on('knob2', hK2);
Pip.on('torch', hT);

setWatch(pH, BTN_POWER, { repeat: false });

draw(); //do initial draw to setup buffers.

let intervalId = setInterval(() => {
  checkMode();
  if (Pip.mode == 2) {
    bH.flip();
    bF.flip();
    bC.flip();
  } else {
    gC();
  }
}, 16);
