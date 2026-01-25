(function waitForAppTilesAndRenderAuthors() {
  const TIMEOUT_MS = 10000;
  const POLL_INTERVAL_MS = 200;
  const startTime = Date.now();

  function getAppIdFromTile(tile) {
    const anchor = tile.querySelector('.tile-title a[name]');
    if (!anchor) return null;

    const match = anchor.name.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  function tryRender() {
    const columns = document.querySelector('.columns');
    const appTiles = columns ? columns.querySelectorAll('.app-tile') : [];

    if (appTiles.length > 0) {
      setTimeout(() => {
        // If we found tiles, render authors
        appTiles.forEach(async (tile) => {
          const titleEl = tile.querySelector('.tile-title');
          if (!titleEl) return;

          const appName = getAppIdFromTile(tile);
          if (!appName) return;

          try {
            const res = await fetch(`apps/${appName}/metadata.json`);
            if (!res.ok) return;
            const metadata = await res.json();

            if (metadata.author && !titleEl.querySelector('.tile-author')) {
              const authorEl = document.createElement('span');
              authorEl.classList.add('tile-author');
              authorEl.textContent = ` by ${metadata.author}`;

              // Insert author after <small>
              const small = titleEl.querySelector('small');
              if (small) {
                small.insertAdjacentElement('afterend', authorEl);
              } else {
                titleEl.appendChild(authorEl);
              }
            }
          } catch (err) {
            console.warn(`Could not load metadata for ${appName}`, err);
          }
        });

        // Remove the `span.fav-count` elements from the page
        const favCountEls = document.querySelectorAll('span.fav-count');
        favCountEls.forEach((el) => {
          el.remove();
        });
      }, 100);
    } else if (Date.now() - startTime < TIMEOUT_MS) {
      setTimeout(tryRender, POLL_INTERVAL_MS);
    } else {
      console.warn(
        'No .app-tile found inside .columns after waiting 10 seconds.',
      );
    }
  }

  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    tryRender();
  } else {
    document.addEventListener('DOMContentLoaded', tryRender);
  }
})();

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
