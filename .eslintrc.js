module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  extends: ['airbnb-base', 'plugin:security/recommended'],
  settings: {
    'import/core-modules': ['electron'],
  },
};
