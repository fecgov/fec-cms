/**
 * Multiple small functions meant to be used in various places
 */

/**
 * Used to translate 'H', 'S', and 'P' into their full office names
 */
const officeNames = {
  H: 'House',
  S: 'Senate',
  P: 'President'
};

/**
 * Converts input to a string, changes non-word characters to dashes and trims leading, double, and trailing dashes
 * @param {*} val - Typically a string that should be translated to slug format
 * @param {boolean} retainCase - Whether to force to lowercase
 * @returns {string} lowercase, separated by dashes
 */
function slugify(val, retainCase = false) {
  let toReturn = val.toString();

  if (retainCase === false) toReturn = toReturn.toLowerCase();

  toReturn = toReturn
    .replace(/\s+/g, '-') // change spaces to dashes
    .replace(/[^\w\-]+/g, '') // drop any non-word characters (except _ and -)
    .replace(/\-\-+/g, '-') // change -- to -
    .replace(/^-+/, '') // remove dashes from the beginning
    .replace(/-+$/, ''); // remove dashes from the end

  return toReturn;
}

/**
 * Removes double quotes from a given value
 * @param {string} value - A string whose doublequote characters should be removed
 * @returns {string} A string with any " characters removed
 */
 function stripDoubleQuotes(value) {
  return value.replace(/["]+/g, '');
}

module.exports = {
  officeNames,
  slugify,
  stripDoubleQuotes
};
