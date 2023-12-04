const fs = require('fs/promises');
const { execSync } = require('child_process');

const { scoreThreshold } = require('../../utils/config');
const { fileRegex } = require('../../utils/fileRegex');
const { pathLocations } = require('../../utils/pathLocations');

let compNameGlob = '';

// convert string to lowercase and removes spaces
const normalizeString = (str, spacer = '') => str.toLowerCase().replace(/ /g, spacer);

// replace spaces and space like chars with special char
function replaceSpaceCharacters(str) {
  return str.toLowerCase()
    .replaceAll(' ', '*')
    .replaceAll('-', '*')
    .replaceAll('_', '*')
    .replaceAll('.', '*');
}

// return array of app name variations using the app name and bundleId
async function getAppNameVariations(appName, bundleId) {
  const patternArray = [replaceSpaceCharacters(appName)];

  // if app name contains a '.' (e.g test.com), add first component to array (e.g test)
  const appNameComponents = normalizeString(appName).split('.');
  if (appNameComponents) patternArray.push(appNameComponents[0]);

  // if bundleId contains more than 2 components (e.g com.test.app)
  // add first two components to list (com.test)
  const bundleIdComponents = normalizeString(bundleId).split('.');
  if (bundleIdComponents.length > 2) {
    patternArray.push(replaceSpaceCharacters(`${bundleIdComponents.slice(0, bundleIdComponents.length - 1).join('.')}`));
  }

  return [...new Set(patternArray)];
}

async function getComputerName() {
  const compName = await execSync('scutil --get ComputerName').toString();
  // remove empty space at end of string
  return compName.substring(0, compName.length - 1);
}

// remove common substring from files, such as uuid, computer name and spaces
function removeCommonFileSubstrings(file) {
  let transformedString = file;

  fileRegex.forEach((regex1) => {
    transformedString = transformedString.replace(regex1, '');
  });

  const normCompName = normalizeString(compNameGlob, '-')
    .replace(/\u2019/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '');

  transformedString = transformedString.replace(normCompName, ''); // remove computer name from file name

  transformedString = replaceSpaceCharacters(transformedString);
  return transformedString;
}

function doesFileContainAppPattern(appNameVariations, bundleId, fileNameToCheck) {
  // return boolean for if file is related to selected app
  const strippedFileName = removeCommonFileSubstrings(fileNameToCheck);

  // if file contains bundleID then file is related to app
  if (strippedFileName.includes(replaceSpaceCharacters(bundleId))) return true;

  // check if file contains variations of app name
  return appNameVariations.find((appNameFilePatten) => {
    let score = 0;
    if (strippedFileName.includes(appNameFilePatten)) {
      const indexOfString = strippedFileName.indexOf(appNameFilePatten);
      for (let i = 0; i < strippedFileName.length; i += 1) {
        if (i === indexOfString) {
          i += indexOfString + appNameFilePatten.length;
          score += appNameFilePatten.length;
        }
      }
    }

    return score / strippedFileName.length > scoreThreshold;
  }) !== undefined;
}

async function findAppFilesToRemove(appName, bundleId) {
  try {
    compNameGlob = await getComputerName();

    const bundleIdComponents = bundleId.split('.');
    const appOrg = bundleIdComponents[1];

    const companyDirs = pathLocations.map((pathLocation) => `${pathLocation}/${appOrg}`);
    const pathsToSearch = [...pathLocations, ...companyDirs];
    const directoryFilesPromiseArr = pathsToSearch.map((pathLocation) => fs.readdir(pathLocation));
    // files to check
    const directoryFiles = await Promise.allSettled(directoryFilesPromiseArr);

    const appNameVariations = await getAppNameVariations(appName, bundleId);

    const filesToRemove = new Set([]);
    directoryFiles.forEach((dir, index) => {
      if (dir.status === 'fulfilled') {
        dir.value.forEach((dirFile) => {
          const dirFileNorm = normalizeString(dirFile);
          if (
            doesFileContainAppPattern(appNameVariations, bundleId, dirFileNorm)
          ) {
            filesToRemove.add(`${pathsToSearch[parseInt(index, 10)]}/${dirFile}`);
          }
        });
      }
    });

    return [...filesToRemove];
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = {
  replaceSpaceCharacters,
  findAppFilesToRemove,
  getAppNameVariations,
  doesFileContainAppPattern,
  removeCommonFileSubstrings,
};
