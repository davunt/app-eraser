const { ipcRenderer } = require('electron');
const fs = require('fs/promises');
const path = require('path');
// eslint-disable-next-line security/detect-child-process
const { execSync } = require('child_process');

const { pathLocations, commonExtensions } = require('../../utils/pathLocations');

const dropZone = document.getElementById('drag-drop-zone');
const headerText = document.getElementById('files-header-title');
const fileList = document.getElementById('files-list');
const deleteButton = document.getElementById('delete-button');
const clearButton = document.getElementById('clear-button');

const scoreThreshold = 0.4;

const getSelectedFiles = () => [...document.querySelectorAll('input[name=checkbox]:checked')].map((item) => item.value);

const removeChildren = (parent) => {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};

function clearList() {
  removeChildren(fileList);
  deleteButton.disabled = true;
  headerText.innerHTML = 'Related Files';
}

async function moveFilesToTrash() {
  const selectedFiles = getSelectedFiles();

  const spOptions = {
    name: 'App Eraser',
  };

  const posixFile = `POSIX file \\"${selectedFiles.join('\\", POSIX file \\"')}\\"`;

  await execSync(`osascript -e "tell application \\"Finder\\" to delete { ${posixFile} } "`, spOptions).toString();
}

async function getBundleIdentifier(appName) {
  const bundleId = await execSync(`osascript -e 'id of app "${appName}"'`).toString();
  // remove empty space at end of string
  return bundleId.substring(0, bundleId.length - 1);
}

function appNameFromPath(appPath) {
  const pathArr = appPath.split('/');
  const appNameWithExt = pathArr[pathArr.length - 1];
  // remove .app extension
  return appNameWithExt.replace('.app', '');
}

async function getFilePatternArray(appName, bundleId) {
  const appNameNorm = appName.toLowerCase().replace(' ', '');
  const appNameUnderscore = appName.toLowerCase().replace(' ', '_');
  const appNameDash = appName.toLowerCase().replace(' ', '-');
  const appNameDot = appName.toLowerCase().replace(' ', '.');
  const bundleIdNorm = bundleId.toLowerCase().replace(' ', '');

  let patternArray = [appNameNorm, appNameUnderscore, appNameDash, appNameDot, bundleIdNorm];

  const bundleIdComponents = bundleIdNorm.split('.');

  if (bundleIdComponents.length > 2 && bundleIdComponents[bundleIdComponents.length - 1].toLowerCase() === 'app') {
    patternArray.push(`${bundleIdComponents.slice(0, bundleIdComponents.length - 1).join('.')}`);
  }

  const appExtensions = commonExtensions.map((extension) => `${appNameNorm}${extension}`);

  patternArray = [...patternArray, ...appExtensions];

  return patternArray;
}

function isPatternInFile(patterns, fileToCheck) {
  return patterns.find((filePatten) => {
    if (fileToCheck.includes(filePatten)) {
      let score = 0;
      const indexOfString = fileToCheck.indexOf(filePatten);
      for (let i = 0; i < fileToCheck.length; i += 1) {
        if (i === indexOfString) {
          i += indexOfString + filePatten.length;
          score += filePatten.length;
        }
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(fileToCheck[parseInt(i, 10)])) score += 0.5;
        if (fileToCheck[parseInt(i, 10)] === '.') score += 0.5;
        if (fileToCheck[parseInt(i, 10)] === '_') score += 0.5;
      }
      if (score / fileToCheck.length > scoreThreshold) {
        return true;
      }
      return false;
    }
    return false;
  });
}

async function findAppFiles(appName) {
  try {
    const bundleId = await getBundleIdentifier(appName);
    console.debug('bundleId', bundleId);
    const bundleIdComponents = bundleId.split('.');

    const companyDirs = pathLocations.map((pathLocation) => `${pathLocation}/${bundleIdComponents[1]}`);
    const pathsToSearch = [...pathLocations, ...companyDirs];
    const directoryFilesPromiseArr = pathsToSearch.map((pathLocation) => fs.readdir(pathLocation));
    const directoryFiles = await Promise.allSettled(directoryFilesPromiseArr);

    const patternArray = await getFilePatternArray(appName, bundleId);

    const filesToRemove = new Set([]);

    directoryFiles.forEach((dir, index) => {
      if (dir.status === 'fulfilled') {
        dir.value.forEach((dirFile) => {
          const dirFileNorm = dirFile.toLowerCase().replace(' ', '');
          if (
            isPatternInFile(patternArray, dirFileNorm)
          ) {
            filesToRemove.add(`${pathsToSearch[parseInt(index, 10)]}/${dirFile}`);
          }
        });
      }
    });

    // convert set to array
    return [...filesToRemove];
  } catch (err) {
    console.error(err);
    throw err;
  }
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
  label.appendChild(document.createTextNode(filePath));
  div.append(inp);
  div.appendChild(label);
  fileList.appendChild(div);
}

const isValidApp = (appPath) => path.extname(appPath) === '.app';

async function appSelectionHandler(appPath) {
  clearList();
  if (isValidApp(appPath)) {
    const appName = appNameFromPath(appPath);

    const appFiles = await findAppFiles(appName);
    appFiles.forEach((filePath, i) => {
      listItem(filePath, i);
    });

    headerText.innerHTML = `${appName} (${appFiles.length} Files)`;

    deleteButton.disabled = false;
  } else {
    ipcRenderer.send('handleError', 'Selected file is not a valid app');
  }
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
    clearList();
  }
});

clearButton.addEventListener('click', () => {
  clearList();
});

dropZone.addEventListener('click', async () => {
  const selectedApp = await ipcRenderer.invoke('selectAppFromFinder');
  if (selectedApp) appSelectionHandler(selectedApp);
});

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
