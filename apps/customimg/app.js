if (Pip.removeSubmenu) Pip.removeSubmenu();
delete Pip.removeSubmenu;
if (Pip.remove) Pip.remove();
delete Pip.remove;

{
  // create new Graphics instance
  let G = Graphics.createArrayBuffer(400,300,2,{
    msb : true,
    buffer : E.toArrayBuffer(E.memoryArea(0x10000000 + 32768, (400*300)>>2)) // Uses 30,000 bytes of the 64KB CCM memory, starting above the 32KB audio ring buffer
  });
  G.clear();
  G.flip = () => Pip.blitImage(G,40,11);

  // load image
  let f = E.openFile("USER/customimg.img","r");
  let o = 0, a = new Uint8Array(G.buffer), b = f.read(2048);
  while (b) {
    a.set(b, o);
    o += b.length;
    b = f.read(2048);
  }
  f.close();
  g.clear();
  G.flip();

  let closeImage = function() {
    Pip.remove();
    delete Pip.remove;
    showMainMenu();
    submenuApps();
  }

  let onKnob = function(d) {
    closeImage();
  }

  let interval = setInterval(() => G.flip(), 25);
  Pip.on("knob1", onKnob);
  Pip.on("knob2", onKnob);
  Pip.remove = function() {
    Pip.removeListener("knob1", onKnob);
    Pip.removeListener("knob2", onKnob);
    if (interval) clearInterval(interval);
    interval = undefined;
    g.clear();
  };
}