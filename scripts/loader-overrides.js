UART.ports = UART.ports.filter((e) => e.includes('Serial'));
Const.CONNECTION_DEVICE = 'USB';
const originalUploadApp = window.uploadApp || null;

// Keep us on the correct page
if (
  window.top === window.self &&
  location.hostname === 'pip-boy.com' &&
  location.pathname !== '/3000-mk-v-apps'
) {
  location.href = 'https://pip-boy.com/3000-mk-v-apps';
}

// Create all directories (including nested) for app/game files
async function createNestedDirsForAppFiles(app) {
  console.log('[loader-overrides] Ensuring nested directories...');
  const files = app.storage || [];
  const folders = Array.from(
    new Set(
      files
        .map((f) => f.name.split('/').slice(0, -1).join('/'))
        .filter((f) => f),
    ),
  );

  // Sort by depth (least nested first)
  folders.sort((a, b) => a.split('/').length - b.split('/').length);

  for (const folder of folders) {
    await new Promise((resolve) => {
      const js = `
        (() => {
          var fs = require("fs");
          var parts = ${JSON.stringify(folder)}.split('/');
          var current = '';
          for (var i = 0; i < parts.length; i++) {
            current += (current ? '/' : '') + parts[i];
            try {
              fs.readdir(current);
            } catch (e) {
              try {
                fs.mkdir(current);
              } catch (mkdirError) {
                return { success: false, message: "Failed to create " + current + ": " + mkdirError.message };
              }
            }
          }
          return { success: true, message: "Ensured " + ${JSON.stringify(folder)} };
        })();
      `;
      UART.write(`\x10${js}\n`, () => {
        resolve();
      });
    });
  }
  console.log('[loader-overrides] Nested directories ready.');
}

// Install the bootloader script
async function installBootloader() {
  console.log('[loader-overrides] Installing bootloader...');

  await new Promise((resolve) => {
    const js = `
        (() => {
          try {
            require("Storage").write(".boot0", \`
              E.on("init", function () {
                // Clean up any previous Pip app states before loading new scripts.
                // This ensures old intervals, listeners, or buffers are removed to 
                // prevent memory leaks.
                if (typeof Pip !== 'undefined' && typeof Pip.remove === 'function') {
                  Pip.remove();
                }
                require("fs")
                  .readdir("USER_BOOT")
                  .sort()
                  .forEach(function (f) {
                    if (f.endsWith(".js")) {
                      eval(require("fs").readFile("USER_BOOT/" + f));
                    }
                  });
              });
            \`);
            return { success: true, message: "Bootloader installed successfully!" };
          } catch (e) {
            return { success: false, message: e.message };
          }
        })();
      `;
    UART.write(`\x10${js}\n`, () => {
      resolve();
    });
  });
}

// Make sure nested directories exist on the device before uploading files
window.uploadApp = async function (app, options) {
  console.log('[loader-overrides] Hooked `uploadApp`!');

  await createNestedDirsForAppFiles(app);

  if (app.type === 'bootloader') {
    await installBootloader();
  }

  // Call the original uploadApp
  if (originalUploadApp) {
    return originalUploadApp.call(this, app, options);
  } else {
    console.error('Original uploadApp not found!');
  }
};

// Patch the UART connection to make sure it handles retries correctly
if (UART && UART.endpoints) {
  const wsEndpoint = UART.endpoints.find((ep) => ep.name === 'Web Serial');
  if (wsEndpoint) {
    const originalConnect = wsEndpoint.connect;

    wsEndpoint.connect = function (connection, options) {
      return originalConnect.call(this, connection, options).then((conn) => {
        const originalWrite = conn.write;
        conn.write = function (data, callback, alreadyRetried) {
          return originalWrite.call(this, data, callback, false);
        };

        return conn;
      });
    };
  }
}
