module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Transaction.json',
  'description': 'A bas transaction',
  'type': 'object',
  'properties': {
    'account': {
      'type': 'string',
    },
    'size': {
      'type': 'integer',
      'minimum': 0.28,
    },
    'price': {
      'type': 'integer',
      'minimum': 0,
    },
    'asset': {
      'type': 'object',
      'properties': {
        'id': {
          'type': 'integer',
        },
      },
      'required': [
        'id',
      ],
    },
    'appId': {
      'type': 'integer',
    },
    'optIn': {
      'type': 'boolean',
    },
  },
  'required': [
    'account', 'asset', 'appId',
  ],
}
;
