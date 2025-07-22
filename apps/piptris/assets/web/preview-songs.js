const previewWav1Btn = document.getElementById('previewWav1');
const previewWav2Btn = document.getElementById('previewWav2');
const previewWav3Btn = document.getElementById('previewWav3');
const previewWav4Btn = document.getElementById('previewWav4');

let audio = null;

previewWav1Btn.addEventListener('click', () =>
  previewWav('assets/piptris-symphony.wav'),
);
previewWav2Btn.addEventListener('click', () =>
  previewWav('assets/piptris-whimsical.wav'),
);
previewWav3Btn.addEventListener('click', () =>
  previewWav('assets/piptris-electro-swing.wav'),
);
previewWav4Btn.addEventListener('click', () =>
  previewWav('assets/piptris-big-band-swing.wav'),
);

async function previewWav(url) {
  try {
    const name = url.split('/').pop();
    addLog(`Previewing ${name}...`);
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
