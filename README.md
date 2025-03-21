<div align="center">
  <img align="center" src=".github/images/logo.png" />
  <h1 align="center">Pip-Apps</h1>
  <p align="center">
    A common repository to house all the great games made by fellow vault-dwellers for the Pip-Boy 3000 Mk V device. Games are hosted on <a href="https://pip-boy.com/" target="_blank">pip-boy.com</a> and are open-source for all to enjoy.
  </p>
  <p align="center">
    Purchase the device from the Bethesda store 
    <a href="https://gear.bethesda.net/products/fallout-series-pip-boy-die-cast-replica">
      here</a>. View the official upgrade site 
    <a href="https://www.thewandcompany.com/pip-boy/upgrade/">
      here</a>.
  </p>
</div>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Index <a name="index"></a>

- [Web App](#web-app)
- [Playing the Apps/Games](#playing-the-apps-games)
  - [Website Installation](#website-installation)
  - [Manual Installation](#manual-installation)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Game Loader](#game-loader)
  - [Creating a New Game](#new-game)
- [License(s)](#licenses)
- [Terms of Use](#terms)
- [Wrapping Up](#wrapping-up)

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Web App <a name="web-app"></a>

[**Pip-Boy.com**](https://pip-boy.com/)

Just here to have some fun? Head over to the
[Apps Inventory](https://pip-boy.com/inv/apps) and start playing right from
your Pip-Boy’s interface, no fuss, no power armor required. Otherwise you can
install manually using this repository, follow that guide
[here](#manual-installation) to get started.

Feeling like a Vault-Tec engineer? If you’re interested in developing your own
holotape-style games and apps, follow the [development guide](#development) below to get
started. Thanks for being part of the Wasteland's growing arcade!

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Playing the Apps/Games <a name="playing-the-apps-games"></a>

### Website <a name="website-installation"></a>

You can install and play games directly from https://pip-boy.com/inv/games. Just
connect to your PC using the website and start playing!

> ![Info][img-info] Games will be available under the INV > APPS tabs on your
> Pip-Boy device once uploaded.

<p align="right">[ <a href="#index">Index</a> ]</p>

### Manual Installation <a name="manual-installation"></a>

To manually install the games, you have a few options:

1. Upload the zip file from the
   [latest release](https://github.com/CodyTolene/pip-apps/releases) page to
   the device using the Zip upload tool here:
   https://pip-boy.com/data/maintenance. This is the easiest option and doesn't
   require you to remove the SD card.

2. Copy the entire USER folder from this repository over to the root of the SD
   card. This will overwrite any existing games and settings. This requires you
   to remove the SD card though, so probably not the best option.

3. Use the development process below, which is meant for rapidly testing games
   and features. This requires a bit of setup but is the most flexible option.

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Development <a name="development"></a>

### Prerequisites <a name="prerequisites"></a>

To get started with development, you will need the following:

- Node.js: https://nodejs.org/en/download/
- An IDE, preferably Visual Studio Code: https://code.visualstudio.com/download
- A bit of knowledge on how to use a terminal (you're a Vault-Tec engineer after
  all)

<p align="right">[ <a href="#index">Index</a> ]</p>

### Setup <a name="setup"></a>

To get set up for development, follow these steps:

1. Clone the repository.

2. Run `npm install` in a new terminal at the root of this project, to install
   the project dependencies.

3. Run `npm install -g espruino` to install the Espruino CLI globally for
   communicating with your device.

<p align="right">[ <a href="#index">Index</a> ]</p>

### Game Loader <a name="game-loader"></a>

Once you have the project and dependencies [set up](#setup) locally, you can
start the game loader to test your apps and games. To do this, follow these steps:

1. Run `npm run loader` to start the loader app. This is the app you will use to
   rapidly upload and test your game.

2. Open a browser and navigate to `http://localhost:3000` if it doesn't open
   automatically.

3. From here you can connect and upload your game files for quick testing.

<p align="right">[ <a href="#index">Index</a> ]</p>

### Creating a New Game <a name="new-game"></a>

To create a new game, follow these steps:

1. Create a new js file using pascal casing (ie `MyGame.js`) in the `USER`
   folder. This will be the entry point for your game.

2. Test by using the upload tool in the [game loader](#game-loader).

3. Update the `USER/_registry.json` file with the new game information. This
   meta will be used on the website to help users and possibly on the Pip-Boy at
   a later date.

   ```diff
   [
     {
         ...
   + },
   + {
   +      "author": "My name...",
   +      "description": "My game description...",
   +      "id": "MyGameNamePascalCased",
   +      "homepage": "",
   +      "instructions": "My game instructions...",
   +      "tip": "",
   +      "version": "1.0.0"
   + }
   ]
   ```

   > ![Info][img-info] It's ok to leave `homepage` and `tip` blank if you don't
   > have a website or tip to share.

4. Add your code using Git and push to a new branch.

5. Open a pull request to the `main` branch.

6. Wait for the pull request to be reviewed and merged.

Thank you for any and all contributions!

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## License(s) <a name="licenses"></a>

This project is licensed under the Creative Commons Attribution-NonCommercial
4.0 International License. See the [license][link-license] file for more
information.

`SPDX-License-Identifiers: CC-BY-NC-4.0`

> ![Warn][img-warn] By using this software, you acknowledge and agree to the
> terms of these licenses.

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Terms of Use <a name="terms"></a>

Bethesda Softworks, LLC. The Wand Company, all trademarks, logos, and brand
names are the property of their respective owners. This project is for personal
use only and is not intended for commercial purposes. Use of any materials is at
your own risk.

> ![Info][img-info] For more information, see the full [Terms of
> Use][link-terms] document.

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Wrapping Up <a name="wrapping-up"></a>

Thank you to Bethesda & The Wand Company for such a fun device to tinker with!
If you have any questions, please let me know by opening an issue
[here][url-new-issue].

| Type                                                                      | Info                                                           |
| :------------------------------------------------------------------------ | :------------------------------------------------------------- |
| <img width="48" src=".github/images/ng-icons/email.svg" />                | webmaster@codytolene.com                                       |
| <img width="48" src=".github/images/simple-icons/github.svg" />           | https://github.com/sponsors/CodyTolene                         |
| <img width="48" src=".github/images/simple-icons/buymeacoffee.svg" />     | https://www.buymeacoffee.com/codytolene                        |
| <img width="48" src=".github/images/simple-icons/bitcoin-btc-logo.svg" /> | bc1qfx3lvspkj0q077u3gnrnxqkqwyvcku2nml86wmudy7yf2u8edmqq0a5vnt |

Fin. Happy programming friend!

Cody Tolene

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

<!-- IMAGE REFERENCES -->

[img-info]: .github/images/ng-icons/info.svg
[img-warn]: .github/images/ng-icons/warn.svg

<!-- LINK REFERENCES -->

[link-license]: /LICENSE.md
[link-terms]: /TERMS.md
[url-new-issue]: https://github.com/CodyTolene/pip-apps/issues
