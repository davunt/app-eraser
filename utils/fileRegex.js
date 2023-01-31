const uuidReg = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g;
const dateReg = /[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{6}/g;
const diagReg = /.[a-zA-Z]+_resource.diag/;
const mmpVersionReg = /[0-9]{1,4}.[0-9]{1,3}.[0-9]{1,3}/g; // format of x.x.x where x can be 1-3 digits
const mmVersionReg = /[0-9]{1,4}.[0-9]{1,3}/g; // format of x.x where x can be 1-3 digits

const commonExtensions = [
  '.dmg',
  '.app',
  '.bom',
  '.plist',
  '.XPCHelper',
  '.beta',
  '.extensions',
  '.savedState',
  '.driver',
  '.wakeups_resource',
  '.diag',
];

const commonSubStrings = [
  'install',
  // 'universal',
];

module.exports = {
  fileRegex: [
    uuidReg,
    dateReg,
    diagReg,
    mmpVersionReg,
    mmVersionReg,
    ...commonExtensions,
    ...commonSubStrings,
  ],
  commonExtensions,
  commonSubStrings,
};
