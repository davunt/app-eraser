const fs = require('fs/promises');
const { execSync } = require('child_process');

const { scoreThreshold } = require('../../utils/config');
const { fileRegex } = require('../../utils/fileRegex');
const { pathLocations } = require('../../utils/pathLocations');

let compNameGlob = '';

const normalizeString = (str, spacer = '') => str.toLowerCase().replace(/ /g, spacer);

// replace spaces and space like chars with special char
function replaceSpaceCharacters(str) {
  return str.toLowerCase()
    .replaceAll(' ', '*')
    .replaceAll('-', '*')
    .replaceAll('_', '*')
    .replaceAll('.', '*');
}

async function getFilePatternArray(appName, bundleId) {
  const appNameNorm = normalizeString(appName);
  const bundleIdNorm = normalizeString(bundleId);

  const nameVariations = [
    replaceSpaceCharacters(appName),
    replaceSpaceCharacters(bundleId), // com.test.app would be com*test*app
  ];

  const patternArray = [...nameVariations];

  const appNameComponents = appNameNorm.split('.');
  if (appNameComponents) patternArray.push(appNameComponents[0]); // test.com

  const bundleIdComponents = bundleIdNorm.split('.');
  if (bundleIdComponents.length > 2) {
    patternArray.push(replaceSpaceCharacters(`${bundleIdComponents.slice(0, bundleIdComponents.length - 1).join('.')}`)); // instead of com.bear.app its just com.bear
  }

  return [...new Set(patternArray)]; // remove potential duplicates
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

function doesFileContainAppPattern(patterns, fileNameToCheck) {
  return patterns.find((appFilePatten) => {
    const strippedFileName = removeCommonFileSubstrings(fileNameToCheck);
    let score = 0;

    if (strippedFileName.includes(appFilePatten)) {
      const indexOfString = strippedFileName.indexOf(appFilePatten);
      for (let i = 0; i < strippedFileName.length; i += 1) {
        if (i === indexOfString) {
          i += indexOfString + appFilePatten.length;
          score += appFilePatten.length;
        }
      }
    }

    return score / strippedFileName.length > scoreThreshold;
  }) !== undefined;
}

async function findAppFiles(appName, bundleId) {
  try {
    compNameGlob = await getComputerName();
    const bundleIdComponents = bundleId.split('.');
    const appOrg = bundleIdComponents[1];

    const companyDirs = pathLocations.map((pathLocation) => `${pathLocation}/${appOrg}`);
    const pathsToSearch = [...pathLocations, ...companyDirs];
    const directoryFilesPromiseArr = pathsToSearch.map((pathLocation) => fs.readdir(pathLocation));
    const directoryFiles = await Promise.allSettled(directoryFilesPromiseArr);

    const filePatternArray = await getFilePatternArray(appName, bundleId);

    const filesToRemove = new Set([]);

    directoryFiles.forEach((dir, index) => {
      if (dir.status === 'fulfilled') {
        dir.value.forEach((dirFile) => {
          const dirFileNorm = normalizeString(dirFile);
          if (
            doesFileContainAppPattern(filePatternArray, dirFileNorm)
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

module.exports = {
  replaceSpaceCharacters,
  findAppFiles,
  getFilePatternArray,
  doesFileContainAppPattern,
  removeCommonFileSubstrings,
};
