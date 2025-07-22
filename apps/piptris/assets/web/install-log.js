const logEl = document.getElementById('log');

function addLog(msg, isError = false) {
  const p = document.createElement('p');
  p.textContent = msg;
  if (isError) {
    p.style.color = 'red';
  }

  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
  console.log(`[install.js] ${msg}`);
}
