const { isArrayUniqueValues } = require('../../utils/funcs');
const { getFilePatternArray } = require('../../src/main/index');

describe('Get file patterns from app name and bundleId', () => {
  it('returns an array of strings', async () => {
    const patterns = await getFilePatternArray('testAppName', 'com.company.testAppName');
    expect(patterns).toEqual(expect.arrayContaining([expect.any(String)]));
  });

  it('correctly converts all patterns to lower case', async () => {
    const patterns = await getFilePatternArray('testAppName', 'com.company.testAppName');
    patterns.forEach((pattern) => expect(pattern).toBe(pattern.toLowerCase()));
  });

  it('correctly replaces spaces with . and _ and -', async () => {
    const patterns = await getFilePatternArray('test App Name', 'com.company.testAppName');
    patterns.forEach((pattern) => {
      expect(pattern).toEqual(expect.not.stringContaining(' '));
    });
    expect(patterns).toEqual(expect.arrayContaining(['test.app.name', 'test_app_name', 'test-app-name']));
  });

  it('returns normalised bundleId', async () => {
    const patterns = await getFilePatternArray('test App Name', 'com.company.testAppName');
    expect(patterns).toEqual(expect.arrayContaining(['com.company.testappname']));
  });

  // it('removes . from app name', () => {
  //   getFilePatternArray('TestAppName', 'com.example.test').then((patterns) => {
  //     console.log(patterns);
  //   });
  // });

  it('removes spaces from bundleId', async () => {
    const patterns = await getFilePatternArray('test App Name', 'com.company.test App Name');
    expect(patterns).toEqual(expect.arrayContaining(['com.company.testappname']));
  });

  it('includes common suffixes', async () => {
    const patternsWithSpaces = await getFilePatternArray('test App Name', 'com.company.test App Name');
    expect(patternsWithSpaces).toEqual(expect.arrayContaining(['testappnameinstall', 'test_app_nameinstall', 'test-app-nameinstall', 'test.app.nameinstall', 'com.company.testappnameinstall']));

    const patternsWithoutSpaces = await getFilePatternArray('testAppName', 'com.company.testAppName');
    expect(patternsWithoutSpaces).toEqual(expect.arrayContaining(['testappnameinstall', 'com.company.testappnameinstall']));
  });

  it('does not return duplicates', async () => {
    const patterns = await getFilePatternArray('test App Name', 'com.company.testAppName');
    expect(isArrayUniqueValues(patterns)).toBeTruthy();
  });
});

// 2. Test paths to search

// 3. Test stripString

// 4. isPatternInFile - pass patterns and a files to check
