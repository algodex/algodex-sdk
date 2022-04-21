const algosdk = require('algosdk');
const {getRandomAccount, getOpenAccount} = require('./utils');
const getTransactionParams = require('../getTransactionParams');
let config;

const DEFAULT_ALGOD_SERVER='http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com';
const DEFAULT_ALGOD_TOKEN = '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259';
const DEFAULT_ALGOD_PORT=8080;

/**
 * Test Configuration
 * @constructor
 */
function TestConfig() {
  this.appIndex = -1;
  this.creatorAccount = getRandomAccount();
  this.executorAccount = getRandomAccount();
  this.openAccount = getOpenAccount();
  this.maliciousAccount = getRandomAccount();
  /**
   *
   * @type {algosdk.Algodv2}
   */
  this.client = new algosdk.Algodv2(DEFAULT_ALGOD_TOKEN, DEFAULT_ALGOD_SERVER, DEFAULT_ALGOD_PORT);
  this.assetIndex = 66711302;
  this.initalized = false;
}

TestConfig.prototype = {
  async init(Constructor, apiArgs) {
    if (!this.initalized) {
      this.suggestedParams = await getTransactionParams(this.client, undefined, true);
      this.api = new Constructor(...apiArgs);
      this.initalized = true;
    }
  },
  /**
   * Update Application ID
   * @param {number} appIndex Application Index
   */
  setAppIndex(appIndex) {
    this.appIndex = appIndex;
  },
  /**
   * Set the Algorand Client
   * @param {string} token
   * @param {string} server
   * @param {number|string} port
   */
  setClient(token, server, port) {
    this.client = new algosdk.Algodv2(token, server, port);
  },
  /**
   * Update the Test Asset
   * @param {number} assetIndex Asset Index
   */
  setAssetIndex(assetIndex) {
    this.assetIndex = assetIndex;
  },
};

/**
 * Construct a Test Configuration
 * @return {TestConfig}
 */
function makeTestConfig() {
  if (typeof config === 'undefined') {
    config = new TestConfig();
  }
  return config;
}

module.exports = makeTestConfig();
