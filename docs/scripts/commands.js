export const Commands = {
  clear: `
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
    })();
  `,
  createDirectory: (path) => `
    (() => {
      var fs = require("fs");
      try {
        // Check if directory exists
        fs.readdir(${JSON.stringify(path)});
        return {
          success: true,
          message: 'Directory "${path}/" already exists.',
        };
      } catch (error) {
        try {
          // Attempt to create the directory
          fs.mkdir(${JSON.stringify(path)});
          return {
            success: true,
            message: 'Directory "${path}" created successfully on device.',
          };
        } catch (mkdirError) {
          return { success: false, message: mkdirError.message };
        }
      }
    })();
  `,
  deleteDirectory: (path) => `
    (() => {
      var fs = require("fs");
      var logs = [];

      function deleteFilesRecursive(path) {
        try {
          logs.push("Reading: " + path);
          var files = fs.readdir(path);

          files.forEach(function (file) {
            if (file === "." || file === "..") return;
            var full = path + "/" + file;

            try {
              fs.readdir(full); // Check if it's a directory
            } catch (err) {
              // Not a directory, delete file
              try {
                fs.unlink(full);
                logs.push("Deleted file: " + full);
              } catch (delErr) {
                logs.push("Failed to delete file: " + full + " — " + delErr.message);
              }
            }
          });

          return true;
        } catch (e) {
          logs.push("Failed to read directory: " + path + " — " + e.message);
          return false;
        }
      }

      try {
        var ok = deleteFilesRecursive(${JSON.stringify(path)});
        return {
          success: ok,
          message: logs.join("\\n")
        };
      } catch (error) {
        return { success: false, message: "Fatal error: " + error.message };
      }
    })();
  `,
  installBootloader: () => `
    (() => {
      try {
        require("Storage").write(".boot0", \`
          E.on("init", function () {
            require("fs")
              .readdir("USER_BOOT")
              .forEach(function (f) {
                if (f.endsWith(".js")) {
                  eval(require("fs").readFile("USER_BOOT/" + f));
                }
              });
          });
        \`);
        return { success: true, message: "Bootloader installed successfully!" };
      } catch (e) {
        return { success: false, message: e.message };
      }
    })();
  `,
  launch: (appPath) => `
    (() => {
      var fs = require("fs");
      try {
        eval(fs.readFile("${appPath}"));
        return { success: true, message: "App launched successfully!" };
      } catch (error) {
        return { success: false, message: error.message };
      }
    })();
  `,
  reboot: `
    (() => {
      setTimeout(() => { 
        E.reboot(); 
      }, 100);
    })();
  `,
};
