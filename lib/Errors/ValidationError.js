/**
 * Map an Error to a String
 *
 * @param {Object} error Ajv Error
 * @param {number} idx Index
 * @return {string}
 */
function mapToString(error, idx) {
  return `Error ${idx}: Path '${error.instancePath}' ${error.message}`;
}
/**
 * # 🛑 Validation Error
 *
 * Standard error for invalid types
 * @memberOf Errors
 * @param {Array} errors List of errors
 */
function ValidationError(errors) {
  const err = new TypeError(
      'Validation Failed!\n' +
    errors.map(mapToString).join('\n'),
  );
  Object.keys(err).forEach((key)=>{
    this[key] = err[key];
  });
}

ValidationError.prototype = Object.create(TypeError.prototype);
module.exports = ValidationError;
