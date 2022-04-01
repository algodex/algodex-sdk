
/**
 * Compiles a Teal Template
 *
 * @param {Object} data
 * @param {String} template
 * @return {string}
 */
function compileTemplate(data, template) {
  if (typeof data === 'undefined' || typeof data !== 'object') {
    throw new TypeError('Data must be an object!');
  }
  if (typeof template !== 'string') {
    throw new TypeError('Template must be a string!');
  }
  // Clone the template
  let res = `${template}`;
  // Apply data keys
  Object.keys(data).forEach((key)=>{
    res = res.split(`<${key}>`).join(data[key]);
  });
  // Return result
  return res;
}

module.exports = compileTemplate;
