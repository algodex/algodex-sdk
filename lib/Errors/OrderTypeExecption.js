/**
 * @param {*} message
 * @memberOf Errors
 */
function OrderTypeException(message) {
  this.message = message;
  this.name = 'OrderTypeException';
}

OrderTypeException.prototype = Error.prototype;

module.exports = OrderTypeException;
