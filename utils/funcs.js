const isArrayUniqueValues = (arr) => Array.isArray(arr) && new Set(arr).size === arr.length;

module.exports = {
  isArrayUniqueValues,
};
