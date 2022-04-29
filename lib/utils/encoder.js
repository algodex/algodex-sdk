let encoder;

/**
 * Create a TextEncoder
 * @return {TextEncoder}
 */
function makeEncoder() {
  if (typeof encoder === 'undefined') {
    encoder = new TextEncoder();
  }
  return encoder;
}

module.exports = makeEncoder();
