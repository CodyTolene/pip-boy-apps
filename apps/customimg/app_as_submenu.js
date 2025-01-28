if (Pip.removeSubmenu) Pip.removeSubmenu();
delete Pip.removeSubmenu;

{
  // load start screen
  let f = E.openFile("USER/customimg.img","r");
  let o = 0, a = new Uint8Array(bC.buffer), b = f.read(2048);
  while (b) {
    a.set(b, o);
    o += b.length;
    b = f.read(2048);
  }
  f.close();
  bC.flip();

  function closeImage() {
    Pip.removeSubmenu();
    delete Pip.removeSubmenu;
    submenuApps();
  }

  function onKnob(d) {
    closeImage();
  }

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