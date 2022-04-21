const algosdk = require('algosdk');
const {getOpenAccount} = require('./utils');
const getTransactionParams = require('../getTransactionParams');
let config;

/**
 * Test Configuration
 * @constructor
 */
function TestConfig() {
  this.appIndex = -1;
  this.creatorAccount = algosdk.generateAccount();
  this.executorAccount = algosdk.generateAccount();
  this.openAccount = getOpenAccount();
  this.maliciousAccount = algosdk.generateAccount();
  /**
   *
   * @type {algosdk.Algodv2}
   */
  this.assetIndex = 66711302;
  this.initalized = false;
}

TestConfig.prototype = {
  async init(Constructor, apiArgs) {
    if (!this.initalized) {
      this.api = new Constructor(...apiArgs);
      this.client = this.api.algod;
      this.suggestedParams = await getTransactionParams(this.client, undefined, true);
      this.initalized = true;
    }
  },
  setCreatorAccount(account) {
    this.oldCreatorAccount = this.creatorAccount;
    this.creatorAccount = account;
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
