<div align="center">
  <img align="center" src=".github/images/logo.png" />
  <h1 align="center">Pip-Boy Apps</h1>
  <p align="center">
    A forked repository of the official <a href="https://github.com/thewandcompany/pip-boy" target="_blank">Mod Tool</a> from The Wand Company to house all the great apps and games made by fellow vault-dwellers for the Pip-Boy 3000 Mk V device. Apps are hosted on <a href="https://pip-boy.com/" target="_blank">pip-boy.com</a> and are open-source for all to enjoy.
  </p>
  <p align="center">
    <a href="https://gear.bethesda.net/products/fallout-series-pip-boy-die-cast-replica" target="_blank">
      Bethesda Store
    </a>&nbsp;&#9679;&nbsp;
    <a href="https://www.thewandcompany.com/pip-boy/upgrade/">
      The Wand Company
    </a>&nbsp;&#9679;&nbsp;
    <a href="https://github.com/thewandcompany/pip-boy" target="_blank">
      Official Mod Tool
    </a>&nbsp;&#9679;&nbsp;
    <a href="https://pip-boy.com" target="_blank">
      Pip-Boy.com
    </a>
  </p>
</div>

## Quick Links

Official Software Reference: https://www.espruino.com/Reference

Example apps: https://github.com/espruino/BangleApps

Image converter: https://www.espruino.com/Image%20Converter

## Development

### Writing Apps

Please see the development documentation at [DEVELOPMENT.md](DEVELOPMENT.md) for
more information on writing apps for the Pip-Boy 3000 Mk V by The Wand Company.

### Running the application

1.  Clone the repository and its submodules:

    ```sh
    git clone https://github.com/CodyTolene/pip-boy-apps.git
    git submodule update --init --recursive
    ```

2.  Install Docker:

    https://www.docker.com/

3.  Build the docker image:

    ```sh
    docker build -t pip-boy-mod-tool .
    ```

4.  Run the Docker container:

    ```sh
    # Unix/Linux/macOS
    docker run -dit --name pip-boy-mod-tool -p 8080:80 -v "$PWD":/usr/local/apache2/htdocs/ httpd:2.4
    # Windows Powershell
    docker run -dit --name pip-boy-mod-tool -p 8080:80 -v ${PWD}:/usr/local/apache2/htdocs/ httpd:2.4
    # Windows CMD
    docker run -dit --name pip-boy-mod-tool -p 8080:80 -v %cd%:/usr/local/apache2/htdocs/ httpd:2.4
    ```

    > ![info][img-info] Once you run the application, it will be available at
    > `http://localhost:8080`.

5.  Stop the server any time with:

    ```sh
    docker stop pip-boy-mod-tool
    ```

6.  Clean up:

    ```sh
    docker rm pip-boy-mod-tool
    docker rmi pip-boy-mod-tool
    docker image prune -a
    docker volume prune
    ```

### App JSON Generation

1.  With [Node.js](https://nodejs.org/en) installed, open a new terminal at the
    root of this repo. Install the required Node.js packages:

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

### Manual Minification

Sometimes the built in minification and tokenization doesn't work as expected,
in this case you can run the Espruino minification manually using the following
steps:

1.  With [Node.js](https://nodejs.org/en) installed, open a new terminal at the
    root of this repo. Install the required Node.js packages:

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

### Contributing

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

<!-- IMAGE REFERENCES -->

[img-info]: .github/images/ng-icons/info.svg
[img-warn]: .github/images/ng-icons/warn.svg
