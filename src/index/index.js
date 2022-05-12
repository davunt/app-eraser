const { ipcRenderer } = require('electron');
const os = require('os');
const fs = require('fs/promises');
const path = require('path');
// eslint-disable-next-line security/detect-child-process
const { execSync } = require('child_process');
const fileIcon = require('file-icon');

const { pathLocations, commonSuffix } = require('../../utils/pathLocations');
const { fileRegex } = require('../../utils/fileRegex');

const dropZone = document.getElementById('drag-drop-zone');
const dropZoneText = document.getElementById('drag-drop-zone-text');
const dropZoneImage = document.getElementById('drag-drop-zone-image');
const fileList = document.getElementById('files-list');
const deleteButton = document.getElementById('delete-button');
const clearButton = document.getElementById('clear-button');

const filesImage = '../../assets/img/files.svg';
const addFileImage = '../../assets/img/add_files.svg';

const scoreThreshold = 0.4;
const mojaveDarwinMinVersion = '18.0.0';

const getSelectedFiles = () => [...document.querySelectorAll('input[name=checkbox]:checked')].map((item) => item.value);

const removeChildren = (parent) => {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};

function clearList() {
  removeChildren(fileList);
  dropZoneText.innerHTML = 'Drop Apps Here or Click To Select';
  dropZoneImage.src = addFileImage;
  deleteButton.disabled = true;
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
  console.log('bundleId', bundleId);
  // remove empty space at end of string
  return bundleId.substring(0, bundleId.length - 1);
}

async function getComputerName() {
  const compName = await execSync('scutil --get ComputerName').toString();
  console.log('compName', compName);
  // remove empty space at end of string
  return compName.substring(0, compName.length - 1);
}

function appNameFromPath(appPath) {
  const pathArr = appPath.split('/');
  const appNameWithExt = pathArr[pathArr.length - 1];
  // remove .app extension
  return appNameWithExt.replace('.app', '');
}

function createNameVariations(appName, bundleId) {
  const appNameNorm = appName.toLowerCase().replace(' ', '');
  const appNameWithoutDot = appNameNorm.toLowerCase().replace('.', '');
  const appNameUnderscore = appName.toLowerCase().replace(' ', '_');
  const appNameDash = appName.toLowerCase().replace(' ', '-');
  const appNameDot = appName.toLowerCase().replace(' ', '.');

  const bundleIdNorm = bundleId.toLowerCase().replace(' ', '');

  return [
    appNameNorm,
    appNameWithoutDot,
    appNameUnderscore,
    appNameDash,
    appNameDot,
    bundleIdNorm,
  ];
}

const normalizeString = (str, spacer = '') => str.toLowerCase().replace(/ /g, spacer);

async function getFilePatternArray(appName, bundleId) {
  const nameVariations = createNameVariations(appName, bundleId);
  const appNameNorm = normalizeString(appName);
  const bundleIdNorm = normalizeString(bundleId);

  let patternArray = [...nameVariations];

  const appNameComponents = appNameNorm.split('.');
  if (appNameComponents) patternArray.push(appNameComponents[0]);

  const bundleIdComponents = bundleIdNorm.split('.');
  if (bundleIdComponents.length > 2 && bundleIdComponents[bundleIdComponents.length - 1].toLowerCase() === 'app') {
    patternArray.push(`${bundleIdComponents.slice(0, bundleIdComponents.length - 1).join('.')}`);
  }

  const appWithSuffix = new Set([]);
  commonSuffix.forEach((suffix) => nameVariations.forEach((nameVariation) => appWithSuffix.add(`${nameVariation}${suffix}`)));

  patternArray = [...patternArray, [...appWithSuffix]];

  return patternArray;
}

let compNameGlob;

function stripString(file) {
  let transformedString = file;
  fileRegex.forEach((regex1) => {
    transformedString = transformedString.replace(regex1, '');
  });

  const normCompName = normalizeString(compNameGlob, '-')
    .replace(/\u2019/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '');

  transformedString = transformedString.replace(normCompName, '');
  return transformedString;
}

function isPatternInFile(patterns, fileToCheck) {
  return patterns.find((filePatten) => {
    if (fileToCheck.includes(filePatten)) {
      const strippedFile = stripString(fileToCheck);

      let score = 0;
      const indexOfString = strippedFile.indexOf(filePatten);
      for (let i = 0; i < strippedFile.length; i += 1) {
        if (i === indexOfString) {
          i += indexOfString + filePatten.length;
          score += filePatten.length;
        }
        if (strippedFile[parseInt(i, 10)] === '.') score += 0.5;
        if (strippedFile[parseInt(i, 10)] === '_') score += 0.5;
      }
      if (score / strippedFile.length > scoreThreshold) {
        return true;
      }
      return false;
    }
    return false;
  });
}

async function getAppIcon(bundleId) {
  const iconBuffer = await fileIcon.buffer(bundleId);
  return iconBuffer;
}

async function findAppFiles(appName, bundleId) {
  try {
    compNameGlob = await getComputerName();
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
  label.style['word-wrap'] = 'break-word';
  label.style['max-width'] = '500px';

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
    const bundleId = await getBundleIdentifier(appName);
    if (os.release() > mojaveDarwinMinVersion) {
      const appIconBuffer = await getAppIcon(bundleId);
      dropZoneImage.src = `data:image/png;base64,${appIconBuffer.toString('base64')}`;
    } else {
      dropZoneImage.src = filesImage;
    }

    const appFiles = await findAppFiles(appName, bundleId);
    appFiles.forEach((filePath, i) => {
      listItem(filePath, i);
    });

    dropZoneText.innerHTML = `${appName} (${appFiles.length} Files)`;
    clearButton.style.display = 'block';
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

async function openAppSelector() {
  const selectedApp = await ipcRenderer.invoke('selectAppFromFinder');
  if (selectedApp) appSelectionHandler(selectedApp);
}

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
