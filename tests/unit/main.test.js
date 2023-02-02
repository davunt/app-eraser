const { isArrayUniqueValues } = require('../../utils/funcs');
const { commonExtensions, commonSubStrings } = require('../../utils/fileRegex');
const {
  getFilePatternArray, replaceSpaceCharacters,
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

describe('getFilePatternArray - Get file patterns from app name and bundleId', () => {
  it('returns an array of strings', async () => {
    const patterns = await getFilePatternArray(appName, bundleId);
    expect(patterns).toEqual(expect.arrayContaining([expect.any(String)]));
  });

  it('correctly converts all patterns to lower case', async () => {
    const patterns = await getFilePatternArray(appName, bundleId);
    patterns.forEach((pattern) => expect(pattern).toBe(pattern.toLowerCase()));
  });

  it('correctly replaces spaces with . and _ and - with *', async () => {
    const patterns = await getFilePatternArray(appNameWithSpaces, bundleId);
    patterns.forEach((pattern) => {
      expect(pattern).toEqual(expect.not.stringContaining(' '));
    });
    expect(patterns).toEqual(expect.arrayContaining(['app*name', bundleIdWithStar, 'appname', 'com*test']));
  });

  it('returns converted bundleId (lower case and replaced . with *)', async () => {
    const patterns = await getFilePatternArray(appName, bundleId);
    expect(patterns).toEqual(expect.arrayContaining([bundleIdWithStar]));
  });

  it('creates new pattern if app name contains .', async () => {
    const patterns = await getFilePatternArray(appNameWithDot, bundleId);
    expect(patterns).toEqual(expect.arrayContaining(['app']));
  });

  it('removes spaces from bundleId', async () => {
    const patterns = await getFilePatternArray(appName, bundleId);
    expect(patterns).toEqual(expect.arrayContaining([bundleIdWithStar]));
  });

  it('does not return duplicates', async () => {
    const patterns = await getFilePatternArray(appName, bundleId);
    expect(isArrayUniqueValues(patterns)).toBeTruthy();
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
    const result = doesFileContainAppPattern(patternArray, 'app');
    expect(result).toBe(true);

    const bundleResult = doesFileContainAppPattern(patternArray, 'com*app*desktop');
    expect(bundleResult).toBe(true);
  });

  it('app name with version returns true', () => {
    const result1 = doesFileContainAppPattern(patternArray, `app-${exampleVersion1}`);
    expect(result1).toBe(true);

    const result2 = doesFileContainAppPattern(patternArray, `app-${exampleVersion2}`);
    expect(result2).toBe(true);

    const bundleResult1 = doesFileContainAppPattern(patternArray, `com*app*desktop-${exampleVersion1}`);
    expect(bundleResult1).toBe(true);

    const bundleResult2 = doesFileContainAppPattern(patternArray, `com*app*desktop-${exampleVersion2}`);
    expect(bundleResult2).toBe(true);
  });

  it('app name with UUID returns true', () => {
    const result = doesFileContainAppPattern(patternArray, `app-${exampleUUID}`);
    expect(result).toBe(true);

    const bundleResult = doesFileContainAppPattern(patternArray, `com*app*desktop-${exampleUUID}`);
    expect(bundleResult).toBe(true);
  });

  it('app name with date returns true', () => {
    const result = doesFileContainAppPattern(patternArray, `app-${exampleDate}`);
    expect(result).toBe(true);

    const bundleResult = doesFileContainAppPattern(patternArray, `com*app*desktop-${exampleDate}`);
    expect(bundleResult).toBe(true);
  });

  it('different app name returns false', () => {
    const result = doesFileContainAppPattern(patternArray, 'nottheapp');
    expect(result).toBe(false);
  });

  it('different bundle id returns false', () => {
    const result1 = doesFileContainAppPattern(patternArray, 'com*nottheapp*desktop');
    expect(result1).toBe(false);

    const result2 = doesFileContainAppPattern(patternArray, 'co*app*desktop');
    expect(result2).toBe(false);

    const result3 = doesFileContainAppPattern(patternArray, 'com*app*mobile');
    expect(result3).toBe(false);
  });
});
