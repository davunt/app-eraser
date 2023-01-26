const fs = require('fs/promises');
const { execSync } = require('child_process');

const { fileRegex } = require('../../utils/fileRegex');
const { pathLocations, commonSuffix } = require('../../utils/pathLocations');

let compNameGlob;

const scoreThreshold = 0.4; // TODO set in config file

const normalizeString = (str, spacer = '') => str.toLowerCase().replace(/ /g, spacer);

function createNameVariations(appName, bundleId) {
  const appNameNorm = appName.toLowerCase().replaceAll(' ', '');
  const appNameWithoutDot = appNameNorm.toLowerCase().replaceAll('.', '');
  const appNameUnderscore = appName.toLowerCase().replaceAll(' ', '_');
  const appNameDash = appName.toLowerCase().replaceAll(' ', '-');
  const appNameDot = appName.toLowerCase().replaceAll(' ', '.');

  const bundleIdNorm = bundleId.toLowerCase().replaceAll(' ', '');

  return [
    appNameNorm,
    appNameWithoutDot,
    appNameUnderscore,
    appNameDash,
    appNameDot,
    bundleIdNorm,
  ];
}

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

  patternArray = [...patternArray, ...appWithSuffix];

  return [...new Set(patternArray)]; // remove potential duplicates
}

async function getComputerName() {
  const compName = await execSync('scutil --get ComputerName').toString();
  console.log('compName', compName);
  // remove empty space at end of string
  return compName.substring(0, compName.length - 1);
}

function stripString(file) { // remove common file substrings (like uuid and comp name)
  let transformedString = file;
  fileRegex.forEach((regex1) => {
    transformedString = transformedString.replace(regex1, '');
  });

  const normCompName = normalizeString(compNameGlob, '-')
    .replace(/\u2019/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '');

  transformedString = transformedString.replace(normCompName, ''); // remove computer name from file name
  return transformedString;
}

function doesFileContainAppPattern(patterns, fileToCheck) {
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
        if (strippedFile[parseInt(i, 10)] === '.') score += 0.5; // TODO just remove . and _ ?
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

async function findAppFiles(appName, bundleId) {
  try {
    compNameGlob = await getComputerName();
    const bundleIdComponents = bundleId.split('.');

    const companyDirs = pathLocations.map((pathLocation) => `${pathLocation}/${bundleIdComponents[1]}`);
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
  findAppFiles,
  getFilePatternArray,
  stripString,
};
