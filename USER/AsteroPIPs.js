// =============================================================================
// Name: AsteroPIPs  
// License: CC-BY-NC-4.0  
// Repository: https://github.com/CodyTolene/pip-apps  
// Description: A simple asteroids for the Pip-Boy 3000 Mk V.  
// Version: 1.0.0
// =============================================================================

var W = g.getWidth();
var H = g.getHeight();
var BTNL = BTN_TUNEDOWN;
var BTNR = BTN_TUNEUP;
var BTNU = BTN_PLAY;
var BTNA = KNOB1_BTN;
var BTNE = BTN_TORCH;

if (!g.drawPoly) 
    g.drawPoly = function (p) {
        g.moveTo(p[p.length - 2], p[p.length - 1]);
        for (var i = 0; i < p.length; i += 2) 
            g.lineTo(p[i], p[i + 1]);
        };
    
    function newAst(x, y) {
        var a = {
            x: x,
            y: y,
            vx: Math.random() - 0.5,
            vy: Math.random() - 0.5,
            rad: 5 + Math.random() * 20
        };
        return a;
    }

function initGame() {
    clearInterval();
    gameStart();
    setInterval(onFrame, 30);
}

var running = true;
var ship = {};
var ammo = [];
var ast = [];
var score = 0;
var level = 4;
var framesSinceFired = 0;

function gameStop() {
    console.log("Game over");
    running = false;
    g.clear();
    Pip.typeText("Game Over!\n\nLeft PUSH = Start\nTop Torch = Exit")
}

function endGame() {
    console.log("Game stopping");
    running = false;
    g.clear();
    E.reboot();
}

function addAsteroids() {
    for (var i = 0; i < level; i++) {
        do {
            var x = Math.random() * W,
                y = Math.random() * H;
            var dx = x - ship.x,
                dy = y - ship.y;
            var d = Math.sqrt(dx * dx + dy * dy);
        } while (d < 10);
        ast.push(newAst(x, y));
    }
}

function gameStart() {
    ammo = [];
    ast = [];
    score = 0;
    level = 4;
    ship = {
        x: W / 2,
        y: H / 2,
        r: 0,
        v: 0
    };
    framesSinceFired = 0;
    addAsteroids();
    running = true;
}

function onFrame() {
    if (!running) {
        if (BTNA.read()) 
            gameStart();
        if (BTNE.read()) 
            endGame();
        return;
    }

    if (BTNL.read())            // Turn left
        ship.r -= 0.1;        
    if (BTNR.read())            // Turn right
        ship.r += 0.1;
    ship.v *= 0.9;
    if (BTNU.read())            // Accelerate forward
        ship.v += 0.2;
    ship.x += Math.cos(ship.r) * ship.v;
    ship.y += Math.sin(ship.r) * ship.v;
    if (ship.x < 0) 
        ship.x += W;
    if (ship.y < 0) 
        ship.y += H;
    if (ship.x >= W) 
        ship.x -= W;
    if (ship.y >= H) 
        ship.y -= H;
    framesSinceFired++;
    if (BTNA.read() && framesSinceFired > 5) { // fire!
        framesSinceFired = 0;
        ammo.push({
            x: ship.x + Math.cos(ship.r) * 4,
            y: ship.y + Math.sin(ship.r) * 4,
            vx: Math.cos(ship.r) * 3,
            vy: Math.sin(ship.r) * 3
        });
    }
    if (BTNE.read()) 
        endGame();
    
    g.clear();
    g.drawString(score, 80, 30);
    var rs = Math.PI * 0.8;
    g.drawPoly([
        ship.x + Math.cos(ship.r) * 8,
        ship.y + Math.sin(ship.r) * 8,
        ship.x + Math.cos(ship.r + rs) * 6,
        ship.y + Math.sin(ship.r + rs) * 6,
        ship.x + Math.cos(ship.r - rs) * 6,
        ship.y + Math.sin(ship.r - rs) * 6
    ], true);
    var na = [];
    ammo.forEach(function (a) {
        a.x += a.vx;
        a.y += a.vy;
        g.fillRect(a.x - 1, a.y, a.x + 1, a.y);
        g.fillRect(a.x, a.y - 1, a.x, a.y + 1);
        var hit = false;
        ast.forEach(function (b) {
            var dx = a.x - b.x;
            var dy = a.y - b.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < b.rad) {
                hit = true;
                b.hit = true;
                score++;
            }
        });
        if (!hit && a.x >= 0 && a.y >= 0 && a.x < W && a.y < H) 
            na.push(a);
        }
    );
    ammo = na;
    na = [];
    var crashed = false;
    ast.forEach(function (a) {
        a.x += a.vx;
        a.y += a.vy;
        g.drawCircle(a.x, a.y, a.rad);
        if (a.x < 0) 
            a.x += W;
        if (a.y < 0) 
            a.y += H;
        if (a.x >= W) 
            a.x -= W;
        if (a.y >= H) 
            a.y -= H;
        if (!a.hit) {
            na.push(a);
        } else if (a.rad > 5) {
            a.hit = false;
            var vx = 1 * (Math.random() - 0.5);
            var vy = 1 * (Math.random() - 0.5);
            a.rad /= 2;
            na.push({
                x: a.x,
                y: a.y,
                vx: a.vx - vx,
                vy: a.vy - vy,
                rad: a.rad
            });
            a.vx += vx;
            a.vy += vy;
            na.push(a);
        }

        var dx = a.x - ship.x;
        var dy = a.y - ship.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < (a.rad + 4)) 
            crashed = true;
        }
    );
    ast = na;
    if (!ast.length) {
        level++;
        addAsteroids();
    }
    if (crashed) 
        gameStop();
    }

function initStart() {
    g.clear();
    Pip.typeText("Welcome to AsteroPIPs!").then(() => setTimeout(() => {
        Pip.typeText("Right Tune UP/DOWN = Rotate\nRight Tune PUSH = Forward\nLeft PUSH = Start / Fire!\nTop Torch = Exit").then(() => {
            const waitLoop = setInterval(() => {
                if (BTNA.read()) {
                    clearInterval(waitLoop);
                    initGame();
                }
                if (BTNE.read()) {
                    clearInterval(waitLoop);
                    endGame();
                }
            }, 100);
        })
    }, 3000))
}

initStart();