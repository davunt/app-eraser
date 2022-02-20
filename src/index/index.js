const fs = require('fs/promises');
// eslint-disable-next-line security/detect-child-process
const { execSync } = require('child_process');
const { ipcRenderer } = require('electron');

const { pathLocations } = require('../../utils/pathLocations');

const loadingContainer = document.getElementById('loadingContainer');
const dropZone = document.getElementById('drag-drop-zone');
const headerText = document.getElementById('files-header-title');
const fileList = document.getElementById('files-list');
const deleteButton = document.getElementById('delete-button');
const clearButton = document.getElementById('clear-button');

let appFiles = [];

const removeChildren = (parent) => {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};

function clearList() {
  appFiles = [];
  removeChildren(fileList);
  deleteButton.disabled = true;
}

async function moveFilesToTrash() {
  const checkboxes = document.querySelectorAll('input[name="checkbox"]:checked');

  const selectedFiles = [];

  checkboxes.forEach((checkbox) => {
    selectedFiles.push(checkbox.value);
  });

  const spOptions = {
    name: 'App Eraser',
  };

  const posixFile = `POSIX file \\"${selectedFiles.join('\\", POSIX file \\"')}\\"`;

  await execSync(`osascript -e "tell application \\"Finder\\" to delete { ${posixFile} } "`, spOptions).toString();
}

deleteButton.addEventListener('click', () => {
  document.getElementById('loadingContainer').style.display = 'flex';
  document.getElementById('loadingText').innerHTML = 'deleting files...';
  moveFilesToTrash(appFiles);
  clearList();
  document.getElementById('loadingContainer').style.display = 'none';
});

clearButton.addEventListener('click', () => {
  clearList(appFiles);
});

dropZone.addEventListener('click', () => {
  ipcRenderer.send('selectAppFromFinder');
});

async function getBundleIdentifier(appName) {
  const bundleId = await execSync(`osascript -e 'id of app "${appName}"'`).toString();

  return bundleId.substring(0, bundleId.length - 1);
}

function appNameFromPath(path) {
  const pathArr = path.split('/');
  const appNameWithExt = pathArr[pathArr.length - 1];
  // remove .app extension
  return appNameWithExt.slice(0, appNameWithExt.length - 4);
}

async function getFilePatternArray(appName, bundleId) {
  const appNameNorm = appName.toLowerCase().replace(' ', '');
  const bundleIdNorm = bundleId.toLowerCase().replace(' ', '');

  const patternArray = [appNameNorm, bundleIdNorm];

  return patternArray;
}

function isPatternInFile(patterns, fileToCheck) {
  return patterns.find((filePatten) => {
    if (fileToCheck.includes(filePatten)) {
      return true;
    }
    return false;
  });
}

async function findAppFiles(appName) {
  try {
    const bundleId = await getBundleIdentifier(appName);
    const bundleIdComponents = bundleId.split('.');
    const filesToRemove = new Set([]);

    const companyDirs = pathLocations.map((pathLocation) => `${pathLocation}/${bundleIdComponents[1]}`);
    const pathsToSearch = [...pathLocations, ...companyDirs];
    const directoryFilesPromiseArr = pathsToSearch.map((pathLocation) => fs.readdir(pathLocation));
    const directoryFiles = await Promise.allSettled(directoryFilesPromiseArr);

    const patternArray = await getFilePatternArray(appName, bundleId);

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

async function isValidApp(appPath) {
  const extension = appPath.slice(-4);
  if (!extension === '.app') return false;
  return true;
}

async function removeApp(appPath) {
  loadingContainer.style.display = 'flex';

  clearList();
  await isValidApp(appPath);
  const appName = appNameFromPath(appPath);

  appFiles = await findAppFiles(appName);
  appFiles.forEach((filePath, i) => {
    listItem(filePath, i);
  });

  headerText.innerHTML = `${appName} (${appFiles.length} Files)`;

  deleteButton.disabled = false;
  loadingContainer.style.display = 'none';
}

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const { files } = event.dataTransfer;

  Object.keys(files).forEach((f) => {
    // Using the path attribute to get absolute file path
    removeApp(files[`${f}`].path);
  });
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

ipcRenderer.on('selectAppFromFinder', (e, value) => {
  removeApp(value);
});
