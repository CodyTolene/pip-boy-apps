const originalSendCustomizedApp = window.sendCustomizedApp || null;
const logEl = document.getElementById('log');
const installBtn = document.getElementById('installBtn');
const wav1Checkbox = document.getElementById('wav1');
const wav2Checkbox = document.getElementById('wav2');
const wav3Checkbox = document.getElementById('wav3');
const wav4Checkbox = document.getElementById('wav4');
const previewWav1Btn = document.getElementById('previewWav1');
const previewWav2Btn = document.getElementById('previewWav2');
const previewWav3Btn = document.getElementById('previewWav3');
const previewWav4Btn = document.getElementById('previewWav4');

let audio = null;

function addLog(msg, isError = false) {
  const p = document.createElement('p');
  p.textContent = msg;
  if (isError) p.style.color = 'red';
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
  console.log(msg);
}

function arrayBufferToString(buffer) {
  return String.fromCharCode(...new Uint8Array(buffer));
}

async function fetchOptionalWav(name, url) {
  addLog(`Fetching optional file ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    addLog(`Failed to fetch optional file: ${url}`, true);
    return null;
  }
  const buffer = await res.arrayBuffer();
  const binaryString = [...new Uint8Array(buffer)]
    .map((b) => String.fromCharCode(b))
    .join('');
  return {
    name: name,
    content: binaryString,
    evaluate: false,
    pretokenise: false,
  };
}

async function previewWav(url) {
  try {
    addLog(`Previewing ${url}...`);
    const res = await fetch(url);
    if (!res.ok) {
      addLog(`Failed to load ${url} for preview`, true);
      return;
    }
    const blob = await res.blob();
    const audioURL = URL.createObjectURL(blob);

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    audio = new Audio(audioURL);
    audio.play();
  } catch (err) {
    console.error('Preview error:', err);
    addLog('Preview error: ' + err.message, true);
  }
}

previewWav1Btn.addEventListener('click', () =>
  previewWav('piptris-symphony.wav'),
);
previewWav2Btn.addEventListener('click', () =>
  previewWav('piptris-whimsical.wav'),
);
previewWav3Btn.addEventListener('click', () =>
  previewWav('piptris-electro-swing.wav'),
);
previewWav4Btn.addEventListener('click', () =>
  previewWav('piptris-big-band-swing.wav'),
);

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
          if (wav1Checkbox.checked)
            piptrisConfig.music.push('USER/PIPTRIS/piptris-symphony.wav');
          if (wav2Checkbox.checked)
            piptrisConfig.music.push('USER/PIPTRIS/piptris-whimsical.wav');
          if (wav3Checkbox.checked)
            piptrisConfig.music.push('USER/PIPTRIS/piptris-electro-swing.wav');
          if (wav4Checkbox.checked)
            piptrisConfig.music.push('USER/PIPTRIS/piptris-big-band-swing.wav');

          addLog(
            `Updated piptris.json music array: ${JSON.stringify(
              piptrisConfig.music,
            )}`,
          );

          content = JSON.stringify(piptrisConfig, null, 2);
        }
      } else {
        content = arrayBufferToString(buffer);
      }

      uploadedFiles.push({
        name: file.name,
        content: content,
        evaluate: false,
        pretokenise: file.name.endsWith('.js'),
      });
    }

    if (wav1Checkbox.checked) {
      const wav1 = await fetchOptionalWav(
        'USER/PIPTRIS/piptris-symphony.wav',
        'piptris-symphony.wav',
      );
      if (wav1) uploadedFiles.push(wav1);
    }
    if (wav2Checkbox.checked) {
      const wav2 = await fetchOptionalWav(
        'USER/PIPTRIS/piptris-whimsical.wav',
        'piptris-whimsical.wav',
      );
      if (wav2) uploadedFiles.push(wav2);
    }
    if (wav3Checkbox.checked) {
      const wav3 = await fetchOptionalWav(
        'USER/PIPTRIS/piptris-electro-swing.wav',
        'piptris-electro-swing.wav',
      );
      if (wav3) uploadedFiles.push(wav3);
    }
    if (wav4Checkbox.checked) {
      const wav4 = await fetchOptionalWav(
        'USER/PIPTRIS/piptris-big-band-swing.wav',
        'piptris-big-band-swing.wav',
      );
      if (wav4) uploadedFiles.push(wav4);
    }

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

async function createDirs(app) {
  console.log('[install.html] Ensuring nested directories...');
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
          console.log(`[install.html] ${response.message}`);
          addLog(response.message);
        } else {
          console.error(`[install.html] ${response.message}`);
          addLog(response.message, true);
        }
        resolve();
      });
    });
  }
  console.log('[install.html] All nested directories ready.');
}

window.sendCustomizedApp = async function (metadata) {
  console.log('[install.html] Hooked `sendCustomizedApp`!');

  await createDirs(metadata);
  addLog('Packing files...');

  if (wav1Checkbox.checked) {
    metadata.storage.push({
      name: 'USER/PIPTRIS/piptris-symphony.wav',
      url: 'piptris-symphony.wav',
    });
  }
  if (wav2Checkbox.checked) {
    metadata.storage.push({
      name: 'USER/PIPTRIS/piptris-whimsical.wav',
      url: 'piptris-whimsical.wav',
    });
  }
  if (wav3Checkbox.checked) {
    metadata.storage.push({
      name: 'USER/PIPTRIS/piptris-electro-swing.wav',
      url: 'piptris-electro-swing.wav',
    });
  }
  if (wav4Checkbox.checked) {
    metadata.storage.push({
      name: 'USER/PIPTRIS/piptris-big-band-swing.wav',
      url: 'piptris-big-band-swing.wav',
    });
  }

  if (originalSendCustomizedApp) {
    return originalSendCustomizedApp.call(this, metadata);
  } else {
    console.error('Original sendCustomizedApp not found!');
  }
};
