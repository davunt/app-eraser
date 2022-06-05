const { ipcRenderer } = require('electron');
const { appRepoURL, appTwitterURL, maintainerTwitterURL } = require('../../utils/constants');

const appRepoIcon = document.getElementById('appRepoIcon');
const appTwitterIcon = document.getElementById('appTwitterIcon');
const maintainerTwitterIcon = document.getElementById('maintainerTwitterIcon');

appRepoIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', appRepoURL);
});

appTwitterIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', appTwitterURL);
});

maintainerTwitterIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', maintainerTwitterURL);
});

ipcRenderer.on('appVersion', (e, value) => {
  const versionNumberText = document.getElementById('versionNumberText');
  versionNumberText.innerHTML = value;
});
