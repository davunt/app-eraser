# App Eraser - macOS App Removal Tool
App Eraser is Free/Libre and Open Source.

## Install
You can download the latest version from the [releases page](https://github.com/davunt/app-eraser/releases).

Supports macOS v11.6+.

## Why?
When deleting apps in macOS, many related files are left behind, taking up space on your hard drive. App Eraser helps to find these files and provides a quick and easy way to delete them.

Similar tools exist, however I believe a open source version is perfect for ensuring constant improvement and user privacy.

I’ve used similar tools in the past and have had issues related to some files remaining after the app has been deleted. I think an open source tool will allow for the community to work together to create a better app removal tool.

Another reason is the inherit privacy benefits that come from open source software. I don’t believe such a simple app should require any analytics or store any data about the usage of the software. I have open sourced the app to allow others to have peace of mind when using it.

## Development
The app is created using [Electron.js](https://www.electronjs.org/), HTML, CSS and JavaScript. If you wish to run from source you can simply clone this repository and follow the information below.

### Requirements
- [nodejs](https://nodejs.org/en/)

### Scripts
NPM Scripts:

- `npm start` - run the electron app
- `npm run lint` - run eslint across all .js files
- `npm run dist` - packages application as a .dmg

### Project Structure
`main.js` - the entry file for the application

`assets` - all styling configuration (CSS) and images used in the application

`src` - all application views and logic 

`utils` - functions or constants used across the application

### ESLint
ESLint is used to analyze code to find issues and to enforce coding style. The ESLint config can be found in `.eslintrc.js`.