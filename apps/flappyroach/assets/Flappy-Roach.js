{
// ====== Flappy-Roach (A Flappy-ish Wasteland Game) ======
// ====== A JS learning experience for Jim D. ======
// ====== Thanks to @Code, @Darrian, @Rikkuness for all the advice, suggestions, tips, and tricks! ======
// ====== Left Knob-press / Radio Knob-press flaps/restarts game, Torch pauses, Power exits ======
//
if (Pip.removeSubmenu) Pip.removeSubmenu();
delete Pip.removeSubmenu;
if (Pip.remove) Pip.remove();
delete Pip.remove;

let C = (typeof bC !== "undefined") ? bC : g,
 Storage = require("Storage"),
 HS_KEY = "flappy_hs",
 inTitle = true,
 highScore = Storage.readJSON(HS_KEY, 1) || 0,
 paused = false,
 menuItems = ["RESUME", "RESTART", "QUIT (REBOOT)"],
 menuIndex = 0,
 W = C.getWidth(),
 H = C.getHeight(),
 finalScore = 0,
 lastRunReason = "",
 bird,
 pipes = [],
 score = 0,
 gameOver = false,
 loopId = null,
 powerExitInProgress = false,
 powerWatchId = null,
 showingScoreScreen = false,
 playWasDown = false,
 knob1WasDown = false,
 frameCount = 0,
 roachFlapT = 0,
 roachTilt  = 0,
 tOverSound = null,
 tImpactClear = null,
 lastFlapSoundT = 0,
 impactFX = null,
 showGameOverUI = true,
 exitingToApps = false,
 inputLockedUntil = 0,
 GRAVITY = 0.4,
 FLAP = -5,
 PIPE_SPEED = 2.5,
 PIPE_GAP = 40,
 PIPE_WIDTH = 15,
 PIPE_SPACING = 180,
 SND_FLAP  = "/USER/FLAPPYROACH/BeetleFlying.wav",
 SND_HIT  = "/USER/FLAPPYROACH/HitGround.wav",
 SND_OVER  = "/USER/FLAPPYROACH/GameOver.wav",
 SND_SPLAT   = "/USER/FLAPPYROACH/SplatOnPipe.wav",
 SND_START = "/USER/FLAPPYROACH/StartGame.wav",
 exitTO1 = null,
 exitTO2 = null;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

function drawTitleScreen() {
  C.clear();
  C.setFontAlign(-1, -1);
  C.setFont("6x8", 2);
  drawCentered("FLAPPY-ROACH", Math.floor(H * 0.25));
  C.setFont("6x8", 1);
  drawCentered("Knob1 or Radio PLAY", Math.floor(H * 0.52));
  drawCentered("to START", Math.floor(H * 0.60));
  drawCentered("Torch: pause menu", Math.floor(H * 0.78));
  flushScreen();
}

function startRun() {
  exitingToApps = false;
  inTitle = false;
  gameOver = false;
  paused = false;
  // give player a moment of stability
  bird.y = H / 2;
  bird.vy = 0;
  pipes = [];
  newPipe(); // or newPipe(W) depending on your current version
  playSound(SND_START); // optional, if you want start sound here
}

function hardExitAndReboot() {
  if (powerExitInProgress) return;
  powerExitInProgress = true;
  // Save score safely
  try {
    saveHighScoreIfNeeded(score);
  } catch (e) {}
  // Stop the game loop cleanly
  try {
    stopGame();
  } catch (e) {}

  // Remove all input handlers
  try {
    if (global.Pip) Pip.removeAllListeners();
  } catch (e) {}
  // Clear the display to avoid ghosting
  try {
    C.clear();
    flushScreen();
  } catch (e) {}

  // Let the UI settle, then reboot
  setTimeout(() => {
    E.reboot();
  }, 100);
}

function playSound(name) {
  try {
    let soundExists = false;

    try {
      if (Storage && typeof Storage.read === "function") {
        soundExists = Storage.read(name) !== undefined;
      }
    } catch (e) {}

    if (!soundExists) return;

    try { Pip.audioStop(); } catch (e) {}
    try { Pip.audioStart(name); } catch (e) {}
  } catch (e) {
    // Fail silently if audio is unavailable
  }
}

function playFlapSound() {
  let now = getTime() * 1000; // ms
  if (now - lastFlapSoundT < 120) return; // 120ms minimum gap
  lastFlapSoundT = now;
  playSound(SND_FLAP);
}

function drawSplat(x, y, s, t) {
  // x,y: center-ish, s: size scale, t: 0..1 progress
  let r = Math.max(2, s + Math.floor(t * 6));
  // central blob
  C.fillRect(x - r, y - r, x + r, y + r);
  // droplets (fixed pattern, grows a bit with t)
  let d = r + 2;
  C.fillRect(x - d, y - 1, x - d + 2, y + 1);
  C.fillRect(x + d - 2, y - 1, x + d, y + 1);
  C.fillRect(x - 1, y - d, x + 1, y - d + 2);
  C.fillRect(x - 1, y + d - 2, x + 1, y + d);
  // diagonals
  C.fillRect(x - d, y - d, x - d + 2, y - d + 2);
  C.fillRect(x + d - 2, y - d, x + d, y - d + 2);
  C.fillRect(x - d, y + d - 2, x - d + 2, y + d);
  C.fillRect(x + d - 2, y + d - 2, x + d, y + d);
  // optional little “crack” line for pipe hit
  if (impactFX && impactFX.kind === "HIT") {
    C.drawLine(x - r - 2, y, x + r + 2, y);
  }
}

function flapAction() {
  // Ignore all input during lockout window
  if (getTime() < inputLockedUntil) return;
  // 1) Score screen: press exits to apps
  if (showingScoreScreen) {
    showingScoreScreen = false;
    exitToApps();
    return;
  }
  // 2) Pause menu: press selects
  if (paused && !gameOver) {
    pauseSelect();
    return;
  }
  if (inTitle) { startRun(); return; }
  if (gameOver) { resetGame(); startRun(); return; }
  bird.vy = FLAP;
  roachFlapT = 6;
  roachTilt = -1;
  playFlapSound();
}

function saveHighScoreIfNeeded(s) {
  if (s > highScore) {
    highScore = s;
    Storage.writeJSON(HS_KEY, highScore);
  }
}

function togglePause() {
  paused = !paused;
  if (paused) {
    menuIndex = 0;  // keep this!
    // Small input lock so the pause button press
    // doesn’t instantly trigger a menu selection
    inputLockedUntil = getTime() + 0.15;
    // Reset press-state tracking so a held button
    // doesn't count as a new press
    knob1WasDown = (typeof KNOB1_BTN !== "undefined") ? KNOB1_BTN.read() : false;
    playWasDown  = (typeof BTN_PLAY  !== "undefined") ? BTN_PLAY.read()  : false;
  }
}

function pauseSelect() {
  let choice = menuItems[menuIndex];
  if (choice === "RESUME") {
    paused = false;
  } else if (choice === "RESTART") {
    paused = false;
    resetGame();
    startRun && startRun(); // if you have startRun
    // or just reset+inTitle=true depending on your flow
  } else if (choice.indexOf("QUIT") === 0) {
    // Save score, then reboot (reliable “exit”)
    try { saveHighScoreIfNeeded(score); } catch (e) {}
    try { C.clear(); flushScreen(); } catch (e) {}
    E.reboot();
  }
}

function exitToApps() {
  if (exitingToApps) return;
  exitingToApps = true;
  // Cancel any previous exit timers (defensive)
  if (exitTO1) { clearTimeout(exitTO1); exitTO1 = null; }
  if (exitTO2) { clearTimeout(exitTO2); exitTO2 = null; }
  // Stop everything first
  stopGame();
  try { if (global.Pip) Pip.removeAllListeners(); } catch (e) {}
  // Clear/flush immediately
  try { C.clear(); flushScreen(); } catch (e) {}
  // Clear/flush again shortly after
  exitTO1 = setTimeout(() => {
    exitTO1 = null;
    try { C.clear(); flushScreen(); } catch (e) {}
    // Now hand off to UI
    exitTO2 = setTimeout(() => {
      exitTO2 = null;
      try {
        if (typeof submenuApps === "function") submenuApps();
        else if (typeof showMainMenu === "function") showMainMenu();
        else {
          C.clear();
          C.setFont("6x8", 2);
          C.setFontAlign(-1, -1);
          let msg = "Exited";
          let x = Math.max(0, (W - C.stringWidth(msg)) >> 1);
          C.drawString(msg, x, Math.floor(H * 0.45));
          flushScreen();
        }
      } catch (e) {}
    }, 120);
  }, 40);
}

function flushScreen() {
  if (C && C.flip) return C.flip();
  if (C && C.flush) return C.flush();
  if (C && C.update) return C.update();
  if (global.LCD && LCD.flip) return LCD.flip();
}

function newPipe() {
  let gap = Math.min(PIPE_GAP, H - 30);
  let margin = 10;
  let usable = H - gap - margin*2;
  let gapY = margin + Math.random() * (usable > 0 ? usable : 1);
  pipes.push({ x: W, gapY: gapY, scored: false, gap: gap });
}

function resetGame() {
  W = C.getWidth();
  H = C.getHeight();
  paused = false;
  gameOver = false;
  showingScoreScreen = false;
  bird = { x: Math.floor(W * 0.25), y: H / 2, vy: 0, size: 6 };
  pipes = [];
  score = 0;
  inTitle = true; // <--
}

function update() {
  if (exitingToApps) return; // Prevents ghosting when entering Apps List
  if (!pipes) pipes = []; // safety
  // --- Always poll inputs FIRST (even on score/title/pause screens) ---
  // Radio PLAY
  if (typeof BTN_PLAY !== "undefined") {
    let down = BTN_PLAY.read();
    if (down && !playWasDown) flapAction();
    playWasDown = down;
  }

  // Knob1 press (hardware)
  if (typeof KNOB1_BTN !== "undefined") {
    let down = KNOB1_BTN.read();
    if (down && !knob1WasDown) flapAction();
    knob1WasDown = down;
  }

  // Now we can bail out of motion/physics while on other screens
  if (showingScoreScreen) return;
  if (inTitle) return;
  if (gameOver || paused) return;

  // Flap animation countdown
  if (roachFlapT > 0) roachFlapT--;

  // Tilt easing
  let targetTilt = 0;
  if (bird && isFinite(bird.vy)) targetTilt = (bird.vy < 0) ? -1 : 1;
  roachTilt += (targetTilt - roachTilt) * 0.15;

  // Physics
  bird.vy += GRAVITY;
  bird.y += bird.vy;
  if (!isFinite(bird.y)) { bird.y = H/2; bird.vy = 0; }
  if (bird.y < 0 || bird.y + bird.size > H) endRun("FELL");

  // Pipes move/collide/score
  for (let i = 0; i < pipes.length; i++) {
    let p = pipes[i];
    p.x -= PIPE_SPEED;
    if (bird.x + bird.size > p.x && bird.x < p.x + PIPE_WIDTH) {
      if (bird.y < p.gapY || bird.y + bird.size > p.gapY + p.gap) endRun("HIT");
    }
    if (!p.scored && p.x + PIPE_WIDTH < bird.x) {
      p.scored = true;
      score++;
    }
  }

  // Spawn pipes
  let last = pipes[pipes.length - 1];
  if (!last) newPipe();
  else if (last.x <= W - PIPE_SPACING) newPipe();
  // Remove pipes that have gone off screen (INSIDE update!)
  if (pipes.length && pipes[0].x < -PIPE_WIDTH) {
    pipes.shift();
  }
}

function drawCentered(text, y) {
  if (exitingToApps) return; // Prevents ghosting when entering Apps List
  C.setFontAlign(-1, -1); // left/top
  let tw = C.stringWidth(text);
  let x = Math.max(0, Math.floor((W - tw) / 2));
  C.drawString(text, x, y);
}

function draw() {
  if (exitingToApps) return;
  if (inTitle) {
    drawTitleScreen();
    return;
  }
  if (showingScoreScreen) return;
  if (!pipes) pipes = [];
  C.clear();
  // Pipes
  for (let i = 0; i < pipes.length; i++) {
    let p = pipes[i];
    C.fillRect(p.x, 0, p.x + PIPE_WIDTH, p.gapY);
    C.fillRect(p.x, p.gapY + p.gap, p.x + PIPE_WIDTH, H);
  }
  // Rad-Roach
  drawRadroach(bird.x, bird.y, bird.size, frameCount, roachFlapT, roachTilt);
  // Score
  C.setFont("6x8", 2);
  C.setFontAlign(-1, -1);
  C.drawString(" Score: " + score, 2, 2);
  if (gameOver) {
  // If we’re in the impact phase, draw splat instead of text
  if (!showGameOverUI && impactFX) {
    // Splat overlay - Increases by 0.3 times.
	// If splat is increased, setTimeout (at the bottom of "function endRun") should also be increased to the same.
	// Also, inputLockedUntil should be set to the same thing.
    let t = Math.min(1, (getTime() - impactFX.t0) / 0.75); // 0..1
    drawSplat(impactFX.x, impactFX.y, 3, t);
    flushScreen();
    return;
  }
  // Otherwise: normal Game Over screen
      C.clear();
      C.setFont("6x8", 3);
      drawCentered("GAME OVER", Math.floor(H * 0.14));
      C.setFont("6x8", 2);
        drawCentered("Score: " + finalScore, Math.floor(H * 0.30));
        drawCentered("Highest Score: " + highScore, Math.floor(H * 0.40));
      drawCentered("Knob1/Radio: Play Again", Math.floor(H * 0.64));
      drawCentered("Power: Exit to MAIN", Math.floor(H * 0.74));
  } else if (paused) {
    drawPauseMenu();
  }
  flushScreen();
}

// If the display supports color and you’re already using setColor, you could make the eyes “glow red”
// by briefly switching colors for the eye pixels — but the blink/pulse trick works in monochrome as well.
function drawRadroach(x, y, s, t, flapT, tilt) {
  let k = Math.max(1, Math.floor(s / 3));
  // tilt shift: -1..1 => -2..2 pixels
  let dxTop = Math.round((-tilt) * 2);   // tilt up shifts head slightly
  let dxBot = Math.round(( tilt) * 2);
  // BODY
  C.fillRect(x + 1*k + dxTop, y + 1*k, x + 5*k + dxBot, y + 4*k);
  C.fillRect(x + 2*k + dxTop, y + 0*k, x + 4*k + dxTop, y + 1*k); // head
  C.fillRect(x + 1*k + dxBot, y + 4*k, x + 5*k + dxBot, y + 5*k); // abdomen
  // EYES (mono "glow" effect by adding a halo)
  let eyeGlow = ((frameCount >> 3) & 1); // toggle every ~8 frames
  let ex1 = x + 2*k + dxTop;
  let ex2 = x + 4*k + dxTop;
  let ey  = y + 0*k;
  // Core eye pixels
  C.fillRect(ex1, ey, ex1, ey);
  C.fillRect(ex2, ey, ex2, ey);
if (eyeGlow) {
  // halo pixels (a tiny plus-shape around each eye)
  C.fillRect(ex1-1, ey,   ex1-1, ey);
  C.fillRect(ex1+1, ey,   ex1+1, ey);
  C.fillRect(ex1,   ey-1, ex1,   ey-1);
  C.fillRect(ex1,   ey+1, ex1,   ey+1);
  C.fillRect(ex2-1, ey,   ex2-1, ey);
  C.fillRect(ex2+1, ey,   ex2+1, ey);
  C.fillRect(ex2,   ey-1, ex2,   ey-1);
  C.fillRect(ex2,   ey+1, ex2,   ey+1);
}
  // WINGS (only visible right after flap)
  if (flapT > 0) {
    // alternate wing pose for a flapping look
    let w = (flapT & 1) ? 3 : 2;
    // left wing
    C.drawLine(x + 1*k + dxTop, y + 2*k, x - w*k, y + 1*k);
    C.drawLine(x + 1*k + dxTop, y + 3*k, x - w*k, y + 4*k);
    // right wing
    C.drawLine(x + 5*k + dxBot, y + 2*k, x + (6+w)*k, y + 1*k);
    C.drawLine(x + 5*k + dxBot, y + 3*k, x + (6+w)*k, y + 4*k);
  }
  // LEGS (simple)
  C.fillRect(x + 0*k + dxTop, y + 2*k, x + 0*k + dxTop, y + 2*k);
  C.fillRect(x + 6*k + dxBot, y + 2*k, x + 6*k + dxBot, y + 2*k);
}

function bindGameControls() {
  Pip.removeAllListeners();
   Pip.on("torch", () => {
     if (!gameOver && typeof togglePause === "function") togglePause();
  });
Pip.on("knob1", val => {
  if (paused && !gameOver) {
    if (val > 0) {
      menuIndex = (menuIndex + 1) % menuItems.length;
    } else if (val < 0) {
      menuIndex = (menuIndex + menuItems.length - 1) % menuItems.length;
    }
    return;
  }
});
}

function drawPauseMenu() {
  C.clear();
  C.setFontAlign(-1, -1);
  C.drawRect(10, 20, W - 10, H - 20);
  C.setFont("6x8", 3);
  drawCentered("PAUSED", 28);
  C.setFont("6x8", 2);
  for (let i = 0; i < menuItems.length; i++) {
//    let y = 52 + i * 12;
    let y = 56 + i * 16;
    let t = (i === menuIndex ? "> " : "  ") + menuItems[i];
    drawCentered(t, y);
  }
  C.setFont("6x8", 1.5);
  drawCentered("Torch: Pause/Resume", H - 40);
  drawCentered("Knob1 Press: Select", H - 30);
}

function stopGame() {
  if (loopId) { clearInterval(loopId); loopId = null; }
  if (powerWatchId) { clearWatch(powerWatchId); powerWatchId = null; }
  if (exitTO1) { clearTimeout(exitTO1); exitTO1 = null; }
  if (exitTO2) { clearTimeout(exitTO2); exitTO2 = null; }
  if (tOverSound) { clearTimeout(tOverSound); tOverSound = null; }
  if (tImpactClear) { clearTimeout(tImpactClear); tImpactClear = null; }
  if (global.Pip) Pip.removeAllListeners();
}

function endRun(reason) {
  gameOver = true;
  paused = false;
  // Can be tuned up or down to change "0.6"
  // Ideally should match the 'Splat' timing
  inputLockedUntil = getTime() + 0.75; // 600 ms lockout
  finalScore = score;
  saveHighScoreIfNeeded(finalScore);
  lastRunReason = reason || "";
  // Start impact animation for 300ms
  showGameOverUI = false;
  impactFX = {
    kind: reason,
    x: Math.round(bird.x + bird.size/2),
    y: (reason === "FELL")
         ? Math.min(H - 6, Math.round(bird.y + bird.size/2))
         : Math.round(bird.y + bird.size/2),
    t0: getTime()
  };
  // Play sound (your full paths)
  if (reason === "HIT")  playSound(SND_SPLAT);
  if (reason === "FELL") playSound(SND_HIT);
  // playSound(SND_OVER);
  // clear any previous endRun timers (defensive)
  if (tOverSound) { clearTimeout(tOverSound); tOverSound = null; }
  if (tImpactClear) { clearTimeout(tImpactClear); tImpactClear = null; }
  tOverSound = setTimeout(() => playSound(SND_OVER), 500);
  tImpactClear = setTimeout(() => {
    showGameOverUI = true;
    impactFX = null;
    tImpactClear = null;
  }, 750);
}

function startGame() {
  exitingToApps = false;
  stopGame();
  resetGame();
//  drawTitleScreen();
    draw();
   playSound(SND_START); // optional: start sound when restarting
  bindGameControls();
  powerExitInProgress = false;
  powerWatchId = setWatch(() => hardExitAndReboot(), BTN_POWER, {
    debounce: 50,
    edge: "rising",
    repeat: true,
  });
  draw();
  loopId = setInterval(() => {
    update();
    draw();
    frameCount++;
  }, 50);
}

startGame();
}
