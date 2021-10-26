const fs = require('fs/promises');
const { exec } = require('child_process');
const { pathLocations } = require('../../utils/pathLocations');

// eslint-disable-next-line no-undef
const dropZone = document.getElementById('drag-drop-zone');
// eslint-disable-next-line no-undef
const fileList = document.getElementById('files-list');
// eslint-disable-next-line no-undef
const deleteButton = document.getElementById('delete-button');
// eslint-disable-next-line no-undef
const clearButton = document.getElementById('clear-button');

let appFiles = [];

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();

  for (const f of event.dataTransfer.files) {
    // Using the path attribute to get absolute file path
    console.log('File Path of dragged files: ', f.path);
    removeApp(f.path);
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

async function moveFilesToTrash(files) {
  console.log('About to move files to trash', files);

  const spOptions = {
    name: 'App Eraser',
  };

  const posixFile = `POSIX file \\"${files.join('\\", POSIX file \\"')}\\"`;

  exec(`osascript -e "tell application \\"Finder\\" to delete { ${posixFile} } "`, spOptions,
    (error, stdout) => {
      if (error) throw error;
      console.log(`stdout: ${stdout}`);
    });
}

deleteButton.addEventListener('click', (e) => {
  console.log('delete button clicked');
  console.log(appFiles);
  moveFilesToTrash(appFiles);
});

const removeChilds = (parent) => {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};

function clearList() {
  appFiles = [];
  removeChilds(fileList);
  deleteButton.disabled = true;
}

clearButton.addEventListener('click', (e) => {
  console.log('delete button clicked');
  console.log(appFiles);
  clearList(appFiles);
});

async function getBundleIdentifier(appName) {
  const bundleId = await new Promise((resolve, reject) => {
    exec(`osascript -e 'id of app "${appName}"'`, (error, stdout) => {
      if (error) {
        console.error(error);
        reject(error);
      }
      // remove new line
      resolve(stdout.substring(0, stdout.length - 1));
    });
  });

  return bundleId;
}

function appNameFromPath(path) {
  const pathArr = path.split('/');
  const appNameWithExt = pathArr[pathArr.length - 1];
  // remove .app extension
  return appNameWithExt.slice(0, appNameWithExt.length - 4);
}

async function findAppFiles(appName) {
  try {
    const filesToRemove = new Set([]);
    const directoryFilesPromiseArr = pathLocations.map((pathLocation) => fs.readdir(pathLocation));
    const directoryFiles = await Promise.allSettled(directoryFilesPromiseArr);

    const bundleId = await getBundleIdentifier(appName);

    const appNameNorm = appName.toLowerCase().replace(' ', '');
    const bundleIdNorm = bundleId.toLowerCase().replace(' ', '');

    directoryFiles.forEach((dir, index) => {
      if (dir.status === 'fulfilled') {
        dir.value.forEach((dirFile) => {
          const dirFileNorm = dirFile.toLowerCase().replace(' ', '');
          if (
            dirFileNorm.includes(appNameNorm)
            || dirFileNorm.includes(bundleIdNorm)
          ) {
            console.log(`${pathLocations[index]}/${dirFile}`);
            filesToRemove.add(`${pathLocations[index]}/${dirFile}`);
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

async function removeApp(appPath) {
  const appName = appNameFromPath(appPath);
  console.log(`About to remove app '${appName}'`);
  console.log(pathLocations);
  appFiles = await findAppFiles(appName);
  console.log(appFiles);
  appFiles.forEach((filePath) => {
    console.log(filePath);
    const li = document.createElement('li');
    const itemText = document.createTextNode(filePath);

    li.appendChild(itemText);
    fileList.appendChild(li);
  });

  deleteButton.disabled = false;
}
