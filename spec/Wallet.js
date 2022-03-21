/**
 * An asset in a wallet
 * @typedef {Object} WalletAsset
 * @property {string} name Name of Asset
 * @property {number} balance Balance in wallet
 * @memberOf spec
 */

/**
 * A List keyed by asset ID that contains the wallets assets
 * @typedef {Object.<string, WalletAsset>} WalletAssets
 * @memberOf spec
 */

/**
 * A wallet instance
 *
 * @typedef {Object} Wallet
 * @property {string} type Type of Wallet
 * @property {string} address Wallet Address
 * @property {string} [name] Optionally name the wallet
 * @property {WalletAssets} [assets] Assets owned by the Wallet
 * @memberOf spec
 */


/**
 * JSON Schema Specification
 * @type {import('ajv').Schema}
 * @name WalletSchema
 * @memberOf spec
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Wallet.json',
  'type': 'object',
  'properties': {
    'type': {
      'type': 'string',
      'enum': ['my-algo-wallet', 'wallet-connect'],
    },
    'address': {
      'type': 'string',
      'pattern': '[A-Z0-9]{58}',
      'description': 'An account public key',
    },
    'name': {
      'type': 'string',
    },
    'assets': {
      'type': 'object',
      'additionalProperties': {
        'type': 'object',
        'properties': {
          'balance': {
            'type': 'number',
            'minimum': 0,
          },
          'name': {
            'type': 'string',
          },
        },
        'required': ['balance'],
      },
    },
  },
};
