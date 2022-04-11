/**
 * @param {*} message
 * @memberOf Errors
 */
function OrderTypeException(message) {
  this.message = message;
  this.name = 'OrderTypeException';
}

OrderTypeException.prototype = TypeError.prototype;

module.exports = OrderTypeException;
