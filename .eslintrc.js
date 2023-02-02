module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  plugins: ['sonarjs'],
  extends: ['airbnb-base', 'plugin:sonarjs/recommended'],
  settings: {
    'import/core-modules': ['electron'],
  },
};
