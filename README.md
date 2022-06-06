# algodex-sdk

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![algodex/algodex-sdk:main](https://github.com/algodex/algodex-sdk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/algodex/algodex-sdk/actions/workflows/ci.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/ec6d58e1e3562cd4be26/maintainability)](https://codeclimate.com/repos/62438536b3ae7671bd0005a9/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ec6d58e1e3562cd4be26/test_coverage)](https://codeclimate.com/repos/62438536b3ae7671bd0005a9/test_coverage)

Client-side JavaScript API calls for Algodex as an npm package




# ⚙ Getting Started

### ✨ Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [yarn](https://classic.yarnpkg.com/en/docs/install)

## 📦 Installing

## NPM

```shell
npm install @algodex/sdk
```

## Yarn

```shell
yarn add @algodex/sdk
```

## 📚 Documentation
Detailed documentation can be found [here](https://algodex-dky9z8dda-algodex-dev.vercel.app/module-order_structure.html)

## ⚗ Usage

#### 🔧 API Configuration:

``` json
{
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
}

```

#### 🪴🚿 Create an instance of the API 

``` javascript
 const config = require('./config.js')
 const AlgodexAPI = require(@algodex/algodex-sdk)
 const api = new AlgodexAPI({config})
 console.log(api)
//  OUTPUTS:
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


#### 🔨 Placing Orders:
```javascript
 //Configure wallet
    await api.setWallet({
    "type": "sdk",
    "address": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
    "connector": {
      "connected": false
    },
    "mnemonic": "Your 25 word mneumonic goes here"})

 
 // Placing an Order
    await api.placeOrder({
    "client": api.algod,
    "indexer": api.indexer,
    "asset": {
      "id": 15322902,
      "decimals": 6,
    },
    "address": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
    "price": 2.22,
    "amount": 1,
    "total": 2,
    "execution": "both",
    "type": "buy",
    "appId": 22045503,
    "version": 6
  })
 ```

 See all possible orders that [placeOrder]() supports: [here]()

## 🏘 Community 
[Discord](https://discord.com/invite/qS3Q7AqwF6)
[Telegram](https://t.me/algodex)
[Reddit](https://www.reddit.com/r/Algodex/)
[Twitter](https://twitter.com/AlgodexOfficial)


## 🕸 Links
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing](.github/CONTRIBUTING.md)
- [Architecture Documentation](https://github.com/algodex/algodex-architecture)


