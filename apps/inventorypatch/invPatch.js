// invPatchIndivDitherV45.js (Final Version w/ Navigation Fix & UI Tweak)

(function () {
  // --- Configuration & Constants ---
  const LIST_START_Y = 10,
    LIST_LINE_HEIGHT = 22,
    STATS_BOX_X = 220,
    STATS_BOX_BOTTOM_Y = 205;
  const STATS_BOX_WIDTH = 170,
    STATS_PADDING = 8,
    STAT_LINE_HEIGHT = 20,
    TEXT_COLOR = 3,
    BRIGHT_BG_COLOR = 1,
    DITHER_COLOR = 1;

  // --- State ---
  let inventory = [],
    fileList = [],
    pageCounts = [],
    totalItems = 0,
    currentPageIndex = -1;
  let selectedItemGlobalIndex = 0,
    lastSelectedItemGlobalIndex = -1;
  let equippedGear = {
    weapon: null,
    hat: null,
    eyewear: null,
    mask: null,
    clothing: null,
    chest: null,
    leftArm: null,
    rightArm: null,
    leftLeg: null,
    rightLeg: null,
    accessory: null,
  };
  let currentItemImage = null,
    isItemSoundPlaying = false;
  let original_removeSubmenu = null;
  let ICONS = null;

  let onKnob,
    loadItemImage,
    drawStatGroup,
    renderItemStats,
    renderFull,
    drawDitheredRect,
    loadMetadata,
    loadPage,
    getPageAndLocalIndex,
    drawItem;

  function start() {
    try {
      const iconFile = fs.readFileSync('DATA/ICONS.json');
      const iconStrings = JSON.parse(iconFile);
      ICONS = {}; // Create an empty object
      // Loop through the strings and convert them
      for (var key in iconStrings) {
        ICONS[key] = atob(iconStrings[key]);
      }
    } catch (e) {
      ICONS = {}; // Fail silently so the patch doesn't crash
    }

    loadItemImage = function (item) {
      //"ram"
      currentItemImage = null;
      if (item && item.image) {
        try {
          const fileContent = fs.readFileSync('DATA/' + item.image);
          const imageObject = new Function('return (' + fileContent + ')')();
          imageObject.buffer = E.toArrayBuffer(imageObject.buffer);
          currentItemImage = imageObject;
        } catch (e) {
          /* Silently fail on image load error */
        }
      }
    };

    drawStatGroup = function (stats, label, yOffset, statsBoxY) {
      if (!stats || stats.length === 0) return yOffset;
      let maxValBoxWidth = 0;
      stats.forEach(function (stat) {
        const icon = ICONS[stat.type];
        const statValueWidth = bC.stringWidth(stat.value);
        let iconWidth = 0;
        if (icon) {
          const iconDimensions = g.imageMetrics(icon);
          const targetHeight =
            stat.type === 'attack' && label === 'Damage' ? 15 : 14;
          const scale = targetHeight / iconDimensions.height;
          iconWidth = iconDimensions.width * scale;
        }
        maxValBoxWidth = Math.max(
          maxValBoxWidth,
          statValueWidth + iconWidth + 20,
        );
      });
      const valueStartPosition = STATS_BOX_X + STATS_BOX_WIDTH - maxValBoxWidth;
      const totalGroupHeight = stats.length * STAT_LINE_HEIGHT;
      const firstLineY = statsBoxY + STATS_PADDING + yOffset;
      bC.setColor(BRIGHT_BG_COLOR);
      bC.fillRect(
        STATS_BOX_X + 4,
        firstLineY - 2,
        valueStartPosition - 4,
        firstLineY + totalGroupHeight - 4,
      );
      bC.setBgColor(BRIGHT_BG_COLOR);
      bC.setColor(TEXT_COLOR);

      bC.drawString(label, STATS_BOX_X + STATS_PADDING, firstLineY);

      stats.forEach(function (stat) {
        const lineY = statsBoxY + STATS_PADDING + yOffset;
        const icon = ICONS[stat.type];
        bC.setColor(BRIGHT_BG_COLOR);
        bC.fillRect(
          valueStartPosition,
          lineY - 2,
          STATS_BOX_X + STATS_BOX_WIDTH - 4,
          lineY + STAT_LINE_HEIGHT - 4,
        );
        bC.setBgColor(BRIGHT_BG_COLOR);
        bC.setColor(TEXT_COLOR);
        if (icon) {
          const iconDimensions = g.imageMetrics(icon);
          const targetHeight =
            stat.type === 'attack' && label === 'Damage' ? 15 : 14;
          const scale = targetHeight / iconDimensions.height;
          const iconY =
            lineY + (STAT_LINE_HEIGHT - 4 - iconDimensions.height * scale) / 2;
          bC.drawImage(icon, valueStartPosition + 2, iconY, {
            scale: scale,
          });
        }
        bC.setFontAlign(1, -1);
        bC.drawString(
          stat.value,
          STATS_BOX_X + STATS_BOX_WIDTH - STATS_PADDING,
          lineY,
        );
        bC.setFontAlign(-1, -1);
        yOffset += STAT_LINE_HEIGHT;
      });
      return yOffset;
    };

    renderItemStats = function (item) {
      bC.setFontMonofonto16();
      if (!item) return;
      const statCount =
        (item.damages ? item.damages.length : 0) +
        (item.defenses ? item.defenses.length : 0) +
        (item.stats ? Object.keys(item.stats).length : 0);
      if (statCount === 0) return;
      const statsBoxHeight =
        statCount * STAT_LINE_HEIGHT + STATS_PADDING * 2 - 2;
      const statsBoxY = STATS_BOX_BOTTOM_Y - statsBoxHeight;
      let yOffset = 0;
      yOffset = drawStatGroup(item.damages, 'Damage', yOffset, statsBoxY);
      yOffset = drawStatGroup(item.defenses, 'DMG Resist', yOffset, statsBoxY);
      if (item.stats) {
        for (var statName in item.stats) {
          const lineY = statsBoxY + STATS_PADDING + yOffset;
          const statEntry = item.stats[statName];
          const isComplexStat =
            typeof statEntry === 'object' && statEntry !== null;
          const statValue = isComplexStat ? statEntry.value : statEntry;
          const hasTimeIndicator = isComplexStat && statEntry.isTimed;
          const isImportantStat = statName === item.ammoType;
          if (isImportantStat) {
            bC.setColor(BRIGHT_BG_COLOR);
            bC.fillRect(
              STATS_BOX_X + 4,
              lineY,
              STATS_BOX_X + STATS_BOX_WIDTH - 4,
              lineY + STAT_LINE_HEIGHT - 4,
            );
            bC.setBgColor(BRIGHT_BG_COLOR);
          } else {
            drawDitheredRect(
              STATS_BOX_X + 4,
              lineY,
              STATS_BOX_WIDTH - 8,
              STAT_LINE_HEIGHT - 2,
            );
            bC.setBgColor(0);
          }
          bC.setColor(TEXT_COLOR);
          const valueX = STATS_BOX_X + STATS_BOX_WIDTH - STATS_PADDING;
          if (isImportantStat) {
            let textX = STATS_BOX_X + STATS_PADDING;
            if (ICONS.ammo) {
              const iconDimensions = g.imageMetrics(ICONS.ammo);
              const scale = 14 / iconDimensions.height;
              const iconY =
                lineY +
                (STAT_LINE_HEIGHT - 4 - iconDimensions.height * scale) / 2;
              bC.drawImage(ICONS.ammo, textX, iconY, {
                scale: scale,
              });
            }
            textX += 16;
            bC.drawString(statName, textX, lineY);
          } else {
            bC.drawString(statName, STATS_BOX_X + STATS_PADDING, lineY);
          }
          bC.setFontAlign(1, -1);
          bC.drawString(statValue, valueX, lineY);
          if (hasTimeIndicator) {
            const iconDimensions = g.imageMetrics(ICONS.time);
            const scale = 14 / iconDimensions.height;
            const iconY =
              lineY -
              1 +
              (STAT_LINE_HEIGHT - 4 - iconDimensions.height * scale) / 2;
            const iconX =
              valueX -
              bC.stringWidth(statValue) -
              iconDimensions.width * scale -
              7;
            bC.drawImage(ICONS.time, iconX, iconY, {
              scale: scale,
            });
          }
          bC.setFontAlign(-1, -1);
          yOffset += STAT_LINE_HEIGHT;
        }
      }
    };

    onKnob = function (dir) {
      if (isItemSoundPlaying) {
        if (Pip.audioIsPlaying()) {
          return;
        } else {
          isItemSoundPlaying = false;
        }
      }

      const currentPos = getPageAndLocalIndex(selectedItemGlobalIndex);
      const item = totalItems > 0 ? inventory[currentPos.local] : null;

      if (dir === 0) {
        if (!item) return;
        if (item.type === 'weapon' || item.type === 'apparel') {
          isItemSoundPlaying = true;
          let slots =
            Object.prototype.toString.call(item.equipSlots) === '[object Array]'
              ? item.equipSlots
              : [item.equipSlots];

          if (slots.length > 0 && Array.isArray(slots[0])) {
            slots = slots[0];
          }

          let isEquipped = equippedGear[slots[0]] === item.name;
          let soundFile = null;
          let sounds = null;

          if (item.type === 'weapon') {
            sounds = isEquipped
              ? ['EquipDown_01.wav', 'EquipDown_02.wav', 'EquipDown_03.wav']
              : ['EquipUp_02.wav', 'EquipUp_03.wav'];
          } else {
            // apparel
            sounds = isEquipped
              ? ['EquipDown_01.wav', 'EquipDown_02.wav', 'EquipDown_03.wav']
              : ['EquipUp_01.wav'];
          }
          soundFile = sounds[Math.floor(Math.random() * sounds.length)];

          if (isEquipped) {
            slots.forEach(function (s) {
              equippedGear[s] = null;
            });
          } else {
            let itemsToUnequip = [];
            slots.forEach(function (s) {
              let itemName = equippedGear[s];
              if (itemName && itemsToUnequip.indexOf(itemName) === -1) {
                itemsToUnequip.push(itemName);
              }
            });

            if (itemsToUnequip.length > 0) {
              for (var slot in equippedGear) {
                if (itemsToUnequip.indexOf(equippedGear[slot]) !== -1) {
                  equippedGear[slot] = null;
                }
              }
            }

            slots.forEach(function (s) {
              equippedGear[s] = item.name;
            });
          }

          if (soundFile) Pip.audioStart('DATA/' + soundFile);
          renderFull();
        } else if (item.sounds && item.sounds.length > 0) {
          isItemSoundPlaying = true;
          Pip.audioStart(
            'DATA/' +
              item.sounds[Math.floor(Math.random() * item.sounds.length)],
          );
        }
        return;
      }

      if (totalItems <= 1) return;

      Pip.knob1Click(dir);

      lastSelectedItemGlobalIndex = selectedItemGlobalIndex;
      selectedItemGlobalIndex -= dir;
      selectedItemGlobalIndex =
        ((selectedItemGlobalIndex % totalItems) + totalItems) % totalItems;

      if (selectedItemGlobalIndex === lastSelectedItemGlobalIndex) return;

      let oldPos = getPageAndLocalIndex(lastSelectedItemGlobalIndex);
      let newPos = getPageAndLocalIndex(selectedItemGlobalIndex);

      let pageChanged = newPos.page !== oldPos.page;

      if (pageChanged) {
        loadPage(newPos.page);
        renderFull();
      } else {
        loadItemImage(inventory[newPos.local]);
        bC.setBgColor(0);
        bC.clearRect(STATS_BOX_X, 0, bC.getWidth(), bC.getHeight());
        if (currentItemImage)
          bC.drawImage(currentItemImage, STATS_BOX_X + 20, 20);
        drawItem(oldPos.local, newPos.local);
        drawItem(newPos.local, newPos.local);
        renderItemStats(inventory[newPos.local]);
        bC.flip();
      }
    };

    renderFull = function () {
      if (totalItems === 0) {
        bC.clear(1)
          .setFontMonofonto18()
          .setColor(3)
          .drawString('Inventory empty.', 25, LIST_START_Y + 3)
          .flip();
        return;
      }
      //bC.clear(1).setFontMonofonto18().setColor(3).drawString("Hello.", 25, LIST_START_Y + 3).flip();
      const currentPos = getPageAndLocalIndex(selectedItemGlobalIndex);
      loadItemImage(inventory[currentPos.local]);
      bC.clear(1);
      if (currentItemImage) {
        bC.drawImage(currentItemImage, STATS_BOX_X + 20, 20);
      }
      for (var i = 0; i < inventory.length; i++) {
        drawItem(i, currentPos.local);
      }
      renderItemStats(inventory[currentPos.local]);
      bC.flip();
    };

    drawDitheredRect = function (x, y, w, h) {
      bC.setColor(DITHER_COLOR);
      for (var j = y; j < y + h; j += 2) {
        bC.fillRect(x, j, x + w, j);
      }
    };

    loadMetadata = function () {
      try {
        const meta = JSON.parse(fs.readFileSync('DATA/items_meta.json'));
        pageCounts = meta.pageCounts;
        totalItems = 0;
        for (var i = 0; i < pageCounts.length; i++) {
          totalItems += pageCounts[i];
        }
        fileList = [];
        for (var j = 0; j < pageCounts.length; j++) {
          fileList.push('items_' + j + '.json');
        }
      } catch (e) {
        totalItems = 0;
      }
    };

    loadPage = function (pIdx) {
      if (pIdx < 0 || pIdx >= fileList.length || currentPageIndex === pIdx)
        return false;
      try {
        inventory = JSON.parse(fs.readFileSync('DATA/' + fileList[pIdx]));
        currentPageIndex = pIdx;
        return true;
      } catch (e) {
        inventory = [];
        return false;
      }
    };

    getPageAndLocalIndex = function (gIdx) {
      if (totalItems === 0)
        return {
          page: 0,
          local: 0,
        };
      gIdx = ((gIdx % totalItems) + totalItems) % totalItems;
      let itemsScanned = 0;
      for (var i = 0; i < pageCounts.length; i++) {
        if (gIdx < itemsScanned + pageCounts[i])
          return {
            page: i,
            local: gIdx - itemsScanned,
          };
        itemsScanned += pageCounts[i];
      }
      return {
        page: 0,
        local: 0,
      };
    };

    drawItem = function (localIndex, selectedLocalIndex) {
      const item = inventory[localIndex];
      const y = LIST_START_Y + localIndex * LIST_LINE_HEIGHT;
      const xStart = 23;
      const maxWidth = STATS_BOX_X - 15 - xStart;

      bC.setBgColor(localIndex === selectedLocalIndex ? 3 : 0);
      bC.setColor(localIndex === selectedLocalIndex ? 0 : 3);
      bC.clearRect(10, y, STATS_BOX_X - 10, y + LIST_LINE_HEIGHT - 1);
      bC.setFontMonofonto16();

      if (Object.values(equippedGear).includes(item.name)) {
        bC.fillRect(12, y + 8, 18, y + 14);
      }

      const quantityStr = ' (' + item.quantity + ')';
      const quantityWidth = bC.stringWidth(quantityStr);
      let nameStr = item.name;
      const availableNameWidth = maxWidth - quantityWidth;

      if (bC.stringWidth(nameStr) > availableNameWidth) {
        let truncatedName = '';
        for (let i = 0; i < nameStr.length; i++) {
          if (
            bC.stringWidth(truncatedName + nameStr[i] + '...') >
            availableNameWidth
          ) {
            break;
          }
          truncatedName += nameStr[i];
        }
        nameStr = truncatedName + '...';
      }

      bC.drawString(nameStr + quantityStr, xStart, y + 3);
    };

    original_removeSubmenu = Pip.removeSubmenu;
    loadMetadata();
    if (totalItems > 0) {
      loadPage(0);
      selectedItemGlobalIndex = 0;
    }
    renderFull();
    Pip.on('knob1', onKnob);
    Pip.removeSubmenu = stopCallback;
  }

  function stopCallback() {
    stop();
  }

  function stop() {
    Pip.removeListener('knob1', onKnob);

    if (original_removeSubmenu) {
      Pip.removeSubmenu = original_removeSubmenu;
      original_removeSubmenu = null;
    }

    inventory = [];
    fileList = [];
    pageCounts = [];
    currentItemImage = null;
    isItemSoundPlaying = false;
    totalItems = 0;
    currentPageIndex = -1;
    selectedItemGlobalIndex = 0;
    lastSelectedItemGlobalIndex = -1;
    //equippedGear = null;
    ICONS = null;
    loadItemImage = null;
    drawStatGroup = null;
    onKnob = null;
    renderItemStats = null;
    drawDitheredRect = null;
    loadMetadata = null;
    loadPage = null;
    getPageAndLocalIndex = null;
    drawItem = null;
    renderFull = null;

    //print("Memory immediately after cleanup:", process.memory().usage);

    process.memory();

    //setTimeout(function()
    //{
    //	print("Memory after GC delay:", process.memory().usage);
    //}, 100);

    if (g.reset) g.reset();
  }

  if (MODEINFO[2] && MODEINFO[2].submenu) {
    let originalSubmenu = MODEINFO[2].submenu;
    let newSubmenu = {};
    let inserted = false;
    for (var key in originalSubmenu) {
      if (key === 'ATTACHMENTS') {
        newSubmenu['ITEMS'] = start;
        inserted = true;
      }
      newSubmenu[key] = originalSubmenu[key];
    }
    if (!inserted) newSubmenu['ITEMS'] = start;
    MODEINFO[2].submenu = newSubmenu;
  }
})();
