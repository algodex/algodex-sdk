module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es2021': true,
        'node': true
    },
    'plugins': ['jest'],
    'extends': 'eslint:recommended',
    'parserOptions': {
        'ecmaVersion': 'latest'
    },
    'rules': {
        'indent': [
            'warn',
            4
        ],
        // 'linebreak-style': [
        //     'error',
        //     'unix'
        // ],
        'quotes': [
            'warn',
            'single'
        ],
        'semi': [
            'warn',
            'always'
        ]
    }
};
