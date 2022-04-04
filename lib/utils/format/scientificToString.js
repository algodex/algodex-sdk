const Big = require('big.js');

/**
 * Scientific toString
 *
 * Converts a Scientific Notation to a Float String
 * @param {Big} n
 * @return {string} The fixed amount
 */
function scientificToString(n) {
  if (!(n instanceof Big)) {
    throw new TypeError('Must be a Big.js value!');
  }
  let num = Object.create(n);
  if (typeof num.e !== 'undefined' && num.e !== 0) {
    if (num.e > 0) {
      // TODO: large numbers
    } else {
      // Patch Scientific notation to String
      num = num.toFixed(Math.abs(n.e));
    }
  }
  return (num instanceof Big) ? num.toString() : num;
}

module.exports = scientificToString;
