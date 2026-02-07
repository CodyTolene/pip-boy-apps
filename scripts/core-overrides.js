/** 
 * Core overrides and patches for the Pip-Boy Web Mod Tool by The Wand Company/Espruino.
 * 
 * Currently does the following:
 * 1. Waits for app tiles to load, then fetches metadata for each app and displays the author.
 * 2. Patches the Documentation modal to ensure all links open in a new tab.
 * 3. Removes `span.fav-count` elements which are not relevant to this interface.
 */
(function waitForAppTilesAndRenderAuthors() {
  const DEBUG = true;
  const TIMEOUT_MS = 10000;
  const POLL_INTERVAL_MS = 200;
  const startTime = Date.now();

  function getAppIdFromTile(tile) {
    const anchor = tile.querySelector('.tile-title a[name]');
    if (!anchor) return null;

    const match = anchor.name.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  /**
   * For each app tile, fetch its metadata and display the author in the UI 
   * if available.
   */
  function displayAuthorsForAppTiles(appTiles) {
    appTiles.forEach((tile) => {
      const titleEl = tile.querySelector('.tile-title');
      if (!titleEl) return;

      const appName = getAppIdFromTile(tile);
      if (!appName) return;

      // Avoid duplicate work if we've already added an author
      if (titleEl.querySelector('.tile-author')) return;

      fetch(`apps/${appName}/metadata.json`)
        .then((res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((metadata) => {
          if (!metadata || !metadata.author) return;

          const authorEl = document.createElement('span');
          authorEl.classList.add('tile-author');
          authorEl.textContent = ` by ${metadata.author}`;

          const small = titleEl.querySelector('small');
          if (small) {
            small.insertAdjacentElement('afterend', authorEl);
          } else {
            titleEl.appendChild(authorEl);
          }

          if (DEBUG) {
            console.log(`Displayed author for ${appName}: ${metadata.author}`);
          }
        })
        .catch((err) => {
          console.warn(`Could not load metadata for ${appName}`, err);
        });
    });
  }

  /**
   * Patch showPrompt once so any links inside the Documentation modal open 
   * in a new tab.
   */
  function patchDocModalLinksTargetBlank() {
    if (window.__pipboyDocsModalLinksPatched) return;
    if (typeof window.showPrompt !== 'function') return;

    window.__pipboyDocsModalLinksPatched = true;

    function setLinksBlankWithinModal(modal) {
      if (!modal) return;

      const body = modal.querySelector('.modal-body');
      if (!body) return;

      const links = body.querySelectorAll('a[href]');
      links.forEach((a) => {
        const href = (a.getAttribute('href') || '').trim();

        if (!href) return;
        if (href === '#close') return;
        if (href.startsWith('#')) return;
        if (href.startsWith('mailto:')) return;
        if (href.toLowerCase().startsWith('javascript:')) return;
        if (a.getAttribute('target') === '_blank') return;

        if (DEBUG) {
          console.log(`Patching anchor: ${href}`);
        }

        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });
    }

    const originalShowPrompt = window.showPrompt;

    window.showPrompt = function patchedShowPrompt(title, contents, options, shouldEscapeHtml) {
      const result = originalShowPrompt.apply(this, arguments);
      const isDocumentationPrompt =
        typeof title === 'string' && title.includes(' Documentation');

      if (isDocumentationPrompt) {
        setTimeout(() => {
          try {
            const modal = document.querySelector('.modal.active');
            setLinksBlankWithinModal(modal);
          } catch (e) {
            console.warn('Failed to update Documentation modal links', e);
          }
        }, 0);
      }

      return result;
    };
  }

  function removeFavCountSpans() {
    const favCountEls = document.querySelectorAll('span.fav-count');
    favCountEls.forEach((el) => {
      if (DEBUG) {
        console.log('Removing fav-count element:', el);
      }
      el.remove();
    });
  }

  function tryRender() {
    patchDocModalLinksTargetBlank();

    const columns = document.querySelector('.columns');
    const appTiles = columns ? columns.querySelectorAll('.app-tile') : [];

    if (appTiles.length > 0) {
      setTimeout(() => {
        displayAuthorsForAppTiles(appTiles);
        removeFavCountSpans();
      }, 100);
    } else if (Date.now() - startTime < TIMEOUT_MS) {
      setTimeout(tryRender, POLL_INTERVAL_MS);
    } else {
      console.warn('No .app-tile found inside .columns after waiting 10 seconds.');
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tryRender();
  } else {
    document.addEventListener('DOMContentLoaded', tryRender);
  }
})();


/**
 * Disable certain buttons until the Pip is connected, re-enable them on 
 * connect.
 */
(function disableButtonsUntilConnected() {
  const BUTTON_IDS = ['settime', 'pip-boy-screenshot'];
  const RETRY_INTERVAL_MS = 200;
  const MAX_RETRIES = 50;

  function setDisabled(disabled) {
    BUTTON_IDS.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = disabled;
    });
  }
  window.__pipboySetDeviceButtons = setDisabled;

  function updateDisabledFromConnection() {
    const connected = Comms && Comms.isConnected && Comms.isConnected();
    setDisabled(!connected);
  }
  window.__pipboyUpdateDeviceButtons = updateDisabledFromConnection;

  function attachWatcher() {
    if (
      typeof Comms === 'undefined' ||
      typeof Comms.watchConnectionChange !== 'function'
    ) {
      return false;
    }
    updateDisabledFromConnection();
    Comms.watchConnectionChange((connected) => {
      setDisabled(!connected);
    });
    return true;
  }

  function init(retries = 0) {
    setDisabled(true);
    if (attachWatcher()) return;
    if (retries < MAX_RETRIES) {
      setTimeout(() => init(retries + 1), RETRY_INTERVAL_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();

/** 
 * Wait for the Pip connection to be established before doing something.
 * 
 * Note: Use in the future for post-connection tasks if needed. 
 */
// (function waitForPipConnection() {
//   const TIMEOUT_MS = 100;
//   const POLL_INTERVAL_MS = 200;
//   const startTime = Date.now();
//   function checkConnection() {
//     if (typeof Comms !== 'undefined' && Comms.isConnected && Comms.isConnected()) {
//       console.log('Pip connected!', Comms);
//     } else if (Date.now() - startTime < TIMEOUT_MS) {
//       setTimeout(checkConnection, POLL_INTERVAL_MS);
//     } else {
//       console.warn('Pip not found after waiting 100 milliseconds.');
//       return waitForPipConnection();
//     }
//   }
//   if (typeof Comms !== 'undefined' && Comms.isConnected && Comms.isConnected()) {
//     console.log('Pip is already connected.', Comms);
//   } else {
//     checkConnection();
//   }
// })();
