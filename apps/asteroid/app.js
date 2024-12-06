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
let lastFrame; // time of last frame

const SS = W/24;  // ship back length
const AS = W/18;  // asteroid radius
const SR = SS / 2; // radius of ship for collision detection
const AST = [ // asteroid polygon as X/Y pairs
  0  ,-1.5,
  1  ,   0,
  0.5,   0,
  0.5, 0.5,
  0  ,   1,
  -1 ,   0,
  -1 ,  -1
];
const SHIP = [
  SS, 0,
  -0.6*SS, 0.4*SS,
  -0.3*SS,0,
  -0.6*SS, -0.4*SS,
];


function newAst(x,y) {
  var a = {
    x:x,y:y,
    vx:Math.random()-0.5,
    vy:Math.random()-0.5,
    rad:10+Math.random()*AS
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
    var d,x,y;
    do {
      x = Math.random()*W; y = Math.random()*H;
      var dx = x-ship.x, dy = y-ship.y;
      d = Math.sqrt(dx*dx+dy*dy);
    } while (d<10);
    ast.push(newAst(x,y));
  }
}

function gameStart() {
  ammo = [];
  ast = [];
  score = 0;
  level = 4;
  ship = { x:W/2,y:H/2,r:0,v:0 };
  timeSinceFired = 0;
  addAsteroids();
  running = true;
}

function onFrame() {
  "ram"
  var t = getTime();
  var d = (lastFrame===undefined)?0:(t-lastFrame)*20;
  lastFrame = t;

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
  timeSinceFired+=d;
  if (KNOB1_BTN.read() && timeSinceFired>4) { // fire!
    timeSinceFired = 0;
    ammo.push({
      x:ship.x+Math.cos(ship.r)*SS,
      y:ship.y+Math.sin(ship.r)*SS,
      vx:Math.cos(ship.r)*3,
      vy:Math.sin(ship.r)*3,
    });
    Pip.audioStartVar(Pip.audioBuiltin("CLICK"));
  }

  G.clear(1).setFontMonofonto28().drawString(score,8,8);
  G.drawPolyAA(g.transformVertices(SHIP,{x:ship.x,y:ship.y,scale:1,rotate:ship.r}),true);
  var na = [];
  ammo.forEach(function(a) {
    a.x += a.vx*d;
    a.y += a.vy*d;
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
    a.x += a.vx*d;
    a.y += a.vy*d;
    // a 7 point asteroid with rough circle radius of scale 2
    G.drawPolyAA(g.transformVertices(AST,{x:a.x,y:a.y,scale:a.rad,rotate:t}),true);
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
    if (d < a.rad + SR) crashed = true;
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
