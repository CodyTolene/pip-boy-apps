const eldm = 6,
  cldm = 18,
  ccdm = 9,
  toy = 22,
  pixm = 167,
  piym = 153,
  cb = 0,
  cg = 2,
  cw = 3,
  ms = 2,
  ps = 2,
  ss = 1,
  sps = 0,
  pss = 3,
  epf = 'USER/StatsDisplay/PERKS/ENABLED/',
  apf = 'USER/StatsDisplay/PERKS/ALL/',
  sf = 'USER/StatsDisplay/SKILLS/',
  spf = 'USER/StatsDisplay/SPECIAL/';
function nD(e) {
  return imv && e.endsWith('/')
    ? e.slice(0, -1)
    : imv || e.endsWith('/')
      ? e
      : e + '/';
}
function draw() {
  dr ||
    ((dr = !0),
    bC.clear(),
    scs == ps
      ? bS(epf)
      : scs == ss
        ? bS(sf)
        : scs == sps
          ? bS(spf)
          : scs == pss && bPSS(),
    (dr = !1));
}
function bS(s) {
  if (null == lr) {
    var t;
    dp = [];
    try {
      t = fs.readdirSync(nD(s));
    } catch {
      fs.mkdir(nD(s)), (t = fs.readdirSync(nD(s)));
    }
    if (
      ((t = t.filter((e) => '.' !== e && '..' !== e)),
      imv &&
        (t = t.filter((n) => {
          try {
            return !fs.statSync(nD(s) + '/' + n).isDirectory;
          } catch (e) {
            return console.log('Skipping bad file or folder:', n), !1;
          }
        })),
      (llm = t.length),
      0 == t.length)
    )
      return void dES();
    let e = Math.min(eldm, llm),
      n = 0;
    for (; es >= e; ) n++, (e = Math.min(eldm * (n + 1), llm));
    for (let o = n * eldm; o < e; o++) {
      var l = t[o],
        i = nD(s) + '/' + l;
      let e;
      try {
        e = fs.readFileSync(i);
      } catch (e) {
        console.log('Skipping unreadable file:', i, e);
        continue;
      }
      let n;
      try {
        n = JSON.parse(e);
      } catch (e) {
        console.log('Invalid JSON in file:', i);
        continue;
      }
      scs != ps
        ? dp.push({ t: n.t, fn: l, en: o, p: n.p })
        : dp.push({ t: n.t, fn: l, en: o });
    }
    lr = es;
  }
  if (null == cp) {
    var n = es % 6,
      n = dp[n].fn,
      n = nD(s) + '/' + n;
    try {
      var e = fs.readFileSync(n);
      cp = JSON.parse(e);
    } catch (e) {
      console.log('Error loading currentPerk file:', n, e), (cp = null);
    }
  }
  for (let e = 0; e < dp.length; e++) {
    var o = dp[e];
    o.en == es && (dE(cp), dSEO(e), cm || scs == ps || (pos = o.p)),
      dET(o.t, e, o.en == es),
      scs != ps && dEP(o.p, e, o.en == es);
  }
}
function bPSS() {
  0 == ap.length && gPCL();
  let e = Math.min(cldm, llm),
    n = 0;
  for (; es >= e; ) n++, (e = Math.min(cldm * (n + 1), llm));
  let o = 0;
  for (i = n * cldm; i < e; i++) {
    i != n * cldm && i % ccdm == 0 && (o = 1);
    var s = ap[i];
    i == es && dSEOC(i % cldm, o),
      dETC(s.t, i % cldm, i == es, o, ep.includes(s.fn));
  }
}
function gPCL() {
  var e, n, o;
  try {
    e = fs.readdirSync(nD(epf));
  } catch {
    fs.mkdir(epf), (e = fs.readdirSync(nD(epf)));
  }
  for (n of (e = e.filter((e) => '.' !== e && '..' !== e))) ep.push(n);
  try {
    e = (e = fs.readdirSync(nD(apf))).filter((e) => '.' !== e && '..' !== e);
  } catch {
    console.log('ERROR: Missing ALL perk folder!'), (e = []);
  }
  llm = e.length;
  for (o of e) {
    var s = nD(apf) + '/' + o;
    let e;
    try {
      e = fs.readFileSync(s);
    } catch (e) {
      console.log('Skipping missing perk file:', s, e);
      continue;
    }
    let n;
    try {
      n = JSON.parse(e);
    } catch (e) {
      console.log('Skipping invalid JSON perk file:', s, e);
      continue;
    }
    s = { fn: o, t: n.t };
    ap.push(s);
  }
}
function dES() {
  bC.setFontMonofonto18(),
    bC.setColor(cw),
    bC.drawString('No Perks selected, press wheel to configure.', 2, 100);
}
function dE(e) {
  dEI(e.i, e.x, e.y), dED(e.d);
}
function dEI(e, n, o) {
  var s = Math.floor((pixm - n) / 2),
    t = Math.floor((piym - o) / 2);
  bC.setColor(cg),
    bC.drawImage(
      {
        width: n,
        height: o,
        bpp: 1,
        buffer: require('heatshrink').decompress(atob(e)),
      },
      200 + s,
      0 + t,
    );
}
function dET(e, n, o) {
  bC.setFontMonofonto18(),
    o ? bC.setColor(cb) : bC.setColor(cw),
    bC.drawString(e, 10, toy * n + 5);
}
function dETC(e, n, o, s, t) {
  bC.setFontMonofonto18();
  let l = '';
  (l = t ? e + ' *' : e),
    o ? bC.setColor(cb) : bC.setColor(cw),
    0 == s
      ? bC.drawString(l, 10, toy * n + 5)
      : bC.drawString(l, 210, toy * (n - ccdm) + 5);
}
function dEP(e, n, o) {
  bC.setFontMonofonto18(),
    o ? bC.setColor(cb) : bC.setColor(cw),
    cm && o
      ? (bC.fillPoly([129, toy * n + 12, 140, toy * n + 12, 135, toy * n + 5]),
        bC.fillPoly([141, toy * n + 12, 151, toy * n + 12, 146, toy * n + 17]),
        bC.drawString(pos, 160, toy * n + 5))
      : bC.drawString(e, 160, toy * n + 5);
}
function dED(e) {
  bC.setFontMonofonto14(), bC.setColor(cw), bC.drawString(e, 10, 150);
}
function dSEO(e) {
  bC.setColor(cw), bC.fillRect(5, toy * e + 1, 190, toy * e + 23);
}
function dSEOC(e, n) {
  bC.setColor(cw),
    0 == n
      ? bC.fillRect(5, toy * e + 1, 190, toy * e + 23)
      : bC.fillRect(205, toy * (e - ccdm) + 1, 390, toy * (e - ccdm) + 23);
}
function sF(o) {
  if (es % eldm >= dp.length) console.log('Invalid entrySelected index');
  else {
    var s = dp[es % eldm].fn,
      o = nD(o) + '/' + s;
    let e;
    try {
      e = fs.readFileSync(o);
    } catch (e) {
      return void console.log('Error reading file to save:', o, e);
    }
    let n;
    try {
      n = JSON.parse(e);
    } catch (e) {
      return void console.log('Error parsing JSON in file to save:', o, e);
    }
    (n.p = pos), (e = JSON.stringify(n));
    try {
      fs.writeFile(o, e);
    } catch (e) {
      console.log('Error writing file:', o, e);
    }
    (dp[es % eldm].p = pos), (cp = n);
  }
}
function sNV() {
  scs == sps ? sF(spf) : scs == ss && sF(sf);
}
function sEP(e) {
  var n = fs.readFileSync(nD(apf) + '/' + e);
  fs.writeFile(nD(epf) + '/' + e, n);
}
function sNPS() {
  let n;
  try {
    n = fs.readdirSync(nD(epf));
  } catch (e) {
    console.log('Enabled folder missing, creating...'),
      fs.mkdir(nD(epf)),
      (n = []);
  }
  n = n.filter((e) => '.' !== e && '..' !== e);
  for (let e = 0; e < ap.length; e++) {
    var o = ap[e];
    (ep.includes(o.fn) && n.includes(o.fn)) ||
      (ep.includes(o.fn) && !n.includes(o.fn)
        ? sEP(o.fn)
        : !ep.includes(o.fn) &&
          n.includes(o.fn) &&
          fs.unlink(nD(epf) + '/' + o.fn));
  }
  (ep = []), (ap = []);
}
function tPE() {
  var e,
    n = ap[es];
  ep.includes(n.fn) ? ((e = ep.indexOf(n.fn)), ep.splice(e, 1)) : ep.push(n.fn);
}
function hK1C(e) {
  Pip.knob1Click(e),
    0 == e
      ? ((cm = !cm),
        sNV(),
        Pip.removeListener('knob1', hK1C),
        Pip.on('knob1', hK1),
        (rk1f = hK1))
      : (pos += e) < 0
        ? (pos = 100)
        : 100 < pos && (es = 0),
    draw();
}
function hK1(e) {
  Pip.knob1Click(e),
    0 == e
      ? scs == ps
        ? ((es = 0), (scs = pss), (cp = null))
        : scs == pss
          ? tPE()
          : ((cm = !cm),
            Pip.removeListener('knob1', hK1),
            Pip.on('knob1', hK1C),
            (rk1f = hK1C))
      : ((es -= e),
        (cp = null),
        es < 0
          ? ((es = llm - 1), llm > eldm && (lr = null))
          : es >= llm && (es = 0),
        ((0 < e && lr - 1 == es) || (es % eldm == 0 && es != lr)) &&
          (lr = null)),
    draw();
}
function hK2(e) {
  Pip.knob2Click(e),
    (cm = !1),
    scs == pss ? (sNPS(), (scs = ps)) : (scs += e),
    (es = 0),
    (cp = null),
    (lr = null),
    scs > ms ? (scs = 0) : scs < 0 && (scs = ms),
    draw();
}
function hT() {
  gC(), torchButtonHandler();
}
function pH() {
  gC();
}
function gC() {
  clearInterval(intervalId),
    Pip.removeListener('knob1', rk1f),
    Pip.removeListener('knob2', hK2),
    Pip.removeListener('torch', hT),
    E.reboot();
}
Graphics.prototype.setFontMonofonto14 = function () {
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
    65550,
  );
};
let llm = 0,
  es = 0,
  scs = 0,
  pos = 0,
  dr = !1,
  cm = !1,
  ap = [],
  ep = [],
  dp = [],
  cp = null,
  lr = null,
  rk1f = hK1,
  imv = !1;
try {
  let o = require('Storage'),
    e = o.list();
  if (e.includes('VERSION') && e.includes('.bootcde')) {
    let e = o.read('VERSION') || '',
      n = parseFloat(e);
    imv = 1.29 <= n;
  }
} catch (e) {
  console.log('Unable to determine JS version:', e);
}
Pip.on('knob1', rk1f),
  Pip.on('knob2', hK2),
  Pip.on('torch', hT),
  setWatch(pH, BTN_POWER, { repeat: !1 }),
  draw();
let intervalId = setInterval(() => {
  checkMode(), 2 == Pip.mode ? (bH.flip(), bF.flip(), bC.flip()) : gC();
}, 16);
