/**
 * URI for a resource
 * @typedef {string} URI
 */


/**
 * JSON Schema Specification
 * @type {import('ajv').Schema}
 * @name URISchema
 * @memberOf spec
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/URI.json',
  'type': 'string',
  'format': 'uri',
};
