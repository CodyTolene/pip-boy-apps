UART.ports = UART.ports.filter((e) => e.includes('Serial'));
Const.CONNECTION_DEVICE = 'USB';

const originalUploadApp = window.uploadApp || null;

const connectBtn = document.getElementById('connectmydevice');
const rebootBtn = document.getElementById('rebootdevice');

// Watch for class changes on the Connect button
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      const isConnected = connectBtn.classList.contains('is-connected');
      if (isConnected) {
        rebootBtn.classList.remove('hidden'); // Show Reboot
      } else {
        rebootBtn.classList.add('hidden'); // Hide Reboot
      }
    }
  });
});

observer.observe(connectBtn, { attributes: true });

rebootBtn.addEventListener('click', () => {
  console.log('[index.html] Sending reboot command...');
  UART.write('\x10E.reboot()\n', (result) => {
    console.log('[index.html] Reboot response:', result);
  });
});

// Function to support app/game nested directories
async function createNestedDirsForAppFiles(app) {
  console.log('[index.html] Ensuring nested directories...');
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
      UART.write(`\x10${js}\n`, (result) => {
        resolve();
      });
    });
  }
  console.log('[index.html] Nested directories ready.');
}

// Override uploadApp to insert folder creation before upload
window.uploadApp = async function (app, options) {
  console.log('[index.html] Hooked `uploadApp`!');

  await createNestedDirsForAppFiles(app);

  // Call the original uploadApp
  if (originalUploadApp) {
    return originalUploadApp.call(this, app, options);
  } else {
    console.error('Original uploadApp not found!');
  }
};
