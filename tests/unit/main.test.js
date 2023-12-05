const { isArrayUniqueValues } = require('../../utils/funcs');
const { commonExtensions, commonSubStrings } = require('../../utils/fileRegex');
const {
  getAppNameVariations, replaceSpaceCharacters,
  removeCommonFileSubstrings, doesFileContainAppPattern,
} = require('../../src/main/index');

const appName = 'appName';
const appNameWithSpaces = 'app Name';
const appNameWithDash = 'app-Name';
const appNameWithUnderscore = 'app_Name';
const appNameWithDot = 'app.Name';

const bundleId = 'com.test.app';
const bundleIdWithSpaces = 'com test app';
const bundleIdWithDash = 'com-test-app';
const bundleIdWithUnderscore = 'com_test_app';
const bundleIdCombo = 'com-test_app';

const replaceSpaceCharactersAppExpectedOutput = 'app*name';
const bundleIdWithStar = 'com*test*app';

const patternArray = [
  'app',
  'com*app*desktop',
  'com*app',
];

const exampleUUID = 'a7293542-411f-400f-ac18-fb93c61bb5b6';
const exampleDate = '2022-13-040123456';
const exampleVersion1 = '1.2.3';
const exampleVersion2 = '2022.2';

describe('replaceSpaceCharacters - Replaces space chars with *', () => {
  it('Replaces spaces with *', () => {
    const result1 = replaceSpaceCharacters(appNameWithSpaces);
    expect(result1).toEqual(replaceSpaceCharactersAppExpectedOutput);

    const result2 = replaceSpaceCharacters(bundleIdWithSpaces);
    expect(result2).toEqual(bundleIdWithStar);
  });

  it('Replaces . with *', () => {
    const result1 = replaceSpaceCharacters(appNameWithDot);
    expect(result1).toEqual(replaceSpaceCharactersAppExpectedOutput);

    const result2 = replaceSpaceCharacters(bundleId);
    expect(result2).toEqual(bundleIdWithStar);
  });

  it('Replaces _ with *', () => {
    const result1 = replaceSpaceCharacters(appNameWithUnderscore);
    expect(result1).toEqual(replaceSpaceCharactersAppExpectedOutput);

    const result2 = replaceSpaceCharacters(bundleIdWithUnderscore);
    expect(result2).toEqual(bundleIdWithStar);
  });

  it('Replaces - with *', () => {
    const result1 = replaceSpaceCharacters(appNameWithDash);
    expect(result1).toEqual(replaceSpaceCharactersAppExpectedOutput);

    const result2 = replaceSpaceCharacters(bundleIdWithDash);
    expect(result2).toEqual(bundleIdWithStar);
  });

  it('Replaces a combination of space chars with *', () => {
    const result = replaceSpaceCharacters(bundleIdCombo);
    expect(result).toEqual(bundleIdWithStar);
  });
});

describe('getAppNameVariations - Get file patterns from app name and bundleId', () => {
  it('returns an array of strings', async () => {
    const appNameVariations = await getAppNameVariations(appName, bundleId);
    expect(appNameVariations).toEqual(expect.arrayContaining([expect.any(String)]));
  });

  it('correctly converts all patterns to lower case', async () => {
    const patterns = await getAppNameVariations(appName, bundleId);
    patterns.forEach((pattern) => expect(pattern).toBe(pattern.toLowerCase()));
  });

  it('correctly replaces spaces with . and _ and - with *', async () => {
    const appNameVariations = await getAppNameVariations(appNameWithSpaces, bundleId);
    appNameVariations.forEach((pattern) => {
      expect(pattern).toEqual(expect.not.stringContaining(' '));
    });
    expect(appNameVariations).toEqual(expect.arrayContaining(['app*name', 'appname', 'com*test']));
  });

  it('creates new pattern if app name contains .', async () => {
    const appNameVariations = await getAppNameVariations(appNameWithDot, bundleId);
    expect(appNameVariations).toEqual(expect.arrayContaining(['app']));
  });

  it('does not return duplicates', async () => {
    const appNameVariations = await getAppNameVariations(appName, bundleId);
    expect(isArrayUniqueValues(appNameVariations)).toBeTruthy();
  });
});

describe('removeCommonFileSubstrings - removes common app file strings from string', () => {
  it('removes uuid from file name', () => {
    const result = removeCommonFileSubstrings(`${appName}${exampleUUID}`);
    expect(result).toEqual(expect.not.stringContaining(exampleUUID));
    expect(result).toEqual('appname');
  });

  it('removes date from file name', () => {
    const result = removeCommonFileSubstrings(`${appName}${exampleDate}`);
    expect(result).toEqual(expect.not.stringContaining(exampleDate));
    expect(result).toEqual('appname');
  });

  it('removes version number from file name', () => {
    const result1 = removeCommonFileSubstrings(`${appName}${exampleVersion1}`);
    expect(result1).toEqual(expect.not.stringContaining(exampleVersion1));
    expect(result1).toEqual('appname');

    const result2 = removeCommonFileSubstrings(`${appName}${exampleVersion2}`);
    expect(result2).toEqual(expect.not.stringContaining(exampleVersion2));
    expect(result2).toEqual('appname');
  });

  it('removes common extensions', () => {
    commonExtensions.forEach((extension) => {
      expect(extension).toEqual(expect.any(String));
      let name = 'appName';
      name = `${name}${extension}`;
      expect(name).toEqual(expect.stringContaining(extension));
      const result = removeCommonFileSubstrings(name);
      expect(result).toEqual(expect.not.stringContaining(extension));
      expect(result).toEqual('appname');
    });
  });

  it('removes common extendions', () => {
    commonSubStrings.forEach((subString) => {
      expect(subString).toEqual(expect.any(String));
      let name = 'appName';
      name = `${name}${subString}`;
      expect(name).toEqual(expect.stringContaining(subString));
      const result = removeCommonFileSubstrings(name);
      expect(result).toEqual(expect.not.stringContaining(subString));
      expect(result).toEqual('appname');
    });
  });
});

describe('doesFileContainAppPattern - checks if a string contains a string pattern', () => {
  it('app name returns true', () => {
    const result = doesFileContainAppPattern(patternArray, bundleId, 'app');
    expect(result).toBe(true);

    const bundleResult = doesFileContainAppPattern(patternArray, bundleId, 'com*app*desktop');
    expect(bundleResult).toBe(true);
  });

  it('app name with version returns true', () => {
    const result1 = doesFileContainAppPattern(patternArray, bundleId, `app-${exampleVersion1}`);
    expect(result1).toBe(true);

    const result2 = doesFileContainAppPattern(patternArray, bundleId, `app-${exampleVersion2}`);
    expect(result2).toBe(true);

    const bundleResult1 = doesFileContainAppPattern(patternArray, bundleId, `com*app*desktop-${exampleVersion1}`);
    expect(bundleResult1).toBe(true);

    const bundleResult2 = doesFileContainAppPattern(patternArray, bundleId, `com*app*desktop-${exampleVersion2}`);
    expect(bundleResult2).toBe(true);
  });

  it('app name with UUID returns true', () => {
    const result = doesFileContainAppPattern(patternArray, bundleId, `app-${exampleUUID}`);
    expect(result).toBe(true);

    const bundleResult = doesFileContainAppPattern(patternArray, bundleId, `com*app*desktop-${exampleUUID}`);
    expect(bundleResult).toBe(true);
  });

  it('app name with date returns true', () => {
    const result = doesFileContainAppPattern(patternArray, bundleId, `app-${exampleDate}`);
    expect(result).toBe(true);

    const bundleResult = doesFileContainAppPattern(patternArray, bundleId, `com*app*desktop-${exampleDate}`);
    expect(bundleResult).toBe(true);
  });

  it('different app name returns false', () => {
    const result = doesFileContainAppPattern(patternArray, bundleId, 'nottheapp');
    expect(result).toBe(false);
  });

  it('different bundle id returns false', () => {
    const result1 = doesFileContainAppPattern(patternArray, bundleId, 'com*nottheapp*desktop');
    expect(result1).toBe(false);

    const result2 = doesFileContainAppPattern(patternArray, bundleId, 'co*app*desktop');
    expect(result2).toBe(false);
  });

  it('contains bundleId in long string returns true', () => {
    const result1 = doesFileContainAppPattern(patternArray, bundleId, bundleIdWithStar.padStart(20, 'x'));
    expect(result1).toBe(true);

    const result2 = doesFileContainAppPattern(patternArray, bundleId, bundleIdWithStar.padEnd(20, 'x'));
    expect(result2).toBe(true);

    const result3 = doesFileContainAppPattern(patternArray, bundleId, bundleIdWithStar.padStart(20, 'x').padEnd(20, 'x'));
    expect(result3).toBe(true);
  });
});
