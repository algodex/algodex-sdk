# algodex-sdk
Client-side JavaScript API calls for Algodex as an npm package

# Installation

`npm ci`

# Testing

## Automated smart contract tests

`npm test`

With Chrome debugger support:

`npm run testDebug`

## Enabling smart contract debugging

export DEBUG_SMART_CONTRACT_SOURCE=1

## Manual testing

1. Download and set up https://github.com/algodex/algodex-experimental
2. Run the following in the algodex-sdk directory:

`npm link`

3. Run the following in the algodex-experimental directory:

`rm -rf 'node_modules/@algodex'`
`npm link @algodex/algodex-sdk`

# Architecture Documentation

https://github.com/algodex/algodex-architecture
