if (Pip.removeSubmenu) Pip.removeSubmenu();
delete Pip.removeSubmenu;
if (Pip.remove) Pip.remove();
delete Pip.remove;

g.clear();
// create new Graphics instance
let G = Graphics.createArrayBuffer(400,308,2,{
  msb : true,
  buffer : E.toArrayBuffer(E.memoryArea(0x10000000 + 16384, (400*308)>>2))
});
G.clear();
G.flip = () => Pip.blitImage(G,40,7);
let W = G.getWidth();
let H = G.getHeight();

// handle knob inputs and removal
function onKnob1(dir) {
  if (dir) {
    gun.tx = E.clip(gun.tx - dir*10,20,380);
    gun.aim();
  } else gun.fire=1;
}
function onKnob2(dir) {
  gun.ty = E.clip(gun.ty - dir*10, 40, 210);
  gun.aim();
}
Pip.on("knob1", onKnob1);
Pip.on("knob2", onKnob2);
Pip.remove = function() {
  clearInterval(frameInterval);
  Pip.removeListener("knob1", onKnob1);
  Pip.removeListener("knob2", onKnob2);
};

let IM = {
  p : [ // buildings
    atob("HyMCAAQAAAABAAAA8AAAAA4AAALAAAAAOAAADwAAAADwAAAsAAAAA4AAAPAAAAAfAAAD0AAAAHwAAA9AAAAB8AAAPQAAAAfAAAD4AAAALwAAA/AAAAD8AAAPwAAAB/AAAH8AAAAv0AAD/wAAAP+AAA/sAAAHvgAAP7gAAD/8AAD/8AAC+/QAB//QAA6/0AA//dAA9/3AAd/jkAvK90APv87m93/fAf7/d23d/79L/////////y/////////8f////////+AA/AAAAC8AAAPgAAAAfAAAD4AAAALwAAC/AAAAD9AAVv1VVVV/lUf/////////H/////////y/////////9v/////////b/////////kA="), atob("HjACAAAAAAAAAAAAAACAAAAAAAAADgAAAAAAAADQAAAAAAAADgAAAAAAAAGkAAAAAAAAv+AAAAAAAC//gAAAAAAW//lAAAAAH////0AAABv////+QAAC//////QAAAb////pAAAAB////AAAAAAA+3wAAAAAAAu3gAAAAAAAf3QAAAAAAAP3AAAAAAAAP7AAAAAAAAP/AAAAAAAAP+AAAAAAAAP+AAAAAAAAL9AAAAAAAAP9AAAAAAAAP9AAAAAAAAP9AAAAAAAAP9AAAAAAAAPtAAAAAAAAf+AAAAAAAAeuAAAAAAAAuvAAAAAAAA9/AAAAAAAA+/AAAAAAAA//AAAAAAAA8vQAAAAAAA8vQAAAAAAC8vgAAAAAAC+/gAAAAAAD//wAAAAAADwfwAAAAAAHwvwAAAAAALwf0AAAAAarlv6pAAAA//////QAG////////kv////////9v////////+v////////+"),
atob("ICsCAAAMAAAAAAAAAFwAAAAAAAAB7pAAAAAAAAP/+QAAAAAAB//+AAAAAAAH//AAAAAAAAPe8AAAAAAAA83wAAAAAAGX1vqaKQAAA/vv//+/VAAH////////AAf///////9AG//rr6++//Au5VVVVVW+vL5WlWalWWm8eRvQb///9W65C5Bv///1fT+vlZ///Tv4H/+VVVVVb+ABv/qVZa/tQAAH++A7+0AAAAfX+X/kAAAAA8D75AAAAAADwPFAAAAAAAfB8AAAAAAAA8XwAAAAAAAD1fAAAAAAAAPV8AAAAAAAA9DwAAAAAAAH1PAAAAAAAAfU8AAAAAAAB8XwAAAAAAAHwfAAAAAAAAPB8AAAAAAAA9XwAAAAAAAD1fAAAAAAAAPV8AAAAAAAB9XwAAAAAAAH0PAAAAAAABfR9QUAAAC/////////0P/////////l/////////+o="),
atob("IB4CAAAAAAAAAAAAGpAAAAAAAAC//wAAAAAAAf//QAAAAAAD///AAAAAAAteL9AAAAAAL3+f9VUAAAA/+////oAAAD/3////0AAAf///3//0AAC///9fvvQAAH///z//+UAAP9VWf/7/8AA/0Af//v/0AC//////6/xQH//////n/rgP////+Ub//Q//////6//9D/////////0P/////////g///////6/9H/////////8P///////v/h//////////H/////////8f/////////g//////////D/////////5f/////////m/////////+"),
atob("GzgCAAAAIAAAAAAAAMAAAAAAAAtAAAAAAAA/AAAAAAAA/AAAAAAAB/QAAAAAAHq0AAAAAAHqwAAAAAAL/4AAAAAAP/8AAAAAAP/8AAAAAAL70AAAAAALq0AAAAAALn4AAAAAAGVkAAAAAAPV8AAAAAAP/8AAAAAAf/9AAAAAAv/9AAAAAAf/9AAAAAAu79AAAAAAv/+AAAAAA///QAAAAC///gAAAAB+/vgAAAAB6/bQAAAAB53bQAAAAB53bQAAAAB57bQAAAAB6/rQAAAAC///gAAAAC+7vgAAAAD///wAAAAD///wAAAAD///wAAAAD///wAAAAD+7vgAAAAD///wAAAAD+7vwAAAAD///wAAAAD///wAAAAD///wAAAAH+3rwAAAAP53b8AAAAP///8AAAAPVVV8AAAAOaqpsAAAAf///9AAAD/vR+/wAAD9fR9fwAAA/////AAAA+vq+vAAAB+vq+vQAVX/////1V//////////////////"),
atob("HSECAAAAfkAAAAAAAa+pAAAAAAL//9AAAAAD/lf+AAAAAf4AP9AAAAL9AAL8AAAA/wAAP4AAAL8AAAfwAAA/QAAA/gAAH8AAAA/AAA/QAAAD/AAD8AAAAL8AA/wAAAAPwAD9AAAAAvgAfwAAAAB/AC+AAAAAD9AP4AAUAAP0A/AAD4AAvwH8AAPQAB/AvwAB/AAD8C+AAP9AAP0P4AB/8AA/Q/QAPq0AD+D9AAqqQAL4PwADv+AAvw/AKv/6oB/D8B////0H8Px/////9fw/H/////1/H9f/////n9/////////////////////////////A"),
atob("HSwCAAAAAAAAAAAsAAAAAAAAD4AAAAAAAAfwAAAAAAAC/QAACAAAAL9AAAJAAAA/4AAC8AAAC/QAALkAAAP+AAB/gAAAv0AACZAAAD/QAAO0AAAP+AAC/wAAAv0AAaqQAAD/gAL//gAAL9ABqqqgAA/4AL+r/QAD/gC///+AAP+AKqqqpAA/4B////4AC/QCqqqqQAP+Af///9AA/4HuqqqtAD/gfqqqr0AP+C/////gA/4HqqqqtAD/gf6qqv4AP+B6lVWrQA/4HqVVqtAD/gv/qvv4AP+C6qqqrgB/9X/////QP//////79F////////0f////////Q///////qpB//v/////0H/+7///qqQf/7v//+/9L////////+v//////qqr/////////////////qu///////////////////w=="),
atob("HDECAAAAAAAAAAB/AAAAAAAA/wAAAAAAAP0AAAAAAADsAAAAAAAA7QAAAAAAALwAAAAAAAB8AAAAAAAAfACAAAAAAHwZ+wAAAAA9Hv8AAAAAPg//gAAAAD9P/0AAAAAfz/0AAAAAD6f9AAAAAA/r/QAAAAAP//9AAAAAH///pAAAAB////wAAAAL///++QAAA/////8AAAP/////AAAD////7gAAAf///+0AAAHv///tAAAAf////AAAAf////QAAAH///9AAAAD////AAAAA////QAAAAP///wAAAAC///sAAAAAP//7AAAAAH//30AAAAC//89AAAAA///fQAAAAG///wAAAAAP//8AAAAAD//+AAAAAB///5AAAAP////0AAAP/////QAAD/////0AAA/////9AAAf/+u//QAAf//7//9AKr//+///qr//////////////////w==")
    ],      plane:atob("IRgCAAAAAAAAAAAAAAAAAAZAAAAAAAAAH/AAAAAAAAAf/AAAAAAAAAv/AAAAAAAAC+9AAAAAAAAH/4AAAAAAAAv/0AUAAAAAC//wB/AAFVUH//QH/QFv7/f//AP/+b///v/9Af////////////+f/////////0H/////////QAa///////9AAABv//pUf0AAAB//gAAHQAAAH/+AAAAAAAAL/0AAAAAAAAf+QAAAAAAAB/8AAAAAAAAD/QAAAAAAAAC8AAAAAAAA"),
gun:atob("JDICAAAAAetAAAAAAAAAA//QAAAAAAAAC//wAAAAAAAAC+vwAAAAAAAAD//wAAAAAAAAB//gAAAAAAAAB//QAAAAAAAYD//wFAAAAAA9D+vwfAAAAAA/T0Hx/AAAAAB/T0Hh/QAAAAD/T0Hx/wAAABb/T0Hx/2AAAB//T0Hx/+gAAP7/b0H5/34AAaR/f0H9/RpAA9A/v0H+/AtABoD/f1X9/wGQB4D/v1X+/wLQBkD9v//9fwHgAYD9f779fwGgA6B9v//+fQKQAKB/f//9/QHQAOT/X//1/wLgAH3/3//3/0fQAGX/3//3/0KAAGn/3//3/1aUv///////////////////////////////////////////////aqqr////6qqpAAAH/gC/0AAAAAAH+AAf0AAAAAAH9AAf0AAAAAAH9AAf0AAAAAAH9AAf0AAAAAAH9AAP0AAAAAAH9AAf0AAAAAAH9AAP0AAAAAAH9AAf0AAAAAAH9AAf0AAAAAAH9AAf0AAAAAAH9AAf4AAAAAAH9AAf0AAAAAAH+EEf4AAAAAAH/1H/4AAAaqqr////+qqp////////////b//////////5"),
  gunend:atob("CA8CAAAAAAfQD/AP8AfQD/AP8A/wD/AH0B/4P/3///+/"),
  bomb:atob("CRICAAAAEAB9AG/0L/0H/gD/QD/QD/QD/QC/QD/gC/QB/AB/AAtAAEAAAAA="),
  ammo:atob("BQsCLg/H+f6/3+f4/X9/+7g="),
  missile:atob("CRQCAuAA/AB/gB/gC/wB/gB/gA/QB/QD/wC7gAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
   boom:atob("FhYCAAb/5QAABv//9AAB////8AC//qv/wB/+qq/+A/6qqqv4f6pVWq/P+pVVav3/qVVWr//qVQVa//6lQFWr/6lUAVa/+pVQVav/6VVVar7/qVVar8P+qVar/D/qqqq/QP6qqq/gA/+qr/gAD////gAAL///QAAAG/4AAA=="),
  nuket:atob("LRwCAAAAAAAAAAAAAAAAAAAAL//QAAAAAAAAAAAf//kBAAAAAAAAAB9BR+/0AAAAAAAb/8AAL//0AAAAAG//+QAAAv8AAAAAv///8AAAAvAAAAB/0AH9AEAAfAAAAD9AAA/AAAAfkAAAH4AAAfQAAH//0AALwAAAPgAAf//9AAL1UAAHQAA/QBvAAP//kADAAC+AAPgAv/V/AAAAD0AAHwC/kAfwAAADwAAD0D9AAH0AH+SwAAH0P0AAD4AL/8B+QPwP0AAD4AAH+A/1vwH0AQAQAAAvgD//AD0H8AAAAAfgB/0AD9vQEAAAAPgA+AAAv9A+B0AAfQB9AAAH8A/m9AA/QH8AAAB9AL//gb///0AAAA/QH///////QAAAAf//9H//5VUAAAAAH//0BGkQAAAAAAAAG5AAAAAAAAAA"),
  nukeb:atob("Hj4CAAAEEAAAAAAAANcAUAAAAAAONA4AAAAWqNNAq6qQP//vNA76/++/+adA2//f9////v///fL////+///0Ab//////5AAAALdA0AAAAAAHNAwAAAAAAHdA0AAAAAAHdAwAAAAAADcAwAAAAAADQBwAAAAAADABwAAAAAADQRwAAAAAADQBwAAAAAADQCwAAAAAADQCwAAAAAADRCgAAAAAADgDwAAAAAADQCgAAAAAADgDwAAAAAADgDgAAAAAADQCgAAAAAADwDgAAAAAACgCQAAAAAADwDgAAAAAADwDQAAAAAACgDQAAAAAADwDQAAAAAABgDQAAAAAACwDQAAAAAACwDQAAAAAACwDQAAAAAACwDQAAAAAABgDAAAAAAACwDAAAAAAABwDAAAAAAABwDAAAAAAACwDAAAAAAABwDAAAAAAACwDAAAAAAABwDAAAAAAABwDAAAAAAABwDAAAAAAABwDAAAAAAABwHAAAAAAABwDAAAAAAABwHAAAAAAABwHAAAAAAABwHAAAAAAABwDAAAAAAABgCAAAAAAABwHAAAAAAABkGAAAAAAABQFAAAAAAABQFAAAAAAABQBAAAAAAABQBAAAAAAAAAAAAAA")
};
let build = [];

function initBuildings() {
  build=[];
  for (var i=0;i<8;i++) {
    var p = (i<4)?i:i+1.5; // space for gun
    var im = G.imageMetrics(IM.p[i]);
    var x = 22 + p*42 - (im.width>>1);
    build.push({
      im : IM.p[i],
      w : im.width,
      x : x,
      x2 : x+im.width,
      y : 288-im.height
    });
  }
}
initBuildings();
let gun = { x:203, y:262, r : 0, fire:0, tx:200, ty:100,
          aim:function(){this.r=Math.atan2(this.tx-this.x, this.y-this.ty)}};
let bombs = [
/* {
  x,y,  // pos
  r,    // rotation in rads
  vx,vy // vel/frame
  ix,iy // initial pos
  life  // lifetime in frames before in splits
} */
];
let newBombs = [];
let nuke = [/* { x, frame} */];
let missile = undefined;
let lines = []; // [x1,y1,x2,y2];
let score = { score : 0, lvl:0, nuke:0, ammo:8 }
let TOP = 20;
let BLDGTOP = build.reduce((v,b)=>Math.min(b.y,v),H); // top of buildings
let FLOOR = 288;
let BOOMSIZE = 30;
let BOOMLIFE = 10;

function newBomb(last) {
  if (bombs.length>15) return;
  var bm = last ? { x:last.x, y:last.y, life:100000 } : {
    x : Math.randInt(400),
    y : TOP+5,
    life : 0|(20 + Math.randInt(100))
  };
  bm.r = Math.random()-0.5;
  if (last) {
    bm.r += last.r;
    bm.jx = last.ix;
    bm.jy = last.iy;
  }
  bm.vx = -Math.sin(bm.r);
  bm.vy = Math.cos(bm.r);
  bm.ix = bm.x;
  bm.iy = bm.y;
  newBombs.push(bm);
}

Math.dist = function(dx,dy) {
  return Math.sqrt(dx*dx+dy*dy);
}

function drawBuildings() {
  G.clearRect(0,BLDGTOP,399,H-1);
  G.setColor(2).drawRect(0,288,399,290).drawRect(0,306,399,307).setColor(3);
  build.forEach((b,i) => G.drawImage(b.im,b.x, b.y));
  G.drawImage(IM.gun, gun.x-18,gun.y-3);
  drawAmmo();
}

function drawScore() {
  G.clearRect(0,0,399,19).setFontMonofonto18().setFontAlign(0,-1);
  G.drawString("LVL: "+score.lvl,75,0);
  G.drawString("NUKE: "+score.nuke,325,0);
  G.drawString("SCORE: "+score.score,200,0);
}

function drawAmmo() {
  if (score.ammo>1) G.drawImage(IM.ammo, gun.x-2,FLOOR+5);
  for (var i=1;i<score.ammo;i++) {
    var side = i&1;
    var x = (gun.x+1) + (-1+2*side)*(10+(i>>1)*8);
    print(x);
    G.drawImage(IM.ammo, x,FLOOR+5);
  }
}

function drawAll() {
  G.clear(1);
  drawScore();
  drawBuildings();  
}

let redrawBuildings, redrawScore;

function onFrame() {  
  // clear main area  
  G.clearRect(0,TOP,399,BLDGTOP);
  // missile movement
  if (gun.fire && !missile && score.ammo) {
    score.ammo--;redrawBuildings=1;
    missile = {
      x : gun.x,
      y : gun.y,
      r : gun.r,
      d : 0, // current distance
      md : Math.dist(gun.x-gun.tx,gun.y-gun.ty)-10, // max distance 
      v : 5,
      vx : Math.sin(gun.r)*5,
      vy : -Math.cos(gun.r)*5
    };
    missile.x += missile.vx*2;
    missile.y += missile.vy*2;
  }
  gun.fire = false;
  if (missile) {
    missile.x += missile.vx;
    missile.y += missile.vy;
    missile.d += missile.v;
    if (missile.d >= missile.md) { // distance set
      missile.vx=0;
      missile.vy=0;
      missile.boom = (0|missile.boom)+1;
      missile.rad = BOOMSIZE+missile.boom*2;
    }
    if (missile.x<0 || missile.x>400 || missile.y<0 || missile.y>FLOOR || missile.boom>BOOMLIFE) {
      missile = undefined;
    }
  }  
  // Bombs
  bombs = bombs.filter(bm=>{
    bm.x+=bm.vx;
    bm.y+=bm.vy;
    if (bm.x<0 || bm.x>400) {
      if (bm.y>BLDGTOP) redrawBuildings = 1;
      return false;
    }
    if (bm.y>FLOOR) {
      redrawBuildings = 1;
      return false;
    }
    if (missile && missile.boom) {
      let d = Math.dist(missile.x-bm.x,missile.y-bm.y);
      if (d<missile.rad) { // hit by missile
        score.score++;redrawScore=1;
        return false; // remove bomb
      }
    }
    if (bm.y>BLDGTOP) { // if it's approaching buildings..
      redrawBuildings = 1;
      if (build.some((b,i) => {
        if (bm.y<b.y || bm.x<b.x || bm.x>b.x2) return false;
        nuke.push({x:(b.x+b.x2)/2,frame:1});// hit!
        score.nuke++;redrawScore=1;
        build.splice(i,1);
        redrawBuildings = 1;
        return true;
      })) return false;
    }
    if (bm.life--) return true;
    // else new bombs
    let bombcnt = 1+Math.random()*3;
    for (var i=0;i<3;i++)
      newBomb(bm);
    // return undefined->remove current
  }).concat(newBombs);
  newBombs=[];
  // Now start drawing main area...
  if (redrawScore) drawScore();
  redrawScore = 0;
  if (redrawBuildings) drawBuildings();
  redrawBuildings = 0;  
  // Draw Gun
  G.clearRect(gun.x-20, BLDGTOP, gun.x+20, gun.y);
  G.setColor(2).fillRect(gun.tx-20, gun.ty-1, gun.tx-10, gun.ty+1).fillRect(gun.tx+10, gun.ty-1, gun.tx+20, gun.ty+1)
   .fillRect(gun.tx-1, gun.ty-20, gun.tx+1, gun.ty-10).fillRect(gun.tx-1, gun.ty+10, gun.tx+1, gun.ty+20).setColor(3);  
  G.drawImage(IM.gunend, gun.x+8*Math.sin(gun.r),gun.y-8*Math.cos(gun.r),{rotate:gun.r});
  // missile
  if (missile) {
    if (missile.boom) {
      G.setColor(Math.max(0,BOOMLIFE-missile.boom))
      .drawImage(IM.boom, missile.x, missile.y, {scale:missile.rad/12,rotate:getTime()})
      .setColor(-1);
    } else {
      G.drawLineAA(gun.x, gun.y, missile.x, missile.y)
      .drawImage(IM.missile, missile.x, missile.y, {rotate:missile.r});
    }
  }
  // lines for bombs
  lines = lines.filter(l=>l[4]);
  lines.forEach(l=>G.drawLineAA.apply(b,l));
  // bombs
  bombs.forEach(bm=>{
    G.drawLineAA(bm.ix, bm.iy, bm.x, bm.y);
    if (bm.jx) G.drawLineAA(bm.ix, bm.iy, bm.jx, bm.jy);
    G.drawImage(IM.bomb, bm.x, bm.y, {rotate:bm.r});
  });
  // nukes
  nuke = nuke.filter(n=>{
    var s = n.frame*3;
    G.setColor(Math.min(3,Math.round(20-n.frame))).drawImage(IM.nukeb, n.x, FLOOR-s/2, {rotate:0,scale:s/62});
    G.drawImage(IM.nuket, n.x, FLOOR-s-20, {rotate:0,scale:(0.2+s/40)}).setColor(3);
    redrawBuildings = true;
    n.frame++;
    return n.frame<20;
  });
  
  G.flip();
}

initBuildings();
for (var i=0;i<2;i++) newBomb();
frameInterval = setInterval(onFrame, 50);
setInterval(function() {
  newBomb();
}, 8000);
drawAll();
