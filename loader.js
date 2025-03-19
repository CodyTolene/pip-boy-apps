if (window.location.host=="thewandcompany.github.io") {
  document.getElementById("apploaderlinks").innerHTML =
    'This is the main Pip-Boy Mod Tool';
} else if (window.location.hostname==='localhost') {
  document.title += " [Local]";
  Const.APPS_JSON_FILE = "apps.local.json";
  document.getElementById("apploaderlinks").innerHTML =
    'This is your local Mod Tool - you can try the <a href="https://thewandcompany.github.io/pip-boy/">Official Version</a> here.';
} else {
  document.title += " [Unofficial]";
  document.getElementById("apploaderlinks").innerHTML =
    'This is a fork of the main Mod Tool - you can try the <a href="https://thewandcompany.github.io/pip-boy/">Official Version</a> here.';
}

var RECOMMENDED_VERSION = "2v24.446";

// We're only interested in
DEVICEINFO = [
  {
    id : "PIPBOY",
    name : "Pip-Boy",
    features : ["GRAPHICS"],
    g : { width : 480, height : 320, bpp : 16 },
    img : ""
  }
];
Const.FILES_IN_FS = true;
Const.HAS_E_SHOWMESSAGE = false;
Const.CODE_PROGRESSBAR = "g.drawRect(10,g.getHeight()-16,g.getWidth()-10,g.getHeight()-8).flip();p=x=>g.fillRect(10,g.getHeight()-16,10+(g.getWidth()-20)*x/100,g.getHeight()-8);",
Const.NO_RESET = true;
Const.LOAD_APP_AFTER_UPLOAD = true;
Const.UPLOAD_CHUNKSIZE = 2048;
Const.PACKET_UPLOAD_CHUNKSIZE = 1024*7;
Const.PACKET_UPLOAD_NOACK = true; // we're over USB and confident in flow control


// Set up source code URL
(function() {
  let username = "thewandcompany";
  let githubMatch = window.location.href.match(/\/([\w-]+)\.github\.io/);
  if (githubMatch) username = githubMatch[1];
  Const.APP_SOURCECODE_URL = `https://github.com/${username}/pip-boy/tree/master/apps`;
})();

// When a device is found, filter the apps accordingly
function onFoundDeviceInfo(deviceId, deviceVersion) {
  var fwURL = "#", fwExtraText = "";
  if (deviceId == "PIPBOY") {
    Const.MESSAGE_RELOAD = 'Press power button to reload';
  }

  if (deviceId != "PIPBOY") {
    showToast(`You're using ${deviceId}, not a Pip-Boy! Did you want <a href="https://espruino.com/apps">espruino.com/apps</a> instead?` ,"warning", 20000);
  } else if (versionLess(deviceVersion, RECOMMENDED_VERSION)) {
//    showToast(`You're using an old firmware (${deviceVersion}) and ${RECOMMENDED_VERSION} is available (<a href="https://www.espruino.com/ChangeLog" target="_blank">see changes</a>). <a href="https://thewand.co/pip-boy" target="_blank">Click here to update</a>` ,"warning", 20000);
    showToast(`You're using an old firmware (${deviceVersion}) and ${RECOMMENDED_VERSION} is available. <a href="https://thewand.co/pip-boy/upgrade/?file=fwupdate_${RECOMMENDED_VERSION}.zip">Click here to update</a>` ,"warning", 20000);
  }
}

// Called when we refresh the list of installed apps
//function onRefreshMyApps() { }

window.addEventListener('load', (event) => {
});

//function onAppJSONLoaded() {}

/**
 * Warn the page must be served over HTTPS
 * The `beforeinstallprompt` event won't fire if the page is served over HTTP.
 * Installability requires a service worker with a fetch event handler, and
 * if the page isn't served over HTTPS, the service worker won't load.
 */
if (window.location.protocol === 'http:' && window.location.hostname!="localhost") {
  const requireHTTPS = document.getElementById('requireHTTPS');
  const link = requireHTTPS.querySelector('a');
  link.href = window.location.href.replace('http://', 'https://');
  requireHTTPS.classList.remove('hidden');
}


// DEBUGGING
//UART.debug=3;
