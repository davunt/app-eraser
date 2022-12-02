const { ipcRenderer } = require('electron');
const { appRepoURL } = require('../../utils/constants');

const appRepoIcon = document.getElementById('appRepoIcon');

appRepoIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', appRepoURL);
});

ipcRenderer.on('appVersion', (e, value) => {
  const versionNumberText = document.getElementById('versionNumberText');
  versionNumberText.innerHTML = value;
});
