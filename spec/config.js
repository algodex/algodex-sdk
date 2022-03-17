const schema = require('./config.json');
const example = {
  'algod': {
    'uri': {
      'protocol': 'https:',
      'host': 'example.com',
      'pathname': '/algod',
      'port': 8080,
    },
    'token': 'abcdefghijkl',
  },
  'indexer': {
    'uri': 'https://example.com/indexer',
    'token': 'abcdefghijkl',
  },
  'dexd': {
    'uri': {
      'protocol': 'https:',
      'host': 'example.com',
      'pathname': '/algod',
      'port': 8080,
    },
    'token': 'abcdefghijkl',
  },
};
module.exports = {example, schema};
