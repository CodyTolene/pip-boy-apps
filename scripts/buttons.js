// Buttons
const connectBtn = document.getElementById('connectmydevice');
const rebootBtn = document.getElementById('rebootdevice');

// Watch for changes to the connect button.
// On change update the reboot button visibility.
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

// When the Reboot button is clicked, restart the device
rebootBtn.addEventListener('click', () => {
  console.log('[buttons.js] Sending reboot command...');
  UART.write('\x10E.reboot()\n', (result) => {
    console.log('[buttons.js] Reboot response:', result);
  });
});
