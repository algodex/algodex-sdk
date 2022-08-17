const testHelper = require('./setup.js');
const connector = require('../../wallet/connectors/AlgoSDK');

const config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
  executorAccount: testHelper.getRandomAccount(),
  openAccount: testHelper.getOpenAccount(),
  maliciousAccount: testHelper.getRandomAccount(),
  client: testHelper.getLocalClient(),
  connector: connector,
  assetId: 66711302,
};

module.exports = config;
