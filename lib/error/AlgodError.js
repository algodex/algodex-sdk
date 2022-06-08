/**
 * # 🛑 AlgodError Error
 *
 * @memberOf Errors
 * @param {string} message Message
 */
function AlgodError(message) {
  this.message = message;
  this.name = 'AlgodError';
}

AlgodError.prototype = Object.create(TypeError.prototype);
module.exports = AlgodError;
