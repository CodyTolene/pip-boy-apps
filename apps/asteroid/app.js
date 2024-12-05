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
G.flip = () => Pip.blitImage(G,40,7);
let W = G.getWidth();
let H = G.getHeight();

// handle knob inputs and removal
function onKnob(dir) {
  ship.r -= dir*0.2;
}
Pip.on("knob1", onKnob);
Pip.remove = function() {
  clearInterval(frameInterval);
  Pip.removeListener("knob1", onKnob);
};


let running = true;
let ship = {};
let ammo = [];
let ast = [];
let score = 0;
let level = 10;
let framesSinceFired = 0;


function newAst(x,y) {
  var a = {
    x:x,y:y,
    vx:Math.random()-0.5,
    vy:Math.random()-0.5,
    rad:10+Math.random()*20
  };
  return a;
}

function gameStop() {
  console.log("Game over");
  running = false;
  G.clear(1).setFontMonofonto28().setFontAlign(0,0).drawString("Game Over!",W/2,H/2).flip();
}

function addAsteroids() {
  for (var i=0;i<level;i++) {
    do {
      var x = Math.random()*W, y = Math.random()*H;
      var dx = x-ship.x, dy = y-ship.y;
      var d = Math.sqrt(dx*dx+dy*dy);
    } while (d<50);
    ast.push(newAst(x,y));
  }
}

function gameStart() {
  ammo = [];
  ast = [];
  score = 0;
  level = 4;
  ship = { x:W/2,y:H/2,r:0,v:0 };
  framesSinceFired = 0;
  addAsteroids();
  running = true;
}


function onFrame() { "RAM";
  if (!running) {
    if (KNOB1_BTN.read()) gameStart();
    return;
  }

  ship.v *= 0.9;
  if (BTN_TUNEUP.read()) ship.v+=0.2;
  ship.x += Math.cos(ship.r)*ship.v;
  ship.y += Math.sin(ship.r)*ship.v;
  if (ship.x<0) ship.x+=W;
  if (ship.y<0) ship.y+=H;
  if (ship.x>=W) ship.x-=W;
  if (ship.y>=H) ship.y-=H;
  framesSinceFired++;
  if (KNOB1_BTN.read() && framesSinceFired>4) { // fire!
    framesSinceFired = 0;
    ammo.push({
      x:ship.x+Math.cos(ship.r)*4,
      y:ship.y+Math.sin(ship.r)*4,
      vx:Math.cos(ship.r)*3,
      vy:Math.sin(ship.r)*3,
    });
    Pip.audioStartVar(Pip.audioBuiltin("CLICK"));
  }

  G.clear(1).setFontMonofonto28().drawString(score,8,8);
  G.drawRect(0,0,W-1,H-1);
  var rs = Math.PI*0.8;
  G.drawPolyAA([
    ship.x+Math.cos(ship.r)*8, ship.y+Math.sin(ship.r)*8,
    ship.x+Math.cos(ship.r+rs)*6, ship.y+Math.sin(ship.r+rs)*6,
    ship.x+Math.cos(ship.r-rs)*6, ship.y+Math.sin(ship.r-rs)*6,
  ],true);
  var na = [];
  ammo.forEach(function(a) {
    a.x += a.vx;
    a.y += a.vy;
    G.fillRect(a.x-1, a.y, a.x+1, a.y).fillRect(a.x, a.y-1, a.x, a.y+1);
    var hit = false;
    ast.forEach(function(b) {
      var dx = a.x-b.x;
      var dy = a.y-b.y;
      var d = Math.sqrt(dx*dx+dy*dy);
      if (d<b.rad) {
        hit=true;
        b.hit=true;
        score++;
      }
    });
    if (!hit && a.x>=0 && a.y>=0 && a.x<W && a.y<H)
      na.push(a);
  });
  ammo=na;
  na = [];
  var crashed = false;
  ast.forEach(function(a) {
    a.x += a.vx;
    a.y += a.vy;
    G.drawCircleAA(a.x, a.y, a.rad);
    if (a.x<0) a.x+=W;
    if (a.y<0) a.y+=H;
    if (a.x>=W) a.x-=W;
    if (a.y>=H) a.y-=H;
    if (!a.hit) {
      na.push(a);
    } else if (a.rad>10) {
      a.hit = false;
      var vx = 1*(Math.random()-0.5);
      var vy = 1*(Math.random()-0.5);
      a.rad/=2;
      na.push({
        x:a.x,
        y:a.y,
        vx:a.vx-vx,
        vy:a.vy-vy,
        rad:a.rad,
      });
      a.vx += vx;
      a.vy += vy;
      na.push(a);
    }

    var dx = a.x-ship.x;
    var dy = a.y-ship.y;
    var d = Math.sqrt(dx*dx+dy*dy);
    if (d < a.rad) crashed = true;
  });
  ast=na;
  if (!ast.length) {
    level++;
    addAsteroids();
  }
  G.flip();
  if (crashed) gameStop();
}

gameStart();
var frameInterval = setInterval(onFrame, 50);
