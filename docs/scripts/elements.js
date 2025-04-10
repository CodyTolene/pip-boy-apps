export const Buttons = {
  get connect() {
    return document.getElementById('connect-btn');
  },
  get restart() {
    return document.getElementById('restart-btn');
  },
  get deleteDirAppInfo() {
    return document.getElementById('delete-dir-appinfo-btn');
  },
  get deleteDirUser() {
    return document.getElementById('delete-dir-user-btn');
  },
  get deleteDirUserBoot() {
    return document.getElementById('delete-dir-user-btn-boot-btn');
  },
  get setBootloader() {
    return document.getElementById('install-bootloader-btn');
  },
};

export const Inputs = {
  get userFiles() {
    return document.getElementById('user-files-input');
  },
  get userFile() {
    return document.getElementById('user-file-input');
  },
  get bootFiles() {
    return document.getElementById('boot-files-input');
  },
};

export const Labels = {
  get userFiles() {
    return document.getElementById('user-files-input-label');
  },
  get userFile() {
    return document.getElementById('user-file-input-label');
  },
  get bootFiles() {
    return document.getElementById('boot-files-input-label');
  },
};

export const ProgressBars = {
  get userFiles() {
    return document.getElementById('user-files-progress');
  },
  get bootFiles() {
    return document.getElementById('boot-files-progress');
  },
};

export const ProgressBarContainer = {
  get userFiles() {
    return document.getElementById('user-files-progress-container');
  },
  get bootFiles() {
    return document.getElementById('boot-files-progress-container');
  },
};
