const homedir = require('os').homedir();

const pathLocations = [
  '/Applications',
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
  `${homedir}/Library/Preferences`,
  `${homedir}/Library/Preferences/ByHost`,
  `${homedir}/Library/Saved Application State`,
  `${homedir}/Library/WebKit`,
  '/private/var/db/receipts',
];

module.exports = {
  pathLocations,
};
