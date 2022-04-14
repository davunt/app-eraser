const homedir = require('os').homedir();

const pathLocations = [
  '/Applications',
  '/private/var/db/receipts',
  '/Library/LaunchDaemons',
  `${homedir}/Downloads`,
  `${homedir}/Library`,
  `${homedir}/Library/Application Support`,
  `${homedir}/Library/Application Scripts`,
  `${homedir}/Library/Application Support/CrashReporter`,
  `${homedir}/Library/Containers`,
  `${homedir}/Library/Caches`,
  `${homedir}/Library/HTTPStorages`,
  `${homedir}/Library/Group Containers`,
  `${homedir}/Library/Internet Plug-Ins`,
  `${homedir}/Library/LaunchAgents`,
  `${homedir}/Library/Logs`,
  '/Library/Logs/DiagnosticReports',
  `${homedir}/Library/Preferences`,
  `${homedir}/Library/Preferences/ByHost`,
  `${homedir}/Library/Saved Application State`,
  `${homedir}/Library/WebKit`,
  `${homedir}/Library/Caches/com.apple.helpd/Generated`,
  '/Library/Audio/Plug-Ins/HAL',
];

const commonSuffix = [
  '.dmg',
  '.app',
  '.bom',
  '.plist',
  '.XPCHelper',
  '.beta',
  '.extensions',
  '.savedState',
  '.driver',
  'install',
];

module.exports = {
  pathLocations,
  commonSuffix,
};
