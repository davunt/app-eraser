const { ipcRenderer } = require('electron');
const os = require('os');
const path = require('path');

const { execSync } = require('child_process');
const fileIcon = require('file-icon');

const { mojaveDarwinMinVersion } = require('../../utils/config');
const { findAppFiles } = require('./index');

const dropZone = document.getElementById('drag-drop-zone');
const dropZoneText = document.getElementById('drag-drop-zone-text');
const dropZoneImage = document.getElementById('drag-drop-zone-image');
const fileList = document.getElementById('files-list');
const deleteButton = document.getElementById('delete-button');
const clearButton = document.getElementById('clear-button');
const loadingContainer = document.getElementById('loading-container');
const filesHeaderTitle = document.getElementById('files-header-title');

const filesImage = '../../assets/img/files.svg';
const addFileImage = '../../assets/img/add_files.svg';

const isValidApp = (appPath) => path.extname(appPath) === '.app';

const getAppIcon = (bundleId) => fileIcon.buffer(bundleId);

const getSelectedFiles = () => [...document.querySelectorAll('input[name=checkbox]:checked')].map((item) => item.value);

const removeChildren = (parent) => {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};

function clearList() {
  removeChildren(fileList);
  dropZoneText.innerHTML = 'Drop Apps Here or Click To Select';
  filesHeaderTitle.innerHTML = 'Related Files';
  dropZoneImage.src = addFileImage;
  deleteButton.disabled = true;
}

async function moveFilesToTrash() {
  try {
    const selectedFiles = getSelectedFiles();

    const spOptions = {
      name: 'App Eraser',
    };

    const posixFile = `POSIX file \\"${selectedFiles.join('\\", POSIX file \\"')}\\"`;

    await execSync(`osascript -e "tell application \\"Finder\\" to delete { ${posixFile} } "`, spOptions).toString();
    clearList();
  } catch (err) {
    console.error(err);
    ipcRenderer.send(
      'handleError',
      `Please update your permissions in System Preferences > Security and Privacy > Privacy > Automation and enable the Finder permission for App Eraser.
      \r\nYou can learn more about permissions in the Permissions screen under Help in the tool bar.`,
    );
  }
}

async function getBundleIdentifier(appName) {
  const bundleId = await execSync(`osascript -e 'id of app "${appName}"'`).toString();
  console.log('bundleId', bundleId);
  // remove empty space at end of string
  return bundleId.substring(0, bundleId.length - 1);
}

function appNameFromPath(appPath) {
  const pathArr = appPath.split('/');
  const appNameWithExt = pathArr[pathArr.length - 1];
  // remove .app extension
  return appNameWithExt.replace('.app', '');
}

function listItem(filePath, index) {
  const isEven = index % 2 === 0;
  const div = document.createElement('div');
  if (isEven) {
    div.classList.add('fileItem1');
  } else {
    div.classList.add('fileItem2');
  }

  const inp = document.createElement('input');
  inp.type = 'checkbox';
  inp.id = 'checkbox';
  inp.name = 'checkbox';
  inp.value = filePath;
  inp.checked = true;

  const label = document.createElement('label');
  label.htmlFor = 'checkbox';
  label.style['word-wrap'] = 'break-word';
  label.style['max-width'] = '500px';

  label.appendChild(document.createTextNode(filePath));
  div.append(inp);
  div.appendChild(label);
  fileList.appendChild(div);
}

async function appSelectionHandler(appPath) {
  loadingContainer.style.display = 'flex';
  clearList();
  if (isValidApp(appPath)) {
    const appName = appNameFromPath(appPath);
    const bundleId = await getBundleIdentifier(appName);
    if (os.release() > mojaveDarwinMinVersion) {
      try {
        const appIconBuffer = await getAppIcon(bundleId);
        dropZoneImage.src = `data:image/png;base64,${appIconBuffer.toString('base64')}`;
      } catch (err) {
        dropZoneImage.src = filesImage;
      }
    } else {
      dropZoneImage.src = filesImage;
    }

    const appFiles = await findAppFiles(appName, bundleId);
    appFiles.forEach((filePath, i) => {
      listItem(filePath, i);
    });

    dropZoneText.innerHTML = `${appName}`;
    filesHeaderTitle.innerHTML = `Related Files (${appFiles.length} Files)`;
    clearButton.style.display = 'block';
    deleteButton.disabled = false;
  } else {
    ipcRenderer.send('handleError', 'Selected file is not a valid app');
  }
  loadingContainer.style.display = 'none';
}

async function openAppSelector() {
  loadingContainer.style.display = 'flex';
  const selectedApp = await ipcRenderer.invoke('selectAppFromFinder');
  if (selectedApp) appSelectionHandler(selectedApp);
  else loadingContainer.style.display = 'none';
}

deleteButton.addEventListener('click', async () => {
  const selectedFiles = getSelectedFiles();

  const confirmDialogResp = await ipcRenderer.invoke(
    'confirmDialog',
    'Are you sure?',
    `${selectedFiles.length} files will be moved to trash`,
  );

  if (confirmDialogResp.response === 0) {
    moveFilesToTrash(selectedFiles);
  }
});

clearButton.addEventListener('click', () => {
  clearList();
});

dropZone.addEventListener('click', openAppSelector);

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const { files } = event.dataTransfer;

  Object.keys(files).forEach((f) => {
    // Using the path attribute to get absolute file path
    appSelectionHandler(files[`${f}`].path);
  });
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});
