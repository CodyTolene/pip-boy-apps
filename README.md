<div align="center">
  <img align="center" src=".github/images/logo.png" height="400" />
  <h1 align="center">Pip-Boy Apps</h1>
  <p align="center">
    A forked repository of the official <a href="https://github.com/thewandcompany/pip-boy" target="_blank">Mod Tool</a> from The Wand Company to house all the great apps and games made by fellow vault-dwellers for the Pip-Boy 3000 Mk V device. Apps are hosted on <a href="https://pip-boy.com/" target="_blank">pip-boy.com</a> and are open-source for all to enjoy.
  </p>
  <p align="center">
    <a href="https://pip-boy.com" target="_blank">
      Pip-Boy.com
    </a>&nbsp;|&nbsp;
    <a href="https://discord.com/invite/zQmAkEg8XG" target="_blank">
      Discord Community
    </a>
  </p>
  <p align="center">
    <a href="https://gear.bethesda.net/products/fallout-series-pip-boy-die-cast-replica" target="_blank">
      Bethesda Store
    </a>&nbsp;|&nbsp;
    <a href="https://www.thewandcompany.com/pip-boy/upgrade/">
      The Wand Company
    </a>&nbsp;|&nbsp;
    <a href="https://github.com/thewandcompany/pip-boy" target="_blank">
      Official Mod Tool
    </a>
  </p>
  <p align="center">
    <a href="https://www.espruino.com/Reference" target="_blank">
      Espruino Reference
    </a>&nbsp;|&nbsp;
    <a href="https://github.com/espruino/BangleApps">
      Bangle Apps
    </a>&nbsp;|&nbsp;
    <a href="https://www.espruino.com/Image%20Converter">
      Bangle Images
    </a>
  </p>
</div>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Index <a name="index"></a>

- [Getting Started](#getting-started)
- [Mod Tool](#mod-tool)
- [App List](#app-list)
- [Minification](#minification)
- [Contributing](#contributing)

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Getting Started <a name="getting-started"></a>

If you put a JS file in the `USER` folder, Pip-Boy will show it in a list of
apps in the `INV` screen.

- `g` is a graphics instance that writes direct to the screen.

- `bC` is a graphics instance that writes to a 2 bit offscreen buffer, and
  calling `bC.flip()` will flip that buffer to the screen with a scanline
  effect.

More details here: [API.md](API.md)

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Running the Pip-Boy Mod Tool <a name="mod-tool"></a>

### Local server

1.  Clone the repository and its submodules:

    ```sh
    git clone https://github.com/CodyTolene/pip-boy-apps.git
    git submodule update --init --recursive
    ```

2.  Install dependencies:

    ```sh
    npm install
    ```

3.  Start the local server:

    ```sh
    npm run serve
    ```

    > ![info][img-info] The app will be available at
    > [http://localhost:8080](http://localhost:8080).

## App JSON Generation <a name="app-list"></a>

1.  With [Node.js][link-node-js] installed, open a new terminal at the root of
    this repo. Install the required Node.js packages:

    ```sh
    npm install
    ```

2.  Run the app generation script:

    ```sh
    npm run build
    ```

    > ![info][img-info] This will generate a file called `apps.local.json` in
    > the root of the repository.

    > ![info][img-info] You can also use jekyll to generate the
    > `apps.local.json` file by running `jekyll build`.

    > ![warn][img-warn] Do not commit this file to the repository, it is
    > generated automatically and should not be tracked by Git.

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Manual Minification <a name="minification"></a>

Sometimes the built in minification and tokenization doesn't work as expected,
in this case you can run the Espruino minification manually using the following
steps:

1.  With [Node.js][link-node-js] installed, open a new terminal at the root of
    this repo. Install the required Node.js packages:

    ```sh
    npm install
    ```

2.  Run the minification script:

    ```sh
    npm run min
    ```

    OR for live updates:

    ```sh
    npm run min:watch
    ```

    > ![info][img-info] Press CTRL+C to stop the live update script.

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Contributing <a name="contributing"></a>

1.  Make sure to run the following commands before committing any changes:

    ```sh
    npm run prettier
    ```

    > ![info][img-info] This will format all files in the repository according
    > to the Prettier configuration.

2.  Add and commit your changes:

    ```sh
    git add .
    git commit -m "Your commit message"
    ```

3.  Push your changes and create a pull request.

4.  Further details on contributing can be found in the
    [CONTRIBUTING.md](CONTRIBUTING.md) file.

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

<!-- IMAGE REFERENCES -->

[img-info]: .github/images/ng-icons/info.svg
[img-warn]: .github/images/ng-icons/warn.svg

<!-- LINK REFERENCES -->

[link-node-js]: https://nodejs.org/en
