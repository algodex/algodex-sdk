# algodex-sdk

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![algodex/algodex-sdk:main](https://github.com/algodex/algodex-sdk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/algodex/algodex-sdk/actions/workflows/ci.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/ec6d58e1e3562cd4be26/maintainability)](https://codeclimate.com/repos/62438536b3ae7671bd0005a9/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ec6d58e1e3562cd4be26/test_coverage)](https://codeclimate.com/repos/62438536b3ae7671bd0005a9/test_coverage)

Client-side JavaScript API calls for Algodex as an npm package


### 📁 Folder Structure
```shell
# tree -f -L 2
.
├── ./bin # Binary Files
├── ./lib # Library Files
│   ├── ./lib/functions # Algodex Functions
│   └── ./lib/teal # Contract Code
│   └── ./lib/http # REST Clients
│   └── ./lib/utils # Utilities
│   └── ./lib/AlgodexAPI.js # API Interface
├── ./spec # Type Specifications
├── ./test # Testing Directory
├── ./package.json
└── ./yarn.lock
```

# ⚙ Getting Started

### ✨ Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [yarn](https://classic.yarnpkg.com/en/docs/install)

## 📦 Setup

## Node

```shell
npm install @algodex/sdk
```

## Yarn

```shell
yarn add @algodex/sdk
```

## 📚 Documentation
Detailed documentation can be found [here](https://algodex-dky9z8dda-algodex-dev.vercel.app/module-order_structure.html)

## ✅ Testing

## Automated smart contract tests

```shell
yarn test
```
## Unit testing with coverage

```shell
yarn coverage
```

## End to End integeration testing

```shell
yarn test-integration
```

## Exclude Teal Tests

```shell 
yarn test-sanity
```

With Chrome debugger support:

```shell
yarn testDebug
```

### 🔧 Enabling smart contract source logs in the console output

export DEBUG_SMART_CONTRACT_SOURCE=1

Note: if https://github.com/algodex/algodex-go-api is set up and running, the console will also print out the transactions in json format

## ⚗Usage
```
// In Node.js
 const [AlgodexAPI]{@link AlgodexApi} = require(@algodex/algodex-sdk)
 const apiProps = {
  config: {
    'algod': {
      'uri': 'http:/ec2-3-18-80-65.us-east-2.compute.amazonaws.com',
      'token': '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'port': 8080,
    },
    'indexer': {
      'uri': 'https://algoindexer.testnet.algoexplorerapi.io',
      'token': '',
    },
    'explorer': {
      'uri': 'https://indexer.testnet.algoexplorerapi.io',
      'port': '',
    },
    'dexd': {
      'uri': 'https://api-testnet-public.algodex.com/algodex-backend',
      'token': '',
    },
    'tinyman': {
      'uri': 'https://mainnet.analytics.tinyman.org',
      'token': '',
    },
  },
};

 const api = new [AlgodexAPI]{@link AlgodexApi}(apiProps)

 console.log(api)
 //OUTPUTS:
 {
      emit: [Function: emit],
      on: [Function: on],
      type: 'API',
      isInitialized: true,
      addresses: [],
      algod: AlgodClient {
        c: HTTPClient { bc: [URLTokenBaseHTTPClient] },
        intDecoding: 'default'
      },
      indexer: IndexerClient {
        c: HTTPClient { bc: [URLTokenBaseHTTPClient] },
        intDecoding: 'default'
      },
      http: {
        explorer: Function {
          config: undefined,
          baseUrl: 'https://indexer.testnet.algoexplorerapi.io',
          etags: false
        },
        dexd: Function {
          config: undefined,
          baseUrl: 'https://api-testnet-public.algodex.com/algodex-backend',
          etags: true,
          cache: [Object]
        },
        indexer: Function {
          config: [Object],
          baseUrl: 'https://algoindexer.testnet.algoexplorerapi.io',
          etags: false
        }
      },
      config: {
        algod: {
          uri: 'http:/ec2-3-18-80-65.us-east-2.compute.amazonaws.com',
          token: '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
          port: 8080
        },
        indexer: {
          uri: 'https://algoindexer.testnet.algoexplorerapi.io',
          token: ''
        },
        explorer: { uri: 'https://indexer.testnet.algoexplorerapi.io', port: '' },
        dexd: {
          uri: 'https://api-testnet-public.algodex.com/algodex-backend',
          token: ''
        },
        tinyman: { uri: 'https://mainnet.analytics.tinyman.org', token: '' }
      }
    }
 ```

## ⚗ Manual Usage

1. Download and set up https://github.com/algodex/algodex-experimental
2. Run the following in the algodex-sdk directory:

```shell
yarn link
```

3. Run the following in the algodex-experimental directory:

```shell
rm -rf 'node_modules/@algodex'
yarn link @algodex/algodex-sdk
```

## 🏘 Community 
[Discord](https://discord.com/invite/qS3Q7AqwF6)
[Telegram](https://t.me/algodex)
[Reddit](https://www.reddit.com/r/Algodex/)
[Twitter](https://twitter.com/AlgodexOfficial)


## 🕸 Links
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing](.github/CONTRIBUTING.md)
- [Architecture Documentation](https://github.com/algodex/algodex-architecture)


