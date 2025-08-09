The following variables are available to you:

```js
LED_RED; //  Red element of RGB LED
LED_GREEN; //  Green element of RGB LED
LED_BLUE; //  Blue element of RGB LED
LED_TUNING; //  Radio tuning indicator LED
BTN_PLAY; //  "Play" button - *** WARNING: No JS code will run if this button is held down during boot! ***
BTN_TUNEUP; //  "Up" button
BTN_TUNEDOWN; //  "Down" button
BTN_TORCH; //  "Flashlight" button
KNOB2_A; //  Thumbwheel encoder A - PA9 for v0.3, PA10 for v0.5
KNOB2_B; //  Thumbwheel encoder B
KNOB1_BTN; //  Left knob "select" button
KNOB1_A; //  Left knob encoder A
KNOB1_B; //  Left knob encoder B
BTN_POWER; //  "Power" button

Pip.on('knob1', (dir) => {
  dir = -1 / 1 / 0;
});
Pip.on('knob2', (dir) => {
  dir = -1 / 1;
});
Pip.on('torch', () => {
  // torch button
});
```

Official Software Reference: https://www.espruino.com/Reference
