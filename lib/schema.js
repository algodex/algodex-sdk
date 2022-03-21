const Ajv = require('ajv');
const addFormats = require('ajv-formats');

let ajv;

/**
 *
 * @return {Ajv}
 */
function makeAjv() {
  if (!(ajv instanceof Ajv)) {
    ajv = new Ajv(/* {allErrors: true}*/);
    addFormats(ajv);
    // Define Schemas
    // TODO: Host schemas to remove them from the bundle
    const schemas = {
      'URI': require('../spec/URI.js'),
      'Config': require('../spec/Config.js'),
      'APIProperties': require('../spec/APIProperties.js'),
      'Asset.id': require('../spec/Asset.js'),
      'Wallet': require('../spec/Wallet.js'),
    };
    // Add Schemas to AJV
    Object.keys(schemas).forEach((key) => {
      ajv.addSchema(schemas[key], key);
    });
  }
  return ajv;
}
module.exports = makeAjv();
