import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import {
  Buttons,
  Inputs,
  Labels,
  ProgressBars,
  ProgressBarContainer,
} from './elements.js';
import { Commands } from './commands.js';

let connection = null;
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

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
    console.info(err);
  }
}

async function onSetBootloaderButtonClick() {
  if (!connection?.isOpen) {
    alert('Please connect to the device first.');
    return;
  }

  const result = await connection.espruinoEval(Commands.setBootloader());
  if (result?.success) {
    console.log(result.message);
  } else {
    alert('Error setting bootloader: ' + result?.message);
    console.error(result?.message);
  }
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
      Inputs.userFiles.value = '';
      Inputs.userFile.value = '';
      break;
    case 'USER_BOOT':
      Inputs.bootFiles.value = '';
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
  Buttons.connect.disabled = true;
  Inputs.userFiles.disabled = true;
  Inputs.userFile.disabled = true;
  Inputs.bootFiles.disabled = true;
  Buttons.setBootloader.disabled = true;
  Buttons.restart.disabled = true;
  Buttons.deleteDirAppInfo.disabled = true;
  Buttons.deleteDirUser.disabled = true;
  Buttons.deleteDirUserBoot.disabled = true;
  Labels.userFiles.classList.add('disabled');
  Labels.userFile.classList.add('disabled');
  Labels.bootFiles.classList.add('disabled');

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

function setButtonClickHandlers() {
  Buttons.connect.addEventListener(
    'click',
    async () => await onConnectButtonClick(),
  );
  Buttons.deleteDirAppInfo.addEventListener(
    'click',
    async () => await deleteDirectory('APPINFO'),
  );
  Buttons.deleteDirUser.addEventListener(
    'click',
    async () => await deleteDirectory('USER'),
  );
  Buttons.deleteDirUserBoot.addEventListener(
    'click',
    async () => await deleteDirectory('USER_BOOT'),
  );
  Buttons.restart.addEventListener(
    'click',
    async () => await onRestartButtonClick(),
  );
  Buttons.setBootloader.addEventListener(
    'click',
    async () => await onSetBootloaderButtonClick(),
  );
}

function setFileInputHandlers() {
  Inputs.userFiles.addEventListener(
    'change',
    async (e) =>
      await uploadFilesToDevice(
        e,
        'USER',
        ProgressBars.userFiles,
        ProgressBarContainer.userFiles,
        false,
      ),
  );
  Inputs.userFile.addEventListener(
    'change',
    async (e) =>
      await uploadFilesToDevice(
        e,
        'USER',
        ProgressBars.userFiles,
        ProgressBarContainer.userFiles,
        true,
      ),
  );
  Inputs.bootFiles.addEventListener(
    'change',
    async (e) =>
      await uploadFilesToDevice(
        e,
        'USER_BOOT',
        ProgressBars.bootFiles,
        ProgressBarContainer.bootFiles,
        false,
      ),
  );
}

function toggleConnectionState() {
  const isConnected = connection?.isOpen === true;

  Buttons.connect.innerText = isConnected ? 'Connected' : 'Connect';
  Buttons.connect.disabled = isConnected;

  Inputs.userFiles.disabled = !isConnected;
  Inputs.userFile.disabled = !isConnected;
  Inputs.bootFiles.disabled = !isConnected;
  Labels.userFiles.classList.toggle('disabled', !isConnected);
  Labels.userFile.classList.toggle('disabled', !isConnected);
  Labels.bootFiles.classList.toggle('disabled', !isConnected);
  Buttons.setBootloader.disabled = !isConnected;
  Buttons.restart.disabled = !isConnected;
  Buttons.deleteDirAppInfo.disabled = !isConnected;
  Buttons.deleteDirUser.disabled = !isConnected;
  Buttons.deleteDirUserBoot.disabled = !isConnected;

  if (!isConnected) {
    ProgressBars.userFiles.style.width = '0%';
    ProgressBars.bootFiles.style.width = '0%';
    ProgressBarContainer.userFiles.style.display = 'none';
    ProgressBarContainer.bootFiles.style.display = 'none';
    Inputs.userFiles.value = '';
    Inputs.userFile.value = '';
    Inputs.bootFiles.value = '';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setButtonClickHandlers();
  setFileInputHandlers();
  toggleConnectionState();
});
