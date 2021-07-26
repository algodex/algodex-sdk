# algodex-sdk
Client-side JavaScript API calls for Algodex as an npm package

# Installation

`npm ci`

# Testing

## Automated smart contract tests

`npm run jest`

With Chrome debugger support:

`npm run jestDebug`

## Manual testing

1. Download and set up https://github.com/algodex/algodex-experimental
2. Run the following in the algodex-sdk directory:

`npm link`

3. Run the following in the algodex-experimental directory:

`rm -rf 'node_modules/@algodex'`
`npm link @algodex/algodex-sdk`
