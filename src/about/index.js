const { ipcRenderer } = require('electron');
const { appRepoURL, appMastodonURL, maintainerMastodonURL } = require('../../utils/constants');

const appRepoIcon = document.getElementById('appRepoIcon');
const appMastoIcon = document.getElementById('appMastoIcon');
const maintainerMastoIcon = document.getElementById('maintainerMastoIcon');

appRepoIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', appRepoURL);
});

appMastoIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', appMastodonURL);
});

maintainerMastoIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', maintainerMastodonURL);
});

ipcRenderer.on('appVersion', (e, value) => {
  const versionNumberText = document.getElementById('versionNumberText');
  versionNumberText.innerHTML = value;
});
