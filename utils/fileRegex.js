const uuidReg = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g;
const dateReg = /[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{6}/g;
const diagReg = /.[a-zA-Z]+_resource.diag/;
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
];

module.exports = {
  fileRegex: [
    uuidReg,
    dateReg,
    diagReg,
    ...commonExtensions,
  ],
};
