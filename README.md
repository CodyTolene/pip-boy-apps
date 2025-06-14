<div align="center">
  <img align="center" src=".github/images/logo.png" />
  <h1 align="center">Pip-Apps</h1>
  <p align="center">
    A common repository to house all the great apps and games made by fellow vault-dwellers for the Pip-Boy 3000 Mk V device. Apps are hosted on <a href="https://pip-boy.com/" target="_blank">pip-boy.com</a> and are open-source for all to enjoy.
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

## Notice

![Warning][img-warn] This repository has been archived in favor of the new and
official Pip-Boy 3000 Mk V app loader from The Wand Company. If you would like
to create a new app to be hosted on [Pip-Boy.com](https://pip-boy.com/) please
use the new repository below.

https://github.com/CodyTolene/pip-boy-apps

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Index <a name="index"></a>

- [Website](#website)
- [Playing the Apps/Games](#playing-the-apps-games)
  - [Website Installation](#website-installation)
  - [Manual Installation](#manual-installation)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Pip-App Loader](#pip-app-loader)
  - [Learning app development](#learning-app-development)
  - [Creating a New App/Game](#new-app-game)
  - [Minification](#minification)
- [Directory Structure](#directory-structure)
- [License(s)](#licenses)
- [Terms of Use](#terms)
- [Wrapping Up](#wrapping-up)

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Website <a name="website"></a>

[**Pip-Boy.com**][link-pip-boy]

Install using the website [Apps Inventory Page][link-pip-boy-apps] to start
playing now, or install manually by following the guide
[here](#manual-installation).

Feeling like a Vault-Tec engineer? If you’re interested in developing your own
holotape-style apps, follow the [development guide](#development) below to get
started. Thanks for being part of the Wasteland's growing arcade!

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Playing the Apps/Games <a name="playing-the-apps-games"></a>

### Website <a name="website-installation"></a>

You can install and play apps directly from https://pip-boy.com/. Just connect
to your PC using the website, upload, and start playing!

> ![Info][img-info] Apps and games will be available under the INV > APPS tabs
> on your Pip-Boy device once uploaded.

<p align="right">[ <a href="#index">Index</a> ]</p>

### Manual Installation <a name="manual-installation"></a>

To manually install the apps, you have a few options:

1. Download the releases from
   https://github.com/CodyTolene/pip-apps/tree/releases and upload them to your
   SD card directly.

2. If you need to install the bootloaer, you can use the
   https://codytolene.github.io/pip-apps website to upload the bootloader file
   to your Pip-Boy.

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

### Pip-App Loader <a name="pip-app-loader"></a>

<img src=".github/images/pip-app-loader.png" alt="Pip-App Loader" />

Once you have the project and dependencies [set up](#setup) locally, you can
start the app loader to test your apps and games. To do this, follow these
steps:

1. Run `npm run start` to start the loader app. This is the app you will use to
   rapidly upload and test your app.

2. Open a browser and navigate to `http://localhost:3000` if it doesn't open
   automatically.

3. From here you can connect and upload your app files for quick testing.

> ![Info][img-info] The loader app is also available via GitHub Pages here
> https://codytolene.github.io/pip-apps

<p align="right">[ <a href="#index">Index</a> ]</p>

### Learning app development <a name="learning-app-development"></a>

Interested in learning how to develop apps for the Pip-Boy 3000 Mk V? Check out
the excellent [RobCo Industries Documentation][link-pip-boy-docs] for everything
you need to get started.

For more information on developing bootloader apps, see the [RobCo Industries
Bootloader documentation][link-bootloader-docs].

Special thanks to [@rikkuness][link-github-rikkuness] for the hard work in
providing and maintaining this amazing resource!

<p align="right">[ <a href="#index">Index</a> ]</p>

### Creating a New App/Game <a name="new-app-game"></a>

To create a new app/game, follow these steps:

1. Create a new folder in the `apps` directory. This folder should be named
   `apps/MyAppName` where `MyAppName` is the name of your app. This folder will
   contain all the files and assets for your app. Be sure to use Pascal casing
   for the folder name.

2. Add a package.json file to your app folder. This file should contain the
   following information:

   | Key            | Description                                                               |
   | :------------- | :------------------------------------------------------------------------ |
   | `title`        | The name of your app.                                                     |
   | `id`           | A unique app id that also should match the `.js` file name.               |
   | `version`      | The version of your app.                                                  |
   | `description`  | A brief description of your app.                                          |
   | `author`       | The author of the app.                                                    |
   | `website`      | The website for your app, can be empty.                                   |
   | `contributors` | The contributors to your app, can be empty.                               |
   | `meta`         | Meta information for your app.                                            |
   | `controls`     | The controls for your app, can be empty.                                  |
   | `instructions` | Instructions for your app.                                                |
   | `tip`          | A tip or trick for your app, can be empty.                                |
   | `type`         | The type of app, either "APP" or "GAME".                                  |
   | `pipFiles`     | The production ready files to be uploaded to the Pip.                     |
   | `assets`       | The assets for your app, can be empty. Uploads to `~USER/MyApp/`.         |
   | `boot`         | The bootloader files to be uploaded to the Pip. Uploads to `~USER_BOOT/`. |
   | `modules`      | The modules for your app, can be empty. Uploads to `~node_modules`.       |
   | `user`         | The user files to be uploaded to the Pip. Uploads to `~USER/`.            |

3. Add your code using Git and push to a new branch.

4. Open a pull request to the `main` branch.

5. Wait for the pull request to be reviewed and merged.

Thank you for any and all contributions!

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

### Minification <a name="minification"></a>

To minify your app, you can use the `npm run min` command. This will start a
wizard that will guide you through the process of minifying your app.

1. Select the file you want to minify from the `USER` or `USER_BOOT` directory
   using the up and down arrow keys.
2. Hit enter to select the file.
3. This will output a file to the `USER` or `USER_BOOT` directory with the same
   name as the original file, but with a `.min.js` extension. This is the
   minified version of your app.
4. If you get an error, fix up your files to be compatible with the Espruino
   minification.

You can also use the `npm run min:watch` command to watch for changes in your
chosen file and automatically minify it when you save. This is useful for rapid
development and testing.

> ![Info][img-info] Be sure to update the registry with your minified file name.

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## Directory Structure <a name="directory-structure"></a>

    .
    ├─ .github                     # GitHub configuration files.
    ├─ .husky                      # Husky configuration files.
    ├─ .vscode                     # VS Code configuration files.
    ├─ apps                        # The Pip-App Loader web app (GitHub Pages hosted)
    │  ├─ <...>                    # User created app and game folders.
    │  └─ CODEOWNERS               # User created apps and games (entry file).
    ├─ docs                        # The Pip-App Loader web app (GitHub Pages hosted)
    ├─ node_modules                # Node.js dependencies (ignored).
    ├─ .gitignore                  # Git ignore configuration file.
    ├─ .prettierignore             # Prettier ignore configuration file.
    ├─ LICENSE.md                  # The project license file.
    ├─ package-lock.json           # Node.js package lock file.
    ├─ package.json                # Node.js package file.
    ├─ prettier.config.cjs         # Prettier configuration file.
    ├─ README.md                   # The project README file.
    └─ TERMS.md                    # The project terms of use file.

<p align="right">[ <a href="#index">Index</a> ]</p>

<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->
<!---------------------------------------------------------------------------->

## License(s) <a name="licenses"></a>

This project is licensed under the Creative Commons Attribution-NonCommercial
4.0 International License. See the [license][link-license] file for more
information.

This project uses sounds found on FreeSound.org. The sounds are licensed under
the Creative Commons 0 License. The list of sounds can be found below:

- [`OOF.wav`](https://freesound.org/people/tonsil5/sounds/416839/) by tonsil5
- [`F_STEP.wav`](https://freesound.org/people/MikeFozzy98/sounds/670102/) by
  MikeFozzy98
- [`F_STEP_2.wav`](https://freesound.org/people/gobbe57/sounds/746681/) by
  gobbe57

This project uses music from pixabay.com. This music uses a special license that
allows for free use in personal and commercial projects. More information about
this license can be found here: https://pixabay.com/service/license-summary/

- [`piptris.wav`](https://pixabay.com/music/classical-string-quartet-tetris-theme-korobeiniki-rearranged-arr-for-strings-185592/)

`SPDX-License-Identifiers: CC-BY-NC-4.0, CC0-1.0`

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
[here][link-new-issue].

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

[link-bootloader-docs]: https://log.robco-industries.org/log/entry016/
[link-github-latest-build]:
  https://github.com/CodyTolene/pip-apps/actions/workflows/zip-apps.yml
[link-github-rikkuness]: https://github.com/rikkuness
[link-license]: /LICENSE.md
[link-new-issue]: https://github.com/CodyTolene/pip-apps/issues
[link-pip-boy-apps]: https://pip-boy.com/inv/apps
[link-pip-boy-docs]: https://log.robco-industries.org/documentation/pipboy-3000/
[link-pip-boy]: https://pip-boy.com/
[link-terms]: /TERMS.md
