# algodex-sdk

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![algodex/algodex-sdk:main](https://github.com/algodex/algodex-sdk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/algodex/algodex-sdk/actions/workflows/ci.yml)

[//]: # ([![Maintainability]&#40;https://api.codeclimate.com/v1/badges/ec6d58e1e3562cd4be26/maintainability&#41;]&#40;https://codeclimate.com/repos/62438536b3ae7671bd0005a9/maintainability&#41;)
[//]: # ([![Test Coverage]&#40;https://api.codeclimate.com/v1/badges/ec6d58e1e3562cd4be26/test_coverage&#41;]&#40;https://codeclimate.com/repos/62438536b3ae7671bd0005a9/test_coverage&#41;)

Client-side JavaScript API calls for Algodex as an npm package

# ⚙ Getting Started

### ✨ Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [yarn](https://classic.yarnpkg.com/en/docs/install)

## 📦 Installing

## NPM

```shell
npm install @algodex/algodex-sdk
```

## Yarn

```shell
yarn add @algodex/algodex-sdk
```

## 📚 Documentation
Detailed documentation can be found [here](https://algodex-dky9z8dda-algodex-dev.vercel.app/module-order_structure.html)

## ⚗ Usage

#### 🔧 API Configuration:

The API fetches data from the following resources:

- [Algorand Node] ()
- [Algorand Indexer] ()
- [AlgoExplorer Indexer] ()
- [Algodex REST API] ()

#### ⚙ Example Testnet config.json
``` json
{
  config: {
    'algod': {
      'uri': 'https://testnet-algorand.api.purestake.io/ps2',
      'token': '<TOKEN>',
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
  },
}

```
#### ⚙ Example Mainnet config.json
``` json
{
  config: {
    'algod': {
      'uri': 'https://mainnet-algorand.api.purestake.io/ps2',
      'token': '<TOKEN>',
      'port': 443,
    },
    'indexer': {
      'uri': 'https://algoindexer.algoexplorerapi.io',
      'token': '',
    },
    'explorer': {
      'uri': 'https://indexer.algoexplorerapi.io',
      'port': '',
    },
    'dexd': {
      'uri': 'https://app.algodex.com/algodex-backend',
      'token': '',
    },
  },
}

```
#### 🏗 Create an instance of the API 

``` javascript
 const config = require('./config.json')
 const AlgodexAPI = require('@algodex/algodex-sdk')
 const api = new AlgodexAPI(config)
```


#### 🔨 Placing Orders:
```javascript
// Configure wallet
api.setWallet({
  "type": "sdk",
  "address": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
  "connector": require('@algodex/algodex-sdk/lib/wallet/connector/AlgoSDK'),
  "mnemonic": "Your 25 word mneumonic goes here"
})


// Placing an Order
await api.placeOrder({
  "asset": {
    "id": 15322902, // Asset Index
    "decimals": 6, // Asset Decimals
  },
  "address": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
  "price": 2.22, // Price in ALGOs
  "amount": 1, // Buy orders are in ALGOs amounts, Sell Orders are in Asset amounts
  "execution": "both", // Type of exeuction
  "type": "buy", // Order Type
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


