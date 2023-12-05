const { ipcRenderer, shell } = require('electron');
const os = require('os');
const path = require('path');

const { execSync } = require('child_process');
const fileIcon = require('file-icon');

const { mojaveDarwinMinVersion } = require('../../utils/config');
const { findAppFilesToRemove } = require('./index');

const dropZone = document.getElementById('drag-drop-zone');
const dropZoneText = document.getElementById('drag-drop-zone-text');
const dropZoneImage = document.getElementById('drag-drop-zone-image');
const fileList = document.getElementById('files-list');
const deleteButton = document.getElementById('delete-button');
const clearButton = document.getElementById('clear-button');
const loadingContainer = document.getElementById('loading-container');
const filesHeaderSubtitle = document.getElementById('files-header-subtitle');

const filesImage = '../../assets/img/files.svg';
const addFileImage = '../../assets/img/add_files.svg';

let globAppName = '';

const isValidApp = (appPath) => path.extname(appPath) === '.app';

const getAppIcon = (bundleId) => fileIcon.buffer(bundleId);

const getSelectedFiles = () => [...document.querySelectorAll('input[name=checkbox]:checked')].map(
  (item) => item.value,
);

const removeChildren = (parent) => {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};

function clearList() {
  removeChildren(fileList);
  dropZoneText.innerHTML = 'Drag and Drop App Here';
  filesHeaderSubtitle.innerHTML = 'Related Files';
  dropZoneImage.src = addFileImage;
  deleteButton.disabled = true;
}

async function closeRunningApplication() {
  try {
    await execSync(`osascript -e 'quit app "${globAppName}"'`);
  } catch (err) {
    console.error(err);
    ipcRenderer.send('handleError', 'Unable to close running application');
  }
}

async function moveFilesToTrash() {
  try {
    closeRunningApplication();
    const selectedFiles = getSelectedFiles();

    const spOptions = {
      name: 'App Eraser',
    };

    const posixFile = `POSIX file \\"${selectedFiles.join(
      '\\", POSIX file \\"',
    )}\\"`;

    await execSync(
      `osascript -e "tell application \\"Finder\\" to delete { ${posixFile} } "`,
      spOptions,
    ).toString();
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
  const bundleId = await execSync(
    `osascript -e 'id of app "${appName}"'`,
  ).toString();
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

function openInFinder(filePath) {
  shell.showItemInFolder(filePath);
}

function listItem(filePath, index) {
  const isEven = index % 2 === 0;
  const div = document.createElement('div');
  if (isEven) {
    div.classList.add('fileItem');
    div.classList.add('fileItem1');
  } else {
    div.classList.add('fileItem');
    div.classList.add('fileItem2');
  }

  // create checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'checkbox';
  checkbox.name = 'checkbox';
  checkbox.value = filePath;
  checkbox.checked = true;
  checkbox.style.display = 'inline-block';

  const appNameLabel = document.createElement('p');
  appNameLabel.classList.add('fileItemAppName');

  const filePathLabel = document.createElement('label');
  filePathLabel.htmlFor = 'checkbox';
  filePathLabel.classList.add('fileItemPathLabel');

  appNameLabel.appendChild(document.createTextNode(filePath.split('/').slice(-1)));
  filePathLabel.appendChild(document.createTextNode(filePath.split('/').slice(0, -1).join('/')));

  const viewInFinderBtn = document.createElement('a');
  viewInFinderBtn.addEventListener('click', () => openInFinder(filePath));
  viewInFinderBtn.style.float = 'right';
  viewInFinderBtn.classList.add('fa-regular');
  viewInFinderBtn.classList.add('fa-folder-open');

  div.append(checkbox);
  div.append(appNameLabel);
  div.append(viewInFinderBtn);
  div.append(document.createElement('br'));
  div.append(filePathLabel);
  fileList.appendChild(div);
}

async function appSelectionHandler(appPath) {
  loadingContainer.style.display = 'flex';
  clearList();
  if (isValidApp(appPath)) {
    globAppName = appNameFromPath(appPath);
    const bundleId = await getBundleIdentifier(globAppName);
    if (os.release() > mojaveDarwinMinVersion) {
      try {
        const appIconBuffer = await getAppIcon(bundleId);
        dropZoneImage.src = `data:image/png;base64,${appIconBuffer.toString(
          'base64',
        )}`;
      } catch (err) {
        dropZoneImage.src = filesImage;
      }
    } else {
      dropZoneImage.src = filesImage;
    }

    const appFiles = await findAppFilesToRemove(globAppName, bundleId);
    appFiles.forEach((filePath, i) => {
      listItem(filePath, i);
    });

    dropZoneText.innerHTML = `${globAppName}`;
    filesHeaderSubtitle.innerHTML = `${appFiles.length} Files Found`;
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
    moveFilesToTrash();
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
