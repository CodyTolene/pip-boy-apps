(function () {
  var btn = document.getElementById("pip-boy-screenshot");

  btn.addEventListener("click", event => {
    if (!Comms.isConnected()) {
      startProgressiveScreenshot(true); // Demo mode
      return;
    }

    getInstalledApps(false).then(() => {
      if (device.id == "BANGLEJS") {
        showPrompt("Screenshot", "Screenshots are not supported on Bangle.js 1", { ok: 1 });
      } else {
        startProgressiveScreenshot();
      }
    }).catch(() => {
      // If device connection fails, show demo progressive screenshot
      startProgressiveScreenshot(true); // true = demo mode
    });
  });
})();

// Progressive screenshot functionality
function startProgressiveScreenshot(demoMode = false) {
  let canvas, ctx;
  let modal;
  let originalDataHandler;
  let timeoutId;
  let finalizeTimeoutId;
  let completed = false;

  const commsLib = (typeof UART !== "undefined") ? UART : Puck;
  const originalTimeouts = {
    timeoutNormal: commsLib.timeoutNormal,
    timeoutNewline: commsLib.timeoutNewline,
    timeoutMax: commsLib.timeoutMax
  };

  // Function to restore timeouts
  const restoreTimeouts = () => {
    commsLib.timeoutNormal = originalTimeouts.timeoutNormal;
    commsLib.timeoutNewline = originalTimeouts.timeoutNewline;
    commsLib.timeoutMax = originalTimeouts.timeoutMax;
  };
  
  // Create the progressive screenshot window immediately
  modal = htmlElement(`<div class="modal active">
    <div class="modal-overlay"></div>
    <div class="modal-container" style="max-width: 600px;">
      <div class="modal-header">
        <a href="#close" class="btn btn-clear float-right" aria-label="Close"></a>
        <div class="modal-title h5">Screenshot Data Transfer</div>
      </div>
      <div class="modal-body">
        <div class="content" style="text-align: center;">
          <canvas id="progressive-canvas" style="border: 1px solid #ccc; max-width: 100%; height: auto;"></canvas>
          <br><br>
          <div id="screenshot-status">Preparing screenshot...</div>
          <div class="progress" style="margin-top: 10px;">
            <div class="progress-bar" id="screenshot-progress" style="width: 0%;"></div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="save-screenshot" disabled>Save Image</button>
        <button class="btn" id="cancel-screenshot">Cancel</button>
      </div>
    </div>
  </div>`);
  
  document.body.append(modal);
  
  canvas = modal.querySelector('#progressive-canvas');
  ctx = canvas.getContext('2d');
  
  // Set up canvas dimensions (default Bangle.js 2 screen size)
  canvas.width = 176;
  canvas.height = 176;
  
  // Clear canvas to black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const statusDiv = modal.querySelector('#screenshot-status');
  const progressBar = modal.querySelector('#screenshot-progress');
  const saveBtn = modal.querySelector('#save-screenshot');
  const cancelBtn = modal.querySelector('#cancel-screenshot');
  
  // Set up event handlers
  const cleanup = () => {
    try {
      restoreTimeouts();
      if (originalDataHandler) {
        Comms.on("data", originalDataHandler);
      } else {
        Comms.on("data"); // Remove our handler
      }
    } catch (err) {
      // Ignore errors when no connection is active
      console.log("Could not restore data handler:", err.message);
    }
    if (timeoutId) clearTimeout(timeoutId);
    if (finalizeTimeoutId) clearTimeout(finalizeTimeoutId);
  };
  
  const closeModal = () => {
    cleanup();
    modal.remove();
  };
  
  modal.querySelector("a[href='#close']").addEventListener("click", event => {
    event.preventDefault();
    closeModal();
  });
  
  cancelBtn.addEventListener("click", event => {
    event.preventDefault();
    closeModal();
  });
  
  saveBtn.addEventListener("click", event => {
    event.preventDefault();
    const url = canvas.toDataURL();
    let link = document.createElement("a");
    link.download = "screenshot.png";
    link.target = "_blank";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  // Set up timeout settings for screenshot
  // Set tripled timeouts for screenshot (3x default values)
  commsLib.timeoutNormal = 900; // 3 * 300ms
  commsLib.timeoutNewline = 30000; // 3 * 10000ms  
  commsLib.timeoutMax = 90000; // 3 * 30000ms
  
  // Save original data handler if one exists
  if (Comms.handlers && Comms.handlers.data) {
    originalDataHandler = Comms.handlers.data;
  }
  
  // If in demo mode, prompt for device connection instead
  if (demoMode) {
    // Device not connected - prompt user to connect via webserial
    statusDiv.textContent = "No device connected. Please connect your device via Web Serial.";
    progressBar.style.width = '0%';
    
    // Create connect button
    const connectButtonDiv = document.createElement('div');
    connectButtonDiv.style.marginTop = '20px';
    connectButtonDiv.innerHTML = '<button class="btn btn-primary" id="connect-device-btn">Connect Device</button>';
    
    // Insert the connect button after the status div
    statusDiv.parentNode.insertBefore(connectButtonDiv, statusDiv.nextSibling);
    
    // Handle connect button click
    connectButtonDiv.querySelector('#connect-device-btn').addEventListener('click', () => {
      // Close this modal and trigger the main connect flow
      closeModal();
      
      // Trigger the main device connection
      const connectBtn = document.getElementById('connectmydevice');
      if (connectBtn) {
        connectBtn.click();
      }
    });
    
    return; // Exit - wait for user to connect device
  }
  
  // Set up progressive data handler for real device communication
  let isReceivingData = false;
  let dataStarted = false;
  let accumulatedData = "";
  
  const resetTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (completed) return;
      statusDiv.textContent = "Screenshot timed out";
      cleanup();
    }, 60000);
  };

  const markComplete = () => {
    if (completed) return;
    completed = true;
    statusDiv.textContent = "Screenshot complete!";
    progressBar.style.width = '100%';
    saveBtn.disabled = false;
    cleanup();
  };

  const extractDataUrl = (text) => {
    const start = text.indexOf('data:image');
    if (start === -1) return null;

    const slice = text.slice(start);
    const lines = slice.split('\n');
    if (!lines.length) return null;

    const firstLine = lines[0].trim();
    if (!firstLine.startsWith('data:image')) return null;

    const marker = 'base64,';
    const markerIndex = firstLine.indexOf(marker);
    if (markerIndex === -1) return null;

    let header = firstLine.slice(0, markerIndex + marker.length);
    let base64 = firstLine.slice(markerIndex + marker.length);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) break;
      if (!/^[A-Za-z0-9+/=]+$/.test(line)) break;
      base64 += line;
    }

    if (base64.length < 100) return null;
    const pad = base64.length % 4;
    if (pad === 2) base64 += "==";
    else if (pad === 3) base64 += "=";
    else if (pad === 1) return null;

    return header + base64;
  };

  Comms.on("data", (data) => {
    // Call original handler first if it exists
    if (originalDataHandler) {
      originalDataHandler(data);
    }
    
    // Accumulate all data
    accumulatedData += data;
    resetTimeout();
    
    // Look for the start of the data URL
    if (!dataStarted && accumulatedData.includes('data:image')) {
      dataStarted = true;
      statusDiv.textContent = "Receiving screenshot data...";
      progressBar.style.width = '10%';
    }
    
    // If we've started receiving data, try to render progressively
    if (dataStarted) {
      // Show simple progress without percentage (inaccurate progress bar removed)
      statusDiv.textContent = "Receiving screenshot data...";
      progressBar.style.width = '50%'; // Simple visual indicator
      
      const dataUrl = extractDataUrl(accumulatedData);
      if (dataUrl) {
        try {
          const tempImg = new Image();
          tempImg.onload = () => {
            if (completed) return;
            if (tempImg.width > 0 && tempImg.height > 0) {
              canvas.width = tempImg.width;
              canvas.height = tempImg.height;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(tempImg, 0, 0);
              saveBtn.disabled = false;
              statusDiv.textContent = "Screenshot received successfully!";
              progressBar.style.width = '100%';
              if (finalizeTimeoutId) clearTimeout(finalizeTimeoutId);
              finalizeTimeoutId = setTimeout(markComplete, 750);
            }
          };
          tempImg.onerror = () => {
            // Partial data, continue waiting
          };
          tempImg.src = dataUrl;
        } catch (e) {
          // Invalid data, continue
        }
      }
    }
    
    // Check if transmission is complete
    if (dataStarted && (
      accumulatedData.includes('\n>') || 
      accumulatedData.includes('undefined\n') ||
      data.trim().endsWith('>')
    )) {
      statusDiv.textContent = "Processing final image...";
      progressBar.style.width = '100%';
      
      const finalDataUrl = extractDataUrl(accumulatedData);
      
      if (finalDataUrl) {
        const finalImg = new Image();
        finalImg.onload = () => {
          // Final render
          canvas.width = finalImg.width;
          canvas.height = finalImg.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(finalImg, 0, 0);
          markComplete();
        };
        finalImg.onerror = () => {
          statusDiv.textContent = "Error processing image";
        };
        finalImg.src = finalDataUrl;
      } else {
        statusDiv.textContent = "No valid image data received";
      }
      
      // Cleanup
      cleanup();
    }
  });
  
  resetTimeout();
  
  // Start the screenshot process
  statusDiv.textContent = "Starting screenshot...";
  
  Comms.write("\x10g.dump();\n").catch((err) => {
    statusDiv.textContent = "Error: " + err;
    restoreTimeouts();
    cleanup();
  });
}
