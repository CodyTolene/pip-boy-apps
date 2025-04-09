import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import { Commands } from './commands.js';

let connection = null;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// Buttons
const connectBtn = document.getElementById('connect');
const restartBtn = document.getElementById('restart-btn');
const deleteDirUserBtn = document.getElementById('delete-dir-user');
const deleteDirUserBootBtn = document.getElementById('delete-dir-user-boot');

// Inputs
const jsFilesInput = document.getElementById('js-files-input');
const jsFileInput = document.getElementById('js-file-input');
const jsBootFileInput = document.getElementById('js-boot-file-input');

// Input labels
const jsFilesInputLabel = document.getElementById('js-files-input-label');
const jsFileInputLabel = document.getElementById('js-file-input-label');
const jsBootFileInputLabel = document.getElementById(
  'js-boot-file-input-label',
);

const jsFileProgressContainer = document.getElementById(
  'js-file-progress-container',
);
const jsBootFileProgressContainer = document.getElementById(
  'js-boot-file-progress-container',
);

// Progress bars
const jsFileProgress = document.getElementById('js-file-progress');
const jsBootFileProgress = document.getElementById('js-boot-file-progress');

// Click listeners
connectBtn.addEventListener('click', async () => await onConnectButtonClick());
restartBtn.addEventListener('click', async () => await onRestartButtonClick());
deleteDirUserBtn.addEventListener(
  'click',
  async () => await onDeleteDirUserButtonClick(),
);
deleteDirUserBootBtn.addEventListener(
  'click',
  async () => await onDeleteDirUserBootButtonClick(),
);

// File input change listeners
jsFilesInput.addEventListener(
  'change',
  async (e) =>
    await uploadFilesToDevice(
      e,
      'USER',
      jsFileProgress,
      jsFileProgressContainer,
      false,
    ),
);
jsFileInput.addEventListener(
  'change',
  async (e) =>
    await uploadFilesToDevice(
      e,
      'USER',
      jsFileProgress,
      jsFileProgressContainer,
      true,
    ),
);
jsBootFileInput.addEventListener(
  'change',
  async (e) =>
    await uploadFilesToDevice(
      e,
      'USER_BOOT',
      jsBootFileProgress,
      jsBootFileProgressContainer,
      false,
    ),
);

async function deleteDirectory(basePath) {
  if (!connection?.isOpen) {
    alert('Please connect to the device first.');
    return;
  }

  const result = await connection.espruinoEval(
    Commands.deleteDirectory(basePath),
  );

  if (result?.success) {
    console.log(`Deleted directory ${basePath} successfully!`);
    alert(`Deleted all items in directory ${basePath} successfully!`);
  } else {
    alert('Error deleting directory: ' + result?.message);
    console.error(result?.message);
  }
}

async function onConnectButtonClick() {
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
        toggleConnectionState();
      });

      console.log('Connected to Pip-Boy!');
      toggleConnectionState();
    } else {
      alert('Connection failed.');
    }
  } catch (err) {
    alert('Connection error: ' + err.message);
    console.error(err);
  }
}

async function onDeleteDirUserButtonClick() {
  await deleteDirectory('USER');
}

async function onDeleteDirUserBootButtonClick() {
  await deleteDirectory('USER_BOOT');
}

async function uploadFilesToDevice(
  event,
  basePath,
  progressBar,
  progressContainer,
  shouldLaunchFile,
) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  if (!connection?.isOpen) {
    alert('Please connect to the device first.');
    return;
  }

  // UI setup
  progressContainer.style.display = 'block';
  progressContainer.style.visibility = 'visible';
  progressBar.style.width = '0%';

  // Ensure directory exists
  const result = await connection.espruinoEval(
    Commands.createDirectory(basePath),
    {
      timeout: 1500,
    },
  );

  if (!result?.success) {
    alert('Error creating directory: ' + result?.message);
    console.error(result?.message);
    return;
  }

  const zip = new JSZip();
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    zip.file(`${basePath}/${file.name}`, buffer);
  }

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
      },
    });

    console.log(`Upload complete for ${path}!`);
  }

  progressBar.style.width = '100%';
  await wait(1000);

  if (shouldLaunchFile) {
    // Launch the first file located in `${basePath}/*.js` if it exists.
    const file = files.find((file) => file.name.endsWith('.js'));
    if (!file) {
      alert('No .js file found to launch.');
      console.error('No .js file found to launch.');
      return;
    }

    const appPath = `${basePath}/${file.name}`;
    await connection.espruinoEval(Commands.clear, { timeout: 1500 });
    await wait(1000);

    try {
      const result = await connection.espruinoEval(Commands.launch(appPath), {
        timeout: 2000,
      });

      if (result?.success) {
        console.log(result.message);
      } else {
        alert('Launch failed: ' + result?.message);
        console.error(result?.message);
      }
    } catch (err) {
      alert('Error launching app: ' + err.message);
      console.error(err);
    }
  }

  // Cleanup UI
  switch (basePath) {
    case 'USER':
      jsFilesInput.value = '';
      jsFileInput.value = '';
      break;
    case 'USER_BOOT':
      jsBootFileInput.value = '';
      break;
    default:
      throw new Error('Invalid base path: ' + basePath);
  }

  setTimeout(() => {
    progressBar.style.width = '0%';
    progressContainer.style.display = 'none';
    progressContainer.style.visibility = 'hidden';
  }, 1000);
}

async function onRestartButtonClick() {
  if (!connection?.isOpen) {
    alert('Please connect to the device first.');
    return;
  }

  // Disable all
  connectBtn.disabled = true;
  jsFilesInput.disabled = true;
  jsFileInput.disabled = true;
  jsBootFileInput.disabled = true;
  restartBtn.disabled = true;
  deleteDirUserBtn.disabled = true;
  deleteDirUserBootBtn.disabled = true;
  jsFilesInputLabel.classList.add('disabled');
  jsFileInputLabel.classList.add('disabled');
  jsBootFileInputLabel.classList.add('disabled');

  try {
    console.log('Rebooting device...');
    await connection.espruinoEval(Commands.reboot);
    await wait(3000);
    toggleConnectionState();
  } catch (err) {
    alert('Error rebooting device: ' + err.message);
    console.error(err);
  }
}

function toggleConnectionState() {
  const isConnected = connection?.isOpen === true;

  connectBtn.innerText = isConnected ? 'Connected' : 'Connect';
  connectBtn.disabled = isConnected;

  jsFilesInput.disabled = !isConnected;
  jsFileInput.disabled = !isConnected;
  jsBootFileInput.disabled = !isConnected;
  jsFilesInputLabel.classList.toggle('disabled', !isConnected);
  jsFileInputLabel.classList.toggle('disabled', !isConnected);
  jsBootFileInputLabel.classList.toggle('disabled', !isConnected);
  restartBtn.disabled = !isConnected;
  deleteDirUserBtn.disabled = !isConnected;
  deleteDirUserBootBtn.disabled = !isConnected;

  if (!isConnected) {
    jsFileProgress.style.width = '0%';
    jsBootFileProgress.style.width = '0%';
    jsFileProgressContainer.style.display = 'none';
    jsBootFileProgressContainer.style.display = 'none';
    jsFilesInput.value = '';
    jsFileInput.value = '';
    jsBootFileInput.value = '';
  }
}

toggleConnectionState();
