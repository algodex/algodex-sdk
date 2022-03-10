# algodex-sdk

[![algodex/algodex-sdk:main](https://github.com/algodex/algodex-sdk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/algodex/algodex-js/actions/workflows/ci.yml)


Client-side JavaScript API calls for Algodex as an npm package

### 📁 Folder Structure
```shell
# tree -f -L 2
.
├── ./bin # Binary Files
├── ./lib # Library Files
│   ├── ./lib/functions # Lambda Functions
│   └── ./lib/teal # Contract Code
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

```shell
yarn
```

## ✅ Testing

## Automated smart contract tests

```shell
yarn test
```

With Chrome debugger support:

```shell
yarn testDebug
```

### 🔧 Enabling smart contract source logs in the console output

export DEBUG_SMART_CONTRACT_SOURCE=1

Note: if https://github.com/algodex/algodex-go-api is set up and running, the console will also print out the transactions in json format

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

## 🕸 Links
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing](.github/CONTRIBUTING.md)
- [Architecture Documentation](https://github.com/algodex/algodex-architecture)


