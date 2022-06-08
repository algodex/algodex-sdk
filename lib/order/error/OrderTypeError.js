/**
 * @param {*} message
 * @memberOf Errors
 */
function OrderTypeError(message) {
  this.message = message;
  this.name = 'OrderTypeError';
}

OrderTypeError.prototype = TypeError.prototype;

module.exports = OrderTypeError;
