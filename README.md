# algodex-sdk

[![Maintainability](https://api.codeclimate.com/v1/badges/ec6d58e1e3562cd4be26/maintainability)](https://codeclimate.com/repos/62438536b3ae7671bd0005a9/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ec6d58e1e3562cd4be26/test_coverage)](https://codeclimate.com/repos/62438536b3ae7671bd0005a9/test_coverage)

Client-side JavaScript API calls for Algodex as an npm package

# Installation

`npm ci`

# Testing

## Automated smart contract tests

`npm test`

With Chrome debugger support:

`npm run testDebug`

## Enabling smart contract source logs in the console output

export DEBUG_SMART_CONTRACT_SOURCE=1

Note: if https://github.com/algodex/algodex-go-api is set up and running, the console will also print out the transactions in json format

## Manual testing

1. Download and set up https://github.com/algodex/algodex-experimental
2. Run the following in the algodex-sdk directory:

`npm link`

3. Run the following in the algodex-experimental directory:

`rm -rf 'node_modules/@algodex'`

`npm link @algodex/algodex-sdk`

# Architecture Documentation

https://github.com/algodex/algodex-architecture


