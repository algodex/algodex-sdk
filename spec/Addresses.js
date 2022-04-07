/**
 * ## 💰 Addresses Schema
 *
 * JSON Schema of the Wallet. Used for validation in
 * {@link AlgodexApi#setAddresses}
 * ```json
 * {
 * '$schema': 'http://json-schema.org/draft-07/schema',
 *   '$id': 'https://schemas.algodex.com/v1/Addresses.json',
 *   'type': 'array',
 *   'items': {
 *     '$ref': 'https://schemas.algodex.com/v1/Wallet.json',
 *   },
 * }
 * ```
 * @name Wallet
 * @type {Schema}
 * @memberOf Schema
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Addresses.json',
  'type': 'array',
  'items': {
    '$ref': 'https://schemas.algodex.com/v1/Wallet.json',
  },
};
