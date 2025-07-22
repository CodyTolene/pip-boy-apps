const originalSendCustomizedApp = window.sendCustomizedApp || null;
const installBtn = document.getElementById('installBtn');
const wav1Checkbox = document.getElementById('wav1');
const wav2Checkbox = document.getElementById('wav2');
const wav3Checkbox = document.getElementById('wav3');
const wav4Checkbox = document.getElementById('wav4');

function arrayBufferToBinaryString(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK_SIZE = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK_SIZE),
    );
  }
  return binary;
}

async function createDirs(app) {
  console.log('[install.js] Ensuring nested directories...');
  const files = app.storage || [];
  const folders = new Set(
    files.map((f) => f.name.split('/').slice(0, -1).join('/')).filter((f) => f),
  );

  for (const folder of folders) {
    const js = `
      (function(){
        var fs=require("fs");
        try {
          fs.readdir(${JSON.stringify(folder)});
          return JSON.stringify({ success:true, message:"Folder exists: ${folder}" });
        } catch (e) {
          try {
            fs.mkdir(${JSON.stringify(folder)});
            return JSON.stringify({ success:true, message:"Created folder: ${folder}" });
          } catch (err) {
            return JSON.stringify({ success:false, message:"Failed to create folder ${folder}: "+err.message });
          }
        }
      })()
    `;
    await new Promise((resolve) => {
      Puck.eval(js, (result) => {
        let response;
        try {
          response = typeof result === 'string' ? JSON.parse(result) : result;
        } catch (e) {
          console.error('Failed to parse folder creation response:', result);
          addLog('Folder creation error: ' + result, true);
          resolve();
          return;
        }

        if (response.success) {
          console.log(`[install.js] ${response.message}`);
          addLog(response.message);
        } else {
          console.error(`[install.js] ${response.message}`);
          addLog(response.message, true);
        }
        resolve();
      });
    });
  }
  console.log('[install.js] All nested directories ready.');
}

function onInit(device) {
  if (!device || !device.id) {
    addLog('No device connected!', true);
    installBtn.disabled = true;
    wav1Checkbox.disabled = true;
    wav2Checkbox.disabled = true;
    wav3Checkbox.disabled = true;
    wav4Checkbox.disabled = true;
    return;
  }
  addLog('Connected. Ready to install!');
  installBtn.disabled = false;
  wav1Checkbox.disabled = false;
  wav2Checkbox.disabled = false;
  wav3Checkbox.disabled = false;
  wav4Checkbox.disabled = false;
}

async function pushOptionalWavs(uploadedFiles) {
  const wavs = [
    {
      checked: wav1Checkbox.checked,
      name: 'USER/PIPTRIS/piptris-symphony.wav',
      url: 'assets/piptris-symphony.wav',
    },
    {
      checked: wav2Checkbox.checked,
      name: 'USER/PIPTRIS/piptris-whimsical.wav',
      url: 'assets/piptris-whimsical.wav',
    },
    {
      checked: wav3Checkbox.checked,
      name: 'USER/PIPTRIS/piptris-electro-swing.wav',
      url: 'assets/piptris-electro-swing.wav',
    },
    {
      checked: wav4Checkbox.checked,
      name: 'USER/PIPTRIS/piptris-big-band-swing.wav',
      url: 'assets/piptris-big-band-swing.wav',
    },
  ];

  for (const wav of wavs) {
    if (wav.checked) {
      addLog(`Fetching optional WAV: ${wav.url}`);
      const res = await fetch(wav.url);
      if (!res.ok) {
        addLog(`Failed to fetch ${wav.url}`, true);
        continue;
      }
      const buffer = await res.arrayBuffer();
      const content = arrayBufferToBinaryString(buffer);
      uploadedFiles.push({
        name: wav.name,
        content,
        evaluate: false,
        pretokenise: false,
      });
    }
  }
}

installBtn.addEventListener('click', async () => {
  installBtn.disabled = true;
  addLog('Starting installation...');

  try {
    const response = await fetch('metadata.json');
    if (!response.ok) {
      throw new Error('Failed to fetch metadata.json');
    }
    const metadata = await response.json();

    const appFiles = metadata.storage.map((file) => ({
      name: file.name,
      url: file.url,
    }));

    const uploadedFiles = [];
    let piptrisConfig = null;

    for (const file of appFiles) {
      addLog(`Fetching ${file.url}...`);
      const res = await fetch(file.url);
      if (!res.ok) {
        addLog(`Failed to fetch ${file.url}`, true);
        continue;
      }

      const buffer = await res.arrayBuffer();
      let content;

      if (file.name.endsWith('.json')) {
        content = new TextDecoder('utf-8').decode(buffer);

        if (file.name.endsWith('piptris.json')) {
          piptrisConfig = JSON.parse(content);

          piptrisConfig.music = [];
          if (wav1Checkbox.checked) {
            piptrisConfig.music.push('USER/PIPTRIS/piptris-symphony.wav');
          }
          if (wav2Checkbox.checked) {
            piptrisConfig.music.push('USER/PIPTRIS/piptris-whimsical.wav');
          }
          if (wav3Checkbox.checked) {
            piptrisConfig.music.push('USER/PIPTRIS/piptris-electro-swing.wav');
          }
          if (wav4Checkbox.checked) {
            piptrisConfig.music.push('USER/PIPTRIS/piptris-big-band-swing.wav');
          }

          addLog(
            `Updated piptris.json music array: ${JSON.stringify(
              piptrisConfig.music,
            )}`,
          );

          content = JSON.stringify(piptrisConfig, null, 2);
        }
      } else {
        // Send WAV/JS files as binary-safe strings
        content = arrayBufferToBinaryString(buffer);
      }

      uploadedFiles.push({
        name: file.name,
        content: content,
        evaluate: false,
        pretokenise: file.name.endsWith('.js'),
      });
    }

    await pushOptionalWavs(uploadedFiles);

    addLog('Uploading files to Pip-Boy...');
    sendCustomizedApp({
      id: metadata.id,
      name: metadata.name,
      version: metadata.version,
      description: metadata.description,
      icon: metadata.icon,
      storage: uploadedFiles,
    });
  } catch (err) {
    console.error('Installation error:', err);
    addLog('Installation error: ' + err.message, true);
  }
});

window.sendCustomizedApp = async function (metadata) {
  console.log('[install.js] Hooked `sendCustomizedApp`!');

  await createDirs(metadata);
  addLog('Packing files...');

  if (wav1Checkbox.checked) {
    metadata.storage.push({
      name: 'USER/PIPTRIS/piptris-symphony.wav',
      url: 'assets/piptris-symphony.wav',
    });
  }
  if (wav2Checkbox.checked) {
    metadata.storage.push({
      name: 'USER/PIPTRIS/piptris-whimsical.wav',
      url: 'assets/piptris-whimsical.wav',
    });
  }
  if (wav3Checkbox.checked) {
    metadata.storage.push({
      name: 'USER/PIPTRIS/piptris-electro-swing.wav',
      url: 'assets/piptris-electro-swing.wav',
    });
  }
  if (wav4Checkbox.checked) {
    metadata.storage.push({
      name: 'USER/PIPTRIS/piptris-big-band-swing.wav',
      url: 'assets/piptris-big-band-swing.wav',
    });
  }

  if (originalSendCustomizedApp) {
    return originalSendCustomizedApp.call(this, metadata);
  } else {
    console.error('Original sendCustomizedApp not found!');
  }
};
