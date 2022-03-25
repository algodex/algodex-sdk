module.exports = {
  'ignorePatterns': ['**/docs/**/*.js'],
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
    'no-implicit-globals': ['error', {'lexicalBindings': true}],
    'no-shadow': 'error',
    'new-cap': 'warn',
    'linebreak-style': 'off',
    'max-len': ['warn', 80],
    'camelcase': ['warn'],
    // TODO go back to error for the following:
    // 'no-unused-vars': ['error'],
    // 'no-undef': ['error'],
    // 'valid-jsdoc': ['warn'],
    // 'no-useless-catch': ['error'],
    // 'require-jsdoc': ['warn'],
    // 'no-constant-condition': ['warn'],
    // 'no-throw-literal': ['error'],
  },
};
