module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: ['airbnb-base', 'plugin:security/recommended'],
  settings: {
    'import/core-modules': ['electron'],
  },
};
