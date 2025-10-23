# PipBoy Notes

### Info

**Author:** Athene Allen

**Website(s):**

- [Personal Site](https://athene.gay)
- [GitHub](https://github.com/gnargle)

### Description

Simple demo app for the Pip-Boy keyboard library. Stores letters, numbers and
symbols in a note! But more excitingly we now have a pretty usable keyboard
based on the input method from, of all things, Beyond Good and Evil. If you
wanna know how to use the library, check the source of pipBoyNotes.js - the API
is pretty simple :)

### Library Usage

Drop the library in a node_modules folder in the root of your SD card. If you
install this app, it does it for you! To use the library, create a keyboard
object as so:

```js
let pbkb = require('pbkb').initKeyboard();
```

Then open the keyboard 'modal' using

```js
pbkb.textEntryLoop();
```

This will draw to the bC buffer that is always present in the graphics stack.
You MUST stop drawing to any buffer while the keyboard is running else you'll
draw over it (or it'll draw over your app!) I recommend killing any intervals
before calling `textEntryLoop()` and then waiting for the library to finish its
input by setting up man interval that checks `pbkb.finished` every 50ms or so.
The library also needs input on knob1 and will clear any listeners on knob1
during creation. Once you're done, delete the pbkb object to free up memory. If
you need it again recreate - reuse of the object is not supported.

### Controls

- Use the left knob to select your letter.
- Select UPR/LWR/NUM to change alphabet.
- Select END to finish inputting, save your note and quit.

### License(s)

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this
software, either in source code form or as a compiled binary, for any purpose,
commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors of this
software dedicate any and all copyright interest in the software to the public
domain. We make this dedication for the benefit of the public at large and to
the detriment of our heirs and successors. We intend this dedication to be an
overt act of relinquishment in perpetuity of all present and future rights to
this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to https://unlicense.org/
