module.exports = {
  'ignorePatterns': ['**/docs/**/*.js', 'base.js'],
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
    'linebreak-style': 'off',
    'max-params': ['warn', 3],
    'max-statements': ['warn', 30],
    'complexity': ['warn', 6],
    // TODO go back to error for the following:
    'max-len': ['warn', 80],
    'camelcase': ['warn'],
    'no-unused-vars': ['warn'],
    'no-undef': ['warn'],
    'valid-jsdoc': ['warn'],
    'no-useless-catch': ['warn'],
    'require-jsdoc': ['warn'],
    'no-constant-condition': ['warn'],
    'no-throw-literal': ['warn'],
  },
};
