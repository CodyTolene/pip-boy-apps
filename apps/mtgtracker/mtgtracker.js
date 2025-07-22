// =============================================================================
//  Name: MTG Life Tracker
//  License: CC-BY-NC-4.0
//  Repositories:
//    https://github.com/tylerjbartlett/pip-boy-apps
//    MY GITHUB
// =============================================================================

function MTGTracker() {
  const self = {};

  // General
  const APP_NAME = 'MTG Life Counter';
  const APP_VERSION = '1.0.0';

  // Menu variables
  const MENU_MAIN_OPTIONS = ['New Game', 'Help', 'Exit']; //''New Game', 'Resume Game', 'Help', 'Exit'];'
  const MENU_GAME_NEW_OPTIONS = [
    'Player Count',
    'Standard (20HP)',
    'Commander (40HP & 21HP)',
    'Back',
  ];
  const MENU_GAME_RESUME_OPTIONS = ['Yes', 'Back'];
  const MENU_INGAME_OPTIONS = [
    'Reset Current Game',
    'New Game',
    `Exit ${APP_NAME}`,
  ];
  const HELP_TEXT =
    'Need help with Controls?!\n  Check the readme on GitHub.\nThis app is a work in progress.\n  Report bugs on GitHub.\nThank you for using my app!\n-Tyler';
  let menuDisplayed = 'main'; // Track which menu is currently displayed
  let menuIndexSelected = 0; // Track the current selection in the menu

  // Game variables
  const PLAYER_COUNT_MIN = 1;
  const PLAYER_COUNT_MAX = 4;
  const GAME_STANDARD_HP = 20; // Standard game HP
  const GAME_COMMANDER_HP = 40; // Commander game HP
  const GAME_DATA_FILE_PATH = 'USER/mtgtracker_gamedata.json';
  let playerCount = 1; // Default to 1 players
  let gameType = 'standard'; // Default game type
  let inGame = false; // Track if a game is currently in progress
  let PLAYERS = [];
  let playerIndexSelected = 0; // Track the currently selected player index
  let commanderDamageSourcesCount;

  // Screen
  const SCREEN_WIDTH = g.getWidth(); // Width (480px)
  const SCREEN_HEIGHT = g.getHeight(); // Height (320px)
  const SHOW_MENU_BOUNDRIES = true;

  // UX Mapping
  const SCREEN_XY = {
    x1: 60,
    y1: 40,
    x2: SCREEN_WIDTH - 60,
    y2: SCREEN_HEIGHT - 20,
  };
  const TITLE_XY = {
    x1: SCREEN_XY.x1,
    y1: 10,
    x2: SCREEN_XY.x2,
    y2: SCREEN_XY.y2,
  };
  const MENU_HEADER_XY = {
    x1: SCREEN_XY.x1 + 10,
    y1: SCREEN_XY.y1 + 10,
    x2: SCREEN_XY.x2 - 10,
    y2: SCREEN_XY.y1 + 35,
  };
  const MENU_XY = {
    x1: MENU_HEADER_XY.x1,
    y1: MENU_HEADER_XY.y2 + 5,
    x2: MENU_HEADER_XY.x2,
    y2: SCREEN_XY.y2 - 20,
  };
  const TOP_HALF_XY = {
    x1: SCREEN_XY.x1,
    y1: SCREEN_XY.y1,
    x2: SCREEN_XY.x2,
    y2: (SCREEN_XY.y2 + SCREEN_XY.y1) / 2 - 10,
  };
  const BOTTOM_HALF_XY = {
    x1: TOP_HALF_XY.x1,
    y1: TOP_HALF_XY.y2 + 5,
    x2: SCREEN_XY.x2,
    y2: SCREEN_XY.y2 - 15,
  };
  const TOP_LEFT_XY = {
    x1: TOP_HALF_XY.x1,
    y1: TOP_HALF_XY.y1,
    x2: (SCREEN_XY.x2 + SCREEN_XY.x1) / 2 - 2,
    y2: TOP_HALF_XY.y2,
  };
  const TOP_RIGHT_XY = {
    x1: TOP_LEFT_XY.x2 + 4,
    y1: TOP_HALF_XY.y1,
    x2: TOP_HALF_XY.x2,
    y2: TOP_HALF_XY.y2,
  };
  const BOTTOM_LEFT_XY = {
    x1: TOP_LEFT_XY.x1,
    y1: BOTTOM_HALF_XY.y1,
    x2: TOP_LEFT_XY.x2,
    y2: BOTTOM_HALF_XY.y2,
  };
  const BOTTOM_RIGHT_XY = {
    x1: TOP_RIGHT_XY.x1,
    y1: BOTTOM_HALF_XY.y1,
    x2: TOP_RIGHT_XY.x2,
    y2: BOTTOM_HALF_XY.y2,
  };

  // Physical interfaces
  const KNOB_LEFT = 'knob1';
  const KNOB_RIGHT = 'knob2';
  const BTN_TOP = 'torch';
  const KNOB_DEBOUNCE = 10;
  let lastLeftKnobTime = 0;
  let inputInterval = null; // for radion button click

  // Footer
  const INTERVAL_FOOTER_MS = 49.99923706054;
  let footerInterval = null;

  // Colors
  const BLACK = '#000000';
  const GREEN = '#00ff00';
  const GREEN_DARK = '#007f00';
  const GREEN_DARKER = '#003300';

  function Player(index, name, currentLife) {
    this.index = index;
    this.name = name;
    this.currentLife = currentLife;
    this.commanderDamageSources = [];
  }

  function CommanderDamageSource(index, sourceName) {
    this.index = index;
    this.fromSource = sourceName;
    this.amount = 0;
  }

  // function GameData (gameSaved, type, pCount, players) {
  //   this.gameSaved = gameSaved;
  //   this.gameType = type;
  //   this.playerCount = pCount;
  //   this.players = players;
  // }

  function limitNumberWithinRange(num, min, max) {
    const parsed = parseInt(num);
    return Math.min(Math.max(parsed, min), max);
  }

  function clearFooterBar() {
    if (footerInterval) {
      clearInterval(footerInterval);
    }

    footerInterval = null;
  }

  function clearScreenArea(area) {
    g.setColor(BLACK).fillRect(area);
  }

  function drawFooterBar() {
    clearFooterBar();
    footerInterval = setInterval(() => {
      drawFooter();
    }, INTERVAL_FOOTER_MS);
  }

  function drawBoundaries(area) {
    g.setColor(GREEN_DARKER).drawRect(area.x1, area.y1, area.x2, area.y2);
  }

  function drawMenuBoundries() {
    if (SHOW_MENU_BOUNDRIES === false) return;

    drawBoundaries(SCREEN_XY);
    drawBoundaries(MENU_HEADER_XY);
    drawBoundaries(MENU_XY);
  }

  function drawGameBoundries() {
    switch (playerCount) {
      case 1:
        drawBoundaries(SCREEN_XY);
        break;
      case 2:
        drawBoundaries(TOP_HALF_XY);
        drawBoundaries(BOTTOM_HALF_XY);
        break;
      case 3:
        drawBoundaries(TOP_LEFT_XY);
        drawBoundaries(TOP_RIGHT_XY);
        drawBoundaries(BOTTOM_HALF_XY);
        break;
      case 4:
        drawBoundaries(TOP_LEFT_XY);
        drawBoundaries(TOP_RIGHT_XY);
        drawBoundaries(BOTTOM_LEFT_XY);
        drawBoundaries(BOTTOM_RIGHT_XY);
        break;
    }
  }

  function drawAppTitleAndVersion() {
    const appName = APP_NAME.toUpperCase();
    const appVersion = 'v' + APP_VERSION;
    const padding = 70;
    const titleWidth = g.stringWidth(appName);

    g.setColor(GREEN)
      .setFontAlign(-1, -1, 0) // Align left-top
      .setFontMonofonto23() // 18, 16, 23, 28 36
      .drawString(appName, TITLE_XY.x1, TITLE_XY.y1);

    g.setColor(GREEN_DARK)
      .setFontAlign(-1, -1, 0) // Align left-top
      .setFont('4x6', 2) // 4x6, 6x8
      .drawString(
        appVersion,
        TITLE_XY.x1 + titleWidth + padding, //+ titleWidth
        TITLE_XY.y1 + 14, // Adjust y position to match the title
      );
  }

  function drawMenuHeader(text) {
    // Clear the previous menu area
    clearScreenArea(MENU_HEADER_XY);

    const padding = 5;

    g.setColor(GREEN)
      .setFontAlign(-1, -1, 0) // Align left-top
      .setFontMonofonto16()
      .drawString(
        text.toUpperCase(),
        MENU_HEADER_XY.x1,
        MENU_HEADER_XY.y1 + padding,
      );
  }

  function drawMenu(menuOptions) {
    // Clear the previous menu area
    clearScreenArea(MENU_XY);

    // Set up the font and alignment
    g.setFontMonofonto16().setFontAlign(-1, -1, 0);

    const padding = 5;
    const rowHeight = 20;

    // Draw each menu option
    menuOptions.forEach((option, index) => {
      const y = MENU_XY.y1 + index * rowHeight + padding;
      let menuOption = option;
      if (
        menuDisplayed === 'gameNew' &&
        index === 0 &&
        menuIndexSelected === 0
      ) {
        menuOption = `Player Count: < ${playerCount} >`;
      } else if (menuDisplayed === 'gameNew' && index === 0) {
        menuOption = `Player Count: ${playerCount}`;
      } else if (
        menuDisplayed === 'commanderDamage' &&
        option.index === menuIndexSelected
      ) {
        menuOption = ` ${option.fromSource}: < ${option.amount} >`;
      } else if (menuDisplayed === 'commanderDamage') {
        menuOption = ` ${option.fromSource}: ${option.amount}`;
      }
      g.setColor(index === menuIndexSelected ? GREEN : GREEN_DARK).drawString(
        menuOption,
        MENU_XY.x1 + padding,
        y,
        true,
      );
    });

    drawMenuBoundries();
  }

  function drawMenuHelp() {
    menuIndexSelected = 0;
    drawMenuHeader('Help');

    // Clear the previous menu area
    clearScreenArea(MENU_XY);

    // Set up the font and alignment
    g.setFontMonofonto16().setFontAlign(-1, -1, 0);

    const padding = 5;
    const rowHeight = 20;

    // Draw the help text
    const helpTextLines = HELP_TEXT.split('\n');
    helpTextLines.forEach((line, index) => {
      const y = MENU_XY.y1 + index * rowHeight + padding;
      g.setColor(GREEN_DARK).drawString(line, MENU_XY.x1 + padding, y, true);
    });

    // Draw the back option at the bottom
    const backY = MENU_XY.y2 - rowHeight - padding;
    g.setColor(GREEN).drawString('Back', MENU_XY.x1 + padding, backY, true);

    drawMenuBoundries();
  }

  function menuLoad(menuOptions, menuHeader) {
    menuIndexSelected = 0;
    drawMenuHeader(menuHeader);
    drawMenu(menuOptions);
  }

  function drawPlayerTile(area, player) {
    // Clear the player tile
    clearScreenArea(area);

    // Set up the font and alignment
    if (playerCount === 1) {
      g.setFontMonofonto28().setFontAlign(0, -1, 0);
    } else {
      g.setFontMonofonto23().setFontAlign(0, -1, 0);
    }

    const paddingY = 10;
    const rowHeight = 24;

    // Draw the player's name
    const playerNameX = (area.x1 + area.x2) / 2; // ((area.x1 + area.x2) / 2) - g.stringWidth(player.name) + paddingX;
    const playerNameY = area.y1 + paddingY;
    g.setColor(
      playerIndexSelected === player.index ? GREEN : GREEN_DARK,
    ).drawString(player.name, playerNameX, playerNameY, true);

    // Draw the player's current life total
    let strLifeTotal = player.currentLife;
    if (playerIndexSelected === player.index) {
      strLifeTotal = `< ${player.currentLife} >`;
    }
    const lifeTotalX = (area.x1 + area.x2) / 2; //((area.x1 + area.x2) / 2) - (g.stringWidth(strLifeTotal)) + paddingX - 20;
    const lifeTotalY = (area.y1 + area.y2) / 2 - rowHeight / 2 + paddingY;
    g.setColor(
      playerIndexSelected === player.index ? GREEN : GREEN_DARK,
    ).drawString(strLifeTotal, lifeTotalX, lifeTotalY, true);

    // draw the commander damage text prompt if needed
    if (gameType === 'commander' && playerIndexSelected === player.index) {
      const commanderPrompt = '* -> EDH dmg';
      const commanderPromptX = 5 + area.x1;
      let commanderPromptY = area.y2 - rowHeight + 5;
      if (playerCount === 1) {
        commanderPromptY += -10; // battery bar covers this
      }

      g.setColor(playerIndexSelected === player.index ? GREEN : GREEN_DARK)
        .setFontAlign(-1, -1, 0)
        .setFont('6x8', 2) // 4x6, 6x8
        .drawString(commanderPrompt, commanderPromptX, commanderPromptY, true);
    }

    drawGameBoundries();
  }

  function drawGameBoard() {
    // Clear the screen area for the game board
    clearScreenArea(SCREEN_XY);

    // Set up the font and alignment
    g.setFontMonofonto16().setFontAlign(-1, -1, 0);

    // Draw each player's life total
    switch (playerCount) {
      case 1:
        drawPlayerTile(SCREEN_XY, PLAYERS[0]);
        break;
      case 2:
        drawPlayerTile(TOP_HALF_XY, PLAYERS[1]);
        drawPlayerTile(BOTTOM_HALF_XY, PLAYERS[0]);
        break;
      case 3:
        drawPlayerTile(TOP_LEFT_XY, PLAYERS[1]);
        drawPlayerTile(TOP_RIGHT_XY, PLAYERS[2]);
        drawPlayerTile(BOTTOM_HALF_XY, PLAYERS[0]);
        break;
      case 4:
        drawPlayerTile(TOP_LEFT_XY, PLAYERS[1]);
        drawPlayerTile(TOP_RIGHT_XY, PLAYERS[2]);
        drawPlayerTile(BOTTOM_LEFT_XY, PLAYERS[0]);
        drawPlayerTile(BOTTOM_RIGHT_XY, PLAYERS[3]);
        break;
    }

    drawGameBoundries();
  }

  function menuScroll(dir) {
    switch (menuDisplayed) {
      case 'main':
        menuIndexSelected = limitNumberWithinRange(
          menuIndexSelected + dir,
          0,
          MENU_MAIN_OPTIONS.length - 1,
        );
        drawMenu(MENU_MAIN_OPTIONS);
        break;
      case 'gameNew':
        menuIndexSelected = limitNumberWithinRange(
          menuIndexSelected + dir,
          0,
          MENU_GAME_NEW_OPTIONS.length - 1,
        );
        drawMenu(MENU_GAME_NEW_OPTIONS);
        break;
      case 'gameResume':
        menuIndexSelected = limitNumberWithinRange(
          menuIndexSelected + dir,
          0,
          MENU_GAME_RESUME_OPTIONS.length - 1,
        );
        drawMenu(MENU_GAME_RESUME_OPTIONS);
        break;
      case 'commanderDamage':
        menuIndexSelected = limitNumberWithinRange(
          menuIndexSelected + dir,
          0,
          PLAYERS[playerIndexSelected].commanderDamageSources.length - 1,
        );
        drawMenu(PLAYERS[playerIndexSelected].commanderDamageSources);
        break;
      case 'inGameOptions':
        menuIndexSelected = limitNumberWithinRange(
          menuIndexSelected + dir,
          0,
          MENU_INGAME_OPTIONS.length - 1,
        );
        drawMenu(MENU_INGAME_OPTIONS);
        break;
    }
  }

  function playerScroll(dir) {
    if (inGame === false) return;
    playerIndexSelected = limitNumberWithinRange(
      playerIndexSelected + dir,
      0,
      PLAYERS.length - 1,
    );
    drawGameBoard();
  }

  function gameStart() {
    inGame = true;
    menuDisplayed = '';

    clearScreenArea(SCREEN_XY);

    let startingHP = GAME_STANDARD_HP;
    if (gameType === 'commander') {
      startingHP = GAME_COMMANDER_HP;
    }

    // clear players array for a new game
    PLAYERS.splice(0, PLAYERS.length);
    for (let i = 0; i < playerCount; i++) {
      const player = new Player(i, `Player ${i + 1}`, startingHP);

      commanderDamageSourcesCount = playerCount;
      if (commanderDamageSourcesCount === 1) {
        commanderDamageSourcesCount = 6;
      }
      for (let j = 0; j < commanderDamageSourcesCount; j++) {
        const source = new CommanderDamageSource(j, `Player ${j + 1}`);
        player.commanderDamageSources.push(source);
      }

      PLAYERS.push(player);
    }

    playerIndexSelected = 0;

    drawGameBoard();

    inputInterval = setInterval(() => {
      if (BTN_PLAY.read()) {
        // clearInterval(inputInterval);
        if (inGame === true && menuDisplayed != 'inGameOptions') {
          menuDisplayed = 'inGameOptions';
          menuLoad(MENU_INGAME_OPTIONS, 'Game Options');
        } else if (true && menuDisplayed === 'inGameOptions') {
          menuDisplayed = '';
          drawGameBoard();
        }
      }
    }, 250);
  }

  /*
   * Game saving seemed to function fine, but game loading may have caused memory issues.
   * It would be nice to keep a save state in-case the app was closed in the middle of a game, but its not a priority to fix.
   */

  // function gameResume() {

  // }

  // function gameSave () {
  //   // lastGameDate = new Date(Date.now()).toLocalISOString();

  //   let gameData = new GameData(true, gameType, playerCount, PLAYERS);
  //   let jsonGameData = JSON.stringify(gameData);

  //   // gameData = null;
  //   // drawMenu([jsonGameData]);
  //   try {
  //     require("fs").writeFileSync(GAME_DATA_FILE_PATH, jsonGameData);
  //   }
  //   catch (e) {
  //     // E.showMessage(`gameSave error:${e}`);
  //   }
  // }

  // function gameLoad () {
  //   try {
  //     let jsonGameData = require("fs").readFileSync(GAME_DATA_FILE_PATH);
  //     let gameData = JSON.parse(jsonGameData); // seems to run out of memory? screen goes black.
  //     // jsonGameData = null;
  //     if (gameData.gameSaved === true) {
  //       gameType = gameData.gameType;
  //       playerCount = gameData.playerCount;
  //       PLAYERS = gameData.players;
  //     }
  //     // gameData = null;
  //     // E.showMessage(`last game: ${gameData.lastGameDatedate}`);

  //     setTimeout(function() {
  //       // Code to execute after the 2-second wait
  //       // if (gameData.gameSaved === true) {
  //       //   lastGameDate = gameData.date;
  //       //   gameType = gameData.gameType;
  //       //   playerCount = gameData.playerCount;
  //       //   PLAYERS = gameData.players;
  //       // }
  //       // jsonGameData = null;
  //       // gameData = null;
  //       drawMenu([`${gameType}, ${playerCount}p`],);
  //     }, 2000);

  //   }
  //   catch(e) {
  //     E.showMessage(`gameLoad error:${e}`);
  //   }
  // }

  function handleLeftKnob(dir) {
    let now = Date.now();
    if (now - lastLeftKnobTime < KNOB_DEBOUNCE) {
      return;
    }
    lastLeftKnobTime = now;

    if (dir !== 0 && inGame === false) {
      return menuScroll(dir * -1);
    } else if (dir === 0 && inGame === false) {
      // handle in-menu actions
      switch (true) {
        case menuDisplayed === 'main' && menuIndexSelected === 0:
          menuDisplayed = 'gameNew';
          menuLoad(MENU_GAME_NEW_OPTIONS, 'New Game');
          break;
        // case menuDisplayed === 'main' && menuIndexSelected === 1:  // would need to be added back to allow for resuming in-progress games.
        //   menuDisplayed = 'gameResume';
        //   menuLoad(MENU_GAME_RESUME_OPTIONS, 'Resume Game');
        //   break;
        case menuDisplayed === 'main' && menuIndexSelected === 1: // 2  index offset when the resume game feature was removed.
          menuDisplayed = 'help';
          drawMenuHelp();
          break;
        case menuDisplayed === 'main' && menuIndexSelected === 2: // 3:  exit app
          handlePowerButton();
          break;
        case menuDisplayed === 'gameNew' && menuIndexSelected === 0:
          // do nothing. player count changed by RIGHT_KNOB
          break;
        case menuDisplayed === 'gameNew' && menuIndexSelected === 1: // standard game
          gameType = 'standard';
          gameStart();
          break;
        case menuDisplayed === 'gameNew' && menuIndexSelected === 2: // commander game
          gameType = 'commander';
          gameStart();
          break;
        case menuDisplayed === 'gameNew' && menuIndexSelected === 3:
          menuDisplayed = 'main';
          menuLoad(MENU_MAIN_OPTIONS, 'Main Menu');
          break;
        case menuDisplayed === 'gameResume' && menuIndexSelected === 0:
          // TODO: Implement resume game logic
          // resumeGame();
          break;
        case menuDisplayed === 'gameResume' && menuIndexSelected === 1:
          menuDisplayed = 'main';
          drawMenuHeader('Main Menu');
          menuLoad(MENU_MAIN_OPTIONS, 'Main Menu');
          break;
        case menuDisplayed === 'help' && menuIndexSelected === 0:
          menuDisplayed = 'main';
          menuLoad(MENU_MAIN_OPTIONS, 'Main Menu');
          break;
      }
      menuIndexSelected = 0;
    } else if (dir !== 0 && inGame === true) {
      if (menuDisplayed === 'commanderDamage') {
        menuScroll(dir * -1);
      } else if (menuDisplayed === 'inGameOptions') {
        menuScroll(dir * -1);
      } else {
        return playerScroll(dir);
      }
    } else if (dir === 0 && inGame === true) {
      // draw a commander damage prompt if needed
      if (
        gameType === 'commander' &&
        menuDisplayed != 'commanderDamage' &&
        menuDisplayed != 'inGameOptions'
      ) {
        menuDisplayed = 'commanderDamage';
        menuLoad(
          PLAYERS[playerIndexSelected].commanderDamageSources,
          `Who Dealt Commander Damage to ${PLAYERS[playerIndexSelected].name}?`,
        );
      } else if (
        gameType === 'commander' &&
        menuDisplayed === 'commanderDamage'
      ) {
        // back
        menuDisplayed = '';
        drawGameBoard();
      } else if (menuDisplayed === 'inGameOptions') {
        switch (menuIndexSelected) {
          case 0: // reset game
            gameStart();
            break;
          case 1: // new game menu
            inGame = false;
            menuDisplayed = 'gameNew';
            clearScreenArea(SCREEN_XY);
            menuLoad(MENU_GAME_NEW_OPTIONS, 'New Game');
            break;
          case 2: // close app
            handlePowerButton();
            break;
        }
        menuIndexSelected = 0;
      }
    }
  }

  function handleRightKnob(dir) {
    if (inGame === false) {
      // handle in-menu actions
      if (menuDisplayed === 'gameNew' && menuIndexSelected === 0) {
        // Adjust player count
        playerCount = limitNumberWithinRange(
          playerCount + dir,
          PLAYER_COUNT_MIN,
          PLAYER_COUNT_MAX,
        );
        drawMenu(MENU_GAME_NEW_OPTIONS);
      }
    } else if (
      inGame === true &&
      menuDisplayed != 'commanderDamage' &&
      menuDisplayed != 'inGameOptions'
    ) {
      // handle in-game actions
      PLAYERS[playerIndexSelected].currentLife += dir;
      drawGameBoard();
    } else if (inGame === true && menuDisplayed === 'commanderDamage') {
      let cmndrDmg =
        PLAYERS[playerIndexSelected].commanderDamageSources[menuIndexSelected]
          .amount;
      let cmndrDmgBoundsHack = cmndrDmg + dir;
      cmndrDmg = limitNumberWithinRange(cmndrDmg + dir, 0, 21);
      PLAYERS[playerIndexSelected].commanderDamageSources[
        menuIndexSelected
      ].amount = cmndrDmg;

      if (cmndrDmgBoundsHack > -1 && cmndrDmgBoundsHack < 22) {
        PLAYERS[playerIndexSelected].currentLife += dir * -1;
      }

      drawMenu(PLAYERS[playerIndexSelected].commanderDamageSources);
    }
  }

  function handlePowerButton() {
    // gameSave();

    clearFooterBar();
    clearInterval(inputInterval);
    removeListeners();

    bC.clear(1).flip();
    E.reboot();
  }

  function handleTopButton() {
    // Adjust brightness
    const brightnessLevels = [1, 5, 10, 15, 20];
    const currentIndex = brightnessLevels.findIndex(
      (level) => level === Pip.brightness,
    );
    const nextIndex = (currentIndex + 1) % brightnessLevels.length;
    Pip.brightness = brightnessLevels[nextIndex];
    Pip.updateBrightness();
  }

  function removeListeners() {
    Pip.removeAllListeners(KNOB_LEFT);
    Pip.removeAllListeners(KNOB_RIGHT);
    Pip.removeAllListeners(BTN_TOP);
  }

  function setListeners() {
    Pip.on(KNOB_LEFT, handleLeftKnob);
    Pip.on(KNOB_RIGHT, handleRightKnob);
    Pip.on(BTN_TOP, handleTopButton);
    setWatch(() => handlePowerButton(), BTN_POWER, {
      debounce: 50,
      edge: 'rising',
      repeat: !0,
    });
  }

  self.run = function () {
    bC.clear(1).flip();

    removeListeners();

    // gameLoad();
    menuLoad(MENU_MAIN_OPTIONS, 'Main Menu');

    drawAppTitleAndVersion();
    drawFooterBar();
    drawMenuBoundries();

    setListeners();
  };

  return self;
}

MTGTracker().run();
