if (Pip.removeSubmenu) Pip.removeSubmenu();
delete Pip.removeSubmenu;

{
  // load start screen
  let text = require("fs").readFileSync("USER/text.txt").split("\n");
  let title = text.shift();
  let font = "Monofonto18";

  bC.setFont(font);
  // wrap
  text = [].concat.apply([],text.map(line => line?bC.wrapString(line, bC.getWidth()-38):[""]));
  let maxOffset = Math.floor(bC.getHeight()/bC.stringMetrics("X").height);
  // draw title
  bH.reset().clearRect(0,30,400,50).setFont("Monofonto16").drawString(title,4,32).flip();

  let offset = 0;

  let draw = function() {
    bC.clear(1).setFont(font);
    var y = 0;
    for (var i=offset;i<text.length;i++) {
      bC.drawString(text[i], 20, y);
      y += 18;
    }
    bC.flip();
  };

  let closeText = function() {
    Pip.removeSubmenu();
    delete Pip.removeSubmenu;
    submenuApps();
  };

  let onKnob = function(d) {
    if (d) {
      offset = E.clip(offset+d, 0, maxOffset);
      draw();
    } else closeText();
  };

  draw();
  let interval = setInterval(() => bC.flip(), 25);
  Pip.on("knob1", onKnob);
  Pip.on("knob2", onKnob);
  Pip.removeSubmenu = function() {
    Pip.removeListener("knob1", onKnob);
    Pip.removeListener("knob2", onKnob);
    if (interval) clearInterval(interval);
    interval = undefined;
  };
}