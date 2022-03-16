module.exports = {
  'env': {
    'jest/globals': true,
    'browser': true,
    'commonjs': true,
    'es2021': true,
    'node': true,
  },
  'plugins': ['jest'],
  'extends': ['eslint:recommended', 'google'],
  'parserOptions': {
    'ecmaVersion': 'latest',
  },
  'rules': {
    'max-len': ['error', 100],
    'camelcase': ['warn'],
  //     'max-lines-per-function': ['error', 45],
  //     'max-params':['error', 3],
  //     'indent': [
  //         'warn',
  //         4
  //     ],
  //     // 'linebreak-style': [
  //     //     'error',
  //     //     'unix'
  //     // ],
  //     'quotes': [
  //         'warn',
  //         'single'
  //     ],
  //     'semi': [
  //         'warn',
  //         'always'
  //     ]
  },
};
