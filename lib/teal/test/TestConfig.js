const algosdk = require('algosdk');
const {getOpenAccount} = require('./utils');
const getTransactionParams = require('../getTransactionParams');

/**
 * Test Configuration
 * @todo create application dictionary with accounts as this.apps = {12345: {creator, executor, malicious, open}}
 *
 * @constructor
 */
function TestConfig() {
  this.appIndex = -1;
  /**
     *
     * @type {algosdk.Account}
     */
  this.creatorAccount = algosdk.generateAccount();
  /**
     *
     * @type {algosdk.Account}
     */
  this.executorAccount = algosdk.generateAccount();
  /**
     *
     * @type {algosdk.Account}
     */
  this.openAccount = getOpenAccount();
  /**
     *
     * @type {algosdk.Account}
     */
  this.maliciousAccount = algosdk.generateAccount();
  /**
     *
     * @type {number}
     */
  this.assetIndex = 66711302;
  /**
     *
     * @type {boolean}
     */
  this.initalized = false;
}

TestConfig.prototype = {
  async init(Constructor, apiArgs) {
    if (!this.initalized) {
      /**
       * @type {AlgodexApi}
       */
      this.api = new Constructor(...apiArgs);
      /**
       *
       * @type {algosdk.Algodv2}
       */
      this.client = this.api.algod;
      /**
       *
       * @type {algosdk.SuggestedParams}
       */
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
     * Update the Test Asset
     * @param {number} assetIndex Asset Index
     */
  setAssetIndex(assetIndex) {
    this.assetIndex = assetIndex;
  },
  /**
     * Update Fake App Index
     * @param {number} appIndex
     */
  setFakeAppIndex(appIndex) {
    this.fakeAppIndex = appIndex;
  },
};

module.exports = TestConfig;
