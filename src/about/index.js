const { ipcRenderer } = require('electron');
const { githubRepoURL, maintainerTwitterURL } = require('../../utils/constants');

const githubRepoIcon = document.getElementById('githubIcon');
const maintainerTwitterIcon = document.getElementById('twitterIcon');

githubRepoIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', githubRepoURL);
});

maintainerTwitterIcon.addEventListener('click', () => {
  ipcRenderer.send('openURL', maintainerTwitterURL);
});

ipcRenderer.on('appVersion', (e, value) => {
  const versionNumberText = document.getElementById('versionNumberText');
  versionNumberText.innerHTML = value;
});
