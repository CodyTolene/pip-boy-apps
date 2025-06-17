# Pip-Boy Mod Tool

A tool to modify your pip-boy by adding apps and changing settings.

## Writing apps

If you put a JS file in the USER folder, Pip-Boy will
show it in a list of apps in the `INV` screen.

The following variables are available to you:

```JS
LED_RED             //  Red element of RGB LED
LED_GREEN           //  Green element of RGB LED
LED_BLUE            //  Blue element of RGB LED
LED_TUNING          //  Radio tuning indicator LED
BTN_PLAY            //  "Play" button - *** WARNING: No JS code will run if this button is held down during boot! ***
BTN_TUNEUP          //  "Up" button
BTN_TUNEDOWN        //  "Down" button
BTN_TORCH           //  "Flashlight" button
KNOB2_A             //  Thumbwheel encoder A - PA9 for v0.3, PA10 for v0.5
KNOB2_B             //  Thumbwheel encoder B
KNOB1_BTN           //  Left knob "select" button
KNOB1_A             //  Left knob encoder A
KNOB1_B             //  Left knob encoder B
BTN_POWER           //  "Power" button

Pip.on("knob1", (dir)=> {
  dir = -1 / 1 / 0;
});
Pip.on("knob2", (dir)=> {
  dir = -1 / 1;
});
Pip.on("torch", ()=> {
  // torch button
});
```

- `g` is a graphics instance that writes direct to the screen
- `bC` is a graphics instance that writes to a 2 bit offscreen buffer, and calling
  `bC.flip()` will flip that buffer to the screen with a scanline effect.

You should create a function `Pip.removeSubmenu()` that removes your app from memory (eg clears all intervals, removes all event listeners added).

## Build and run locally

To build and run this application locally using Docker:

```sh
git clone https://github.com/thewandcompany/pip-boy.git
git submodule update --init --recursive
docker build -t pip-boy-mod-tool .
docker run -dit --name pip-boy-mod-tool -p 8080:80 pip-boy-mod-tool
```

Alternatively, for quick local development with automatic file reloading, you can skip building the image and run it directly with:

```sh
# Unix/Linux/macOS
docker run -dit --name pip-boy-mod-tool -p 8080:80 -v "$PWD":/usr/local/apache2/htdocs/ httpd:2.4
# Windows Powershell
docker run -dit --name pip-boy-mod-tool -p 8080:80 -v ${PWD}:/usr/local/apache2/htdocs/ httpd:2.4
# Windows with CMD
docker run -dit --name pip-boy-mod-tool -p 8080:80 -v %cd%:/usr/local/apache2/htdocs/ httpd:2.4
```

Once you run the application, it will be available at `http://localhost:8080`. You can stop the server any time with:

```sh
docker stop pip-boy-mod-tool
```

When you're finished with Docker, you can clean up with:

```sh
docker rm pip-boy-mod-tool
docker rmi pip-boy-mod-tool
docker image prune -a
docker volume prune
```
