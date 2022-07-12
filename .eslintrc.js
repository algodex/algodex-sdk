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
    'no-implicit-globals': ['warn', {'lexicalBindings': true}],
    'no-shadow': 'warn',
    'new-cap': 'warn',
    'linebreak-style': 'off',
    'max-len': ['warn', 120],
    'camelcase': ['warn'],
    'arrow-parens': ['error', 'as-needed'],
  },
};
