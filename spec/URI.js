/**
 * URI for a resource
 * @typedef {string} URI
 * @memberOf URI
 */


/**
 * ## 🕸 URI Schema
 *
 * JSON Schema of a URI
 *
 * ```json
 * {
 *   '$schema': 'http://json-schema.org/draft-07/schema',
 *   '$id': 'https://schemas.algodex.com/v1/URI.json',
 *   'type': 'string',
 *   'format': 'uri',
 * }
 * ```
 * @type {Schema}
 * @name URI
 * @memberOf Schema
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/URI.json',
  'type': 'string',
  'format': 'uri',
};
