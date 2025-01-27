if (Pip.removeSubmenu) Pip.removeSubmenu();
delete Pip.removeSubmenu;
if (Pip.remove) Pip.remove();
delete Pip.remove;

g.clear();
// create new Graphics instance
let G = Graphics.createArrayBuffer(400,308,2,{
  msb : true,
  buffer : E.toArrayBuffer(E.memoryArea(0x10000000 + 32768, (400*308)>>2)) // Uses 30,800 bytes of the 64KB CCM memory, starting above the 32KB audio ring buffer
});
G.clear();
G.flip = () => Pip.blitImage(G,40,7);
let W = G.getWidth();
let H = G.getHeight();

// load start screen
let f = E.openFile("USER/atomic.img","r");
let o = 400*18>>2, a = new Uint8Array(G.buffer), b = f.read(2048);
while (b) {
  a.set(b, o);
  o += b.length;
  b = f.read(2048);
}
delete b;
f.close();
delete f;
G.flip();
Pip.audioStop();
Pip.audioStart("USER/atomicst.wav",{repeat:true});

// handle knob inputs and removal
function onKnob1(dir) {
  if (dir) {
    gun.ty = E.clip(gun.ty - dir*20, 40, 210);
    gun.aim();
  } else {
    if (mode=="game") gun.fire=1;
    else {
      Pip.audioStop();
      Pip.audioStart("USER/atomicgs.wav");
      setTimeout(restartGame, 100);
    }
  }
}
function onKnob2(dir) {
  gun.tx = E.clip(gun.tx + dir*20,20,380);
  gun.aim();
}
Pip.on("knob1", onKnob1);
Pip.on("knob2", onKnob2);
Pip.remove = function() {
  clearInterval(frameInterval);
  clearInterval(gameInterval);
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
let SND = {
  fire : atob("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"),
  explode : atob("AAAAAKGzowGhowGhs6MRCaGjETo7GqGjEToaGTk7G5Gxs5MpOzsKkaKRAQAZKTs7GhmRkZGRKSuZsrOSGbHFpIGgxLSikpGAASkrCTlNPDxLOzxbPDsaoMTTxcWzxMOj/38HlL5KlIsUuEyFqyLJMiuzjZScFjvAEaky+DoQg4uZm3GAEbgPhgiZIspAka8ygqpisIsR8hpDoRqYoAKJHAK/UReqmQlCgomIuSjBWgG7NEe7HJARCLEphQpwoJGb6lAptCiZAjL6gKuZVRCaEakLY/EKJJCqGBQK+RkkKqDbMbgIRasFiRDZi1WgmzKgDDKYqlLDWLiJG8KJN4ukOrwdSgA5+DnKIrI7CYAnmAGqmc80kMpAAAGQ+kCQCKIsooiqNVjTC6smnEKBqYiYiSQg2BiEn5IpUrAKCDqGCdAYgY4zibB42BgAIsEACqoirwUbQ8AAgK8hBrkooblBCSOhwEzaQYCAGpK7KESUrZtDRKi52UATuwEJ0FgjidqJJKoADEOymniRmJ8UgYyROBLIGbkJKSAnoizFe6G5GYEkgt0oEimRmMsrAiKbR6odE5ipiTJUgL8yqYs3mxixObNp2mKQibo0mxM7lrtwoQnIOBCAqxEJNhWrqLsKJzj5PIIiyiOvABGaMhWhrYoRsHG0GIibITPL0g5Ck6mdIFOgQE4Aqp0yMKigjAI4ssxYoTolkcsKgsxIFAKhrxOZihg6h3mhiqkIRcgJADPaEAOskAo1uI4SgQwFKbLLWoMYmflLIgOsqhhwg6wJAhADE8yanjEiE5nCjdsRc6PqGiOoIQCRvyOBnxETjJGNQwGYuQCJvDNzkSjsIAHZiFCQE5qYjRSQm5o3IMGbCjIi2JlhyLxCQpK7nzMSugCErZs0I7KfCBIYkMlLg0iwKM8SEYGAqok3ybsYIg0mMajarCI0ifkqgjHpIICIrzI0sKyNFQiJKoMbgbjaWBKyOfkJM4ibeJOfgBEzuMqaIZJxkZCKqkIAE99AgJGbibl1ApO8vulJAAAA0ChBMtgakLomuykAFZ4SGQS6IQn4KREBqapYI5O/ulWgIYnKOkOUnPo4ERCCGMCo7yEjqAsSmcGfMjW6qo1TArkJiSIBuyG6NhiHvolBgQkRMogY7IxDoZm5OjaQqroyO2eguAkhChWgqwEXu9opNJGbMs8jJKiYoJ3KWBQRuYyKJTDBmgHaCUARkY4yqiaJoIn6SoElmpopgqkIPFeZujsWMdmpixRCoduJQxCRnUCgjTCDDASo+DiCgZnZOoJwgsoMMgKQqqk4BZDMLBWI2CgimhAjmahw85qpKCOONCLBjKCqUJhigYGrqhkAM4GK/1ECg63JHEMhmLkMRgCpCiJysbuMglICmLgqEqgziUefqRtTQJHJnEMBA7vcKiFDoAqYEIiMo2CEvWChmflIEhG5iQWcmQ0kIbGr2UAjmIgbFruKiFiQCZACWBepiYrjQAFB+gqCmiEhAaCPBahJkQmB+osXoBiCiZKbgbxyIropEcm8+nMSkauJikCBjhIRgZko2Ir4SUORmgAIqYogsAAQ+x8RIyKGu6sAAa6PNQKZmAgFnZkLJCK4CxWAqIwKFgCCmwuXn5IqJDPqCMAwuAhQAFDImrxygYiJEQACrK1UAYDaGRSqqY5TAgK7ma8iIgGpKJiImUXbq+pTI4K6iYiYEIDJj3OhmNls5UQAIgETqZi/MTL4OSIY2pkgsJ2SORcADAWIhK0ImyEmgquMAhCRnhFDvEISANyY2kESMPkJsEEBCJiBmpoQGSeYmO8kgZCZgDTciKkhIqBgEqkYqIqvFoCJgLhzsIo6gri9cYOAjySAALu5eKGZiDgiJKmMAogJkPwvMwGSn4mMNIC4MYGZiAJ64p0AGhYCuBiACJqJ/UASkAqAAISdmVKZGflaExCgnIkDmhH/QBIYmKqbI6ALJpkJ8TpDgIKcmd1BEoiIiBsXu5kwiIA6N6iKzDNDgrqLkJCri7l0hooEmYHKOROsjyaBiKiYGKSeIN9DAhi4mpkbF4gx2ZmpO+g+ADQQAomR+xkSAFDJioAAuwL/VIGYgJiIgKgLdbGcGQkkEfA5E4gEvYoIAQARKJGa+D4ViLkYEwiFroiJICESi0OCEPmMgN9BA4iMEwiIqoiA+mAAAAesiQAQARj4egKAgq2J0DgjgYiJiQiYqCE3vakhgwK6+3MCkI8EiEjAmpCaQxOYDRIBALmakM8lgYkJgoAJqLlpd8mJCQwlA5iIiYmoKQGIAJkIuEeJqZ1nmpoIOycAAJipmPhaApAIiZAJc+iKALtHAogCzJkIIpkYMa8zIoCYrKnZHyWBKNiamJhiEpCfMoGIioCIMMScmDCBGbD5fRKAQNqZiREREtICOgD7WRKAmJiIiGjImQAwoQgj/VoigBjJmpj6fQKAONmZiJAhEwDIKAGACLCaivkPJoCIC4KIgIadmAgkiJmRsGIikEjgmpmRGjUTqa9DgJiIiKslkImACPHPF4GYGoGAiJCKCBAHnIohN5yoKSWqizEIQwSp/lkCiEjImomQOTWCiImJiIABy5gNIQeIDAShmJDyvzeAiAG7igDcQhKAiJGaCIgQiRgY/loECJgLEoiI/EKAgMgfIoCQc+mZCAExgYAZ+1EBicgfIoCYQdmKCQAQIoIY8h8UiJgx24qIEAEhgQCUK5CYmACa7AUR0YmR898mgYiZkAiIOKecCRAx+DwAAQIBCAPKmLD+LxWAiIiZiAg4l5wJKLhzEoioiyKAiUnkqokRc5iJkNKPNQGJibGaCQhzyJkJIchUEYiJmYgICTmXnJgAAQg2iJj4LxOAielKA5CIqBkBiAlSwIyoIPl6I4iYeNOriRGRWySBiJmJiYiIOISfmRAR/2GCiIgIqJkAgBCIAADQvyeBiCizn5kBsWwjgJgZwJmAAHjBmQoRgUEkiYrvQIKQiMlIAYiIceGZiRGweSOQiImYmZCA8R8kiICJgrsZqRE1iICIgHP0mgkB4moigJiYvCSAiJjISACICHiznYkQIN80EZiICbGbCACAEQoAgYEhtYuB0v8fABh4d56YAYHxLxYIiZgRq4qIAQGLN4GImPA8EwiJiAiwihgYEHLHuwlAEvtiAoiJ+CoTgJiYAJoJAAB09JmIEZI6NYCZmMoiiImISKadkAkSEESICYmImJCQstT1jyeAiZhT24oJIBGaNgKZmPgtI4iIiTnzipgBAfl5EoiYiAiomACAgTXqiQkREf9CAoiYiQioCQgACHHACaohYBKwiYiAiPC/NwCJiJghvAgAGBhYwQnLUYSwjCaICYgZ/0GBgJiACZKbAAAYGHDACbphA4i9JZCQgJjxHxSAiIiJeNKaCREgEf9QEYiYiIgh2poZERFTiIiIiIjwawGICIIANACQM54JqUED31GBgIiYGKGaABgI8N8mAIiYiIiIgAAICHinq4oREjGZQxSpmZkasawIgAAA/08TiIiJCe8zgQiJiIiLA4AYGRl6h66JEBMR8y8kiImJiQigiYCBAQAAgAAAABgpexevqRESAaX/NIGYmImICIkIAAgAgAAAAICRorPVd+qKiEMAMIOZmYmZiJiANb4AgIGBAfn/dIGYmIiIONOMihERECXpSICIiIgIiPovFgiJiImIaKSdiQASIYEQ7ySAiJiImAhi2YkIAQEQI/oPJYCYmJgIgpwYGBgIEASrCI8VgAj5XQKIiJiACIAJCAiAgAAIgAAIAAj1/xgAEHfwCgAAAAD4/yWAkIiICSiwmQAAAAAAdvKqgDACAQXPMgKIiZqICGTamRgQERSI/kABgAmJCYj4WxMIiYiYCShHn4kYERGBEP9AAoiYiImIGIeciQASEQE48EsSiYmIiQiY/3kBgIiJgIgIQsqpGBERYIGJ7VEAiIiIiIAIeMCJmRERFYiIiR+DiIiAiIAICPx4gYgIiIAICCgHrYCBAACAkcP1zyeAiIkIiQgIOJecmBABEQWYiAiBjAgICAgYGUpr/20CiIiIiAmIAJhKggiIgIAICBgZeyevqRASc4CImJDwDxWAiJiIgICAiOEPJICAiYgIiFinqwoR4vwxAAERh5Ax64kLEVKAiBn/WAKIiImIiIAgsowAAAAAAIDx/1MBiImJmIiAcdObiTAREGGAif0hAogJCYiICIggiwAYCAAoOlts/3yCgIiYiAgICCC5CAAAAIAAgACAAIAIGDpMPExLXP9dA4iICYiIiAiIdMoIgAAAAAgAGCn/eIGICIiIgIiAkHa6iQGAAAAAgAAYOdUJCIAACICQkbLD9k+CkJCQgIiAkJGxd9eqCyIyF4iYiJiQ8q8ngIiYiAiIgICAgHW6mQtBBgiIiIiAiPG/JwCImIiICAgIgICAV8uYihJzgIiQgIiIgPhMA4iICIiIgAgICAgIAAgYGe3/EQCikqKSAEt8TF1c/3qDkIiYCYiAgICAAAggF58AAAgACIAACAiAgJChd7wAAAAAAICAgYCAgAgICRkZCZCQOSsKwsSjs5IRmbKzs7MBKVw8TDtdOzs9OyoZ//93gIiZiIkICAgIgACAAIAAlgsYCAAIABgICQAZGaCBgBgZd/WJAICBkYGAoQIZdxf/nBIhJomImIgICYiIgICAAAgACBgIGPL/fweJiJiYCAgICIAAIIsAAAgAABgYGTpMXH0nvwoRESAGmIiIiZCQwF6BiICACIiAgJGRorL37xYAiJiICIiAgICAAAhg0gsAAIAAAAAICICAgIiRgIiQwrMLAAkAKxqY07PE1MTE9W+ACIgIiICACAiIkZGRsvUfF4iIiAmIiAiIgICAkbLFd/CaKyFhhJiIiIiIiIAIiIAACAgAAAiAkpGytLWzsrSSgfH/fweQmKgJiICAgAAIAAgACBh0x5zQKSeIiAiICIiACAgICYAA/49HiIiYiAmIgAAICIAAgIAAgAAIAAiAkIGAkJEAGQmhETkbO0s7PUx8xwoYGBgIAAiAABkqGRk6KjtMTTxcfZeOAAAIABgICAiAgAiAkJGh09O008T17yWAiIiQgIiAiICAgAAICAAIAAgAAAgYGQgICJCSkZEQGRk7KxkZOyqZASA7Kxp7XFx9ewQgAP8MqVADiIgIiIgIiIAICAgICBgIkIEACJCyxXeOAIAACICAgJGRgYCQkYEpS0w7GgkpGwEZoNPW1PUfF4iICYiIiAiIgICAAAiAAIAAAAApGZABOxqRETobsnN3vwAQAACCgICAAAgICIiAgJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="),
  point : atob("AAAAAAA5PEsaoJIAkAEpO0wbkJIZkLKzs5IZGZCRkZGRkZERWzsbGRmptaIBmZEBGRmQARkZsZMQCaGjkQGRkRAJkRBbK0tMKwmx1rPExLPEs6OikkleTEw8SzxLPDsa/38n3CgHqoqBIRGgGwMRFv0KM4AC7BqSQQWqippBEwiYAfsLcqCIuSlWkIjJCTOAAu0ZM5CYCJjNYgP7KSK5GkOomRiRnkIREMmPIoEB+woiEYSsCQpjkpqYGkOxnTKSmKgOhICAgICAAIgACIiAAAiIAIgAiACIAIgAiACIAIiAgIAACAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="),
  opts : { encoding:"adpcm", sampleRate : 8000, overlap : true }
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
let mode = "intro";
let score = { /*score : 0, lvl:0, nuke:0, ammo:12, bombs:10*/ };
let TOP = 20;
let BLDGTOP = build.reduce((v,b)=>Math.min(b.y,v),H); // top of buildings
let FLOOR = 288;
let BOOMSIZE = 30;
let BOOMLIFE = 10;
let frame = 0;

function restartGame() {
  mode = "game";
  initBuildings();
  score = { score : 0, lvl:0, nuke:0, ammo:12, bombs:8 };
  bombs = [];
  for (var i=0;i<2;i++) newBomb();
  drawAll();
}

function newBomb(last) {"ram";
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
  bm.vx = -Math.sin(bm.r)*3;
  bm.vy = Math.cos(bm.r)*3;
  bm.ix = bm.x;
  bm.iy = bm.y;
  newBombs.push(bm);
}

function dist(dx,dy) {
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
  if (score.nuke!==undefined) G.drawString("NUKE: "+score.nuke,325,0);
  G.drawString("SCORE: "+score.score,200,0);
}

function drawAmmo() {
  if (score.ammo>1) G.drawImage(IM.ammo, gun.x-2,FLOOR+5);
  for (var i=1;i<score.ammo;i++) {
    var side = i&1;
    var x = (gun.x+1) + (-1+2*side)*(10+(i>>1)*8);
    G.drawImage(IM.ammo, x,FLOOR+5);
  }
}

function drawGameScreen() {
  frame++;
  let incScore = (frame&3)==0;  
  score.shownAmmo |= 0;
  score.shownBldgs |= 0;
  if (incScore) {
    var click = false;
    if (score.shownAmmo < score.ammo) {
      score.shownAmmo++;
      click = true;
    } else if (!score.showBld) {
      score.showBld = true;
    } else if (score.shownBldgs < build.length) {
      score.shownBldgs++;
      click = true;
    }
    if (click) Pip.audioStartVar(SND.point, SND.opts);
    
  }
  G.clear(1);
  drawScore();
  G.setFontAlign(0,0);
  var scoreAmmo = score.shownAmmo*25;
  var scoreBuild = score.shownBldgs*100;
  G.setColor(3).setFontMonofonto28().drawString("BONUS POINTS", 200, 60);
  G.setColor(2).setFontMonofonto16().drawString("BONUS LANDMARK EVERY 10000 POINTS", 200, 95);
  G.setColor(3).setFontMonofonto23().drawString(scoreAmmo, 100, 140);
  for (var i=0;i<score.shownAmmo;i++) G.drawImage(IM.ammo, 180 + i*15,126, {scale:2});
  if (score.showBld) {
    G.setColor(3).setFontMonofonto23().drawString(scoreBuild, 100, 190);
    build.slice(0,score.shownBldgs).forEach((b,i) => {
      var x = i&3;
      var y = i>>2;
      G.drawImage(b.im, 180+x*40, 200+y*60-G.imageMetrics(b.im).height);
    });
  }
  G.setColor(2).setFontMonofonto18().drawString("CONTINUE", 200, 290);
  G.flip()
}

function drawIntroScreen() {
  G.setFontAlign(0,0);
  G.setColor(((getTime()*1.5)&1)?2:3).setFontMonofonto18().drawString("START GAME", 200, 290);
  G.flip()
}

function drawAll() {
  G.clear(1);
  drawScore();
  drawBuildings();  
}

let redrawBuildings, redrawScore;

function onFrame() {  "ram";
  if (mode == "score") return drawGameScreen();
  if (mode == "intro") return drawIntroScreen();
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
      md : dist(gun.x-gun.tx,gun.y-gun.ty)-10, // max distance 
      v : 10,
      vx : Math.sin(gun.r)*10,
      vy : -Math.cos(gun.r)*10
    };
    missile.x += missile.vx*2;
    missile.y += missile.vy*2;
    Pip.audioStartVar(SND.fire, SND.opts);
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
      if (missile.boom==1) Pip.audioStartVar(SND.explode, SND.opts);
    }
    if (missile.x<0 || missile.x>400 || missile.y<0 || missile.y>FLOOR || missile.boom>BOOMLIFE) {
      redrawBuildings = 1;
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
      score.nuke++;redrawScore=1;
      Pip.audioStartVar(SND.point, SND.opts);
      return false;
    }
    if (missile && missile.boom) {
      let d = dist(missile.x-bm.x,missile.y-bm.y);
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
        Pip.audioStart("USER/atomiccd.wav");
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

let frameInterval = setInterval(onFrame, 50);
let gameInterval = setInterval(function() {
  if (mode=="game") {
    if (score.bombs) {
      score.bombs--;
      newBomb();
    } else if (!bombs.length) {
      mode = "score";
      frame = 0;
    }
    if (!build.length && !nuke.length)
      mode = "score";
  }
}, 5000);

