import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

const connectBtn = document.getElementById('connect');
const restartBtn = document.getElementById('restart');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressBar');

let connection = null;

const updateUIConnectionState = () => {
  const isConnected = connection?.isOpen === true;
  fileInput.disabled = !isConnected;
  restartBtn.disabled = !isConnected;
};

updateUIConnectionState();

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

connectBtn.addEventListener('click', async () => {
  try {
    UART.ports = ['Web Serial'];

    if (connection?.isOpen) {
      try {
        console.log('Closing existing connection...');
        await connection.disconnect();
      } catch (e) {
        console.warn('Error closing previous connection:', e);
      }
    }

    connection = await UART.connectAsync();

    if (connection?.isOpen) {
      connection.on('disconnect', () => {
        console.warn('Pip-Boy disconnected.');
        alert('Device disconnected.');
        connection = null;
        updateUIConnectionState();
      });

      console.log('Connected to Pip-Boy!');
      //alert('Connected to Pip-Boy!');
      updateUIConnectionState();
    } else {
      alert('Connection failed.');
    }
  } catch (err) {
    console.error('Connection error:', err);
    alert('Connection error: ' + err.message);
  }
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    alert('No file selected.');
    return;
  }

  if (!connection?.isOpen) {
    alert('Please connect to the device first.');
    return;
  }

  progressBar.style.width = '0%';

  const fileName = file.name;
  const fileBuffer = await file.arrayBuffer();
  let appPath = '';
  const bootCode = file.name.startsWith('boot.');
  if (bootCode) {
    appPath = `USER_BOOT/${fileName}`;
    //need to make sure directory is created since it's nonstandard. if it fails (because it palready exists) we catch and ignore
    const createUSERBOOTCommand = `
    (() => {
      var fs = require("fs");
        try {
          require("fs").mkdir("USER_BOOT"); 
        } catch (error) {
        }
    })()
        `;
    const createUSERBOOTResult = await connection.espruinoEval(
      createUSERBOOTCommand,
      {
        timeout: 1500,
      },
    );
  } else {
    appPath = `USER/${fileName}`;
  }

  const zip = new JSZip();
  zip.file(appPath, fileBuffer);
  const zipContent = await zip.generateAsync({ type: 'uint8array' });
  const zipLoaded = await JSZip.loadAsync(zipContent);

  for (const [path, file] of Object.entries(zipLoaded.files)) {
    if (file.dir) continue;

    const fileData = await file.async('uint8array');
    const fileText = new TextDecoder('latin1').decode(fileData);

    console.log(`Uploading ${path}...`);
    await connection.espruinoSendFile(path, fileText, {
      fs: true,
      chunkSize: 1024,
      noACK: true,
      progress: (chunk, total) => {
        const percent = Math.round((chunk / total) * 100);
        progressBar.style.width = percent + '%';
        console.log(`Progress: ${percent}%`);
      },
    });

    console.log(`Upload complete for ${path}!`);
  }

  progressBar.style.width = '100%';
  await wait(1000);

  if (bootCode) {
    fileInput.value = '';
  } else {
    const clearCommand = `
    (() => {
      try {
        if (typeof Pip !== 'undefined') {
          if (Pip.remove) Pip.remove();
          if (Pip.removeSubmenu) Pip.removeSubmenu();
          if (Pip.audioStop) Pip.audioStop();
          if (Pip.radioOn) {
            if (typeof rd !== 'undefined' && rd.enable) {
              rd.enable(false);
            }
            Pip.radioOn = false;
          }
        }

        g.clear(1);
        if (g.setFontMonofonto23) g.setFontMonofonto23();
        g.setFontAlign(0, 0);

        return "Screen cleared";
      } catch (e) {
        return "Clear error: " + e.message;
      }
    })()
  `;

    const clearResult = await connection.espruinoEval(clearCommand, {
      timeout: 1500,
    });
    console.log('Clear result:', clearResult);
    await wait(1000);

    const launchCommand = `
      (() => {
        var fs = require("fs");
        try {
          eval(fs.readFile("${appPath}"));
          return { success: true, message: "App launched successfully!" };
        } catch (error) {
          return { success: false, message: error.message };
        }
      })()
    `;

    try {
      const result = await connection.espruinoEval(launchCommand, {
        timeout: 2000,
      });

      if (result?.success) {
        // alert(result.message);
        console.log(result.message);
        fileInput.value = '';
      } else {
        alert('Launch failed: ' + result?.message);
        console.error('Launch failed:', result?.message);
      }
    } catch (err) {
      alert('Error launching app: ' + err.message);
      console.error('Launch error:', err);
    }
  }

  setTimeout(() => {
    progressBar.style.width = '0%';
  }, 1000);
});

restartBtn.addEventListener('click', async () => {
  if (!connection?.isOpen) {
    alert('Please connect to the device first.');
    return;
  }

  try {
    console.log('Rebooting device...');
    await connection.espruinoEval('setTimeout(() => { E.reboot(); }, 100);');

    fileInput.disabled = true;
    restartBtn.disabled = true;

    //alert('Reboot command sent!');
  } catch (err) {
    alert('Error rebooting device: ' + err.message);
    console.error('Reboot error:', err);
  }
});
