const initAccounts = require('../../teal/test/initAccounts');
const initExecutor = require('../../teal/test/initExecutor');
const enc = require('../../utils/encoder');


const logger = require('../../logger');

/**
 *
 * @param {TestConfig} config Test Configuration
 * @param {'buy'|'sell'} type Type of Order
 * @param {boolean} [optIn] Opt In
 * @param {boolean} [executor] Parameter for whether or not to set up an executor account to test taker orders
 * @param {boolean} [note] information related to the test to be included in the note field
 *
 * @return {Promise<any>}
 */
async function accountSetup(config, type, optIn = false, executor, note) {
  logger.info({type, optIn, executor}, `order.test.beforeAll()`);
  if (typeof type !== 'string' || !['buy', 'sell'].includes(type)) {
    throw new TypeError('Must have valid type!');
  }

  const encodedNote = typeof note !== 'undefined' ? enc.encode(note) : undefined;

  // Initalize API Client
  // await config.init(AlgodexApi, [apiConfig]);


  // Initialize Accounts and Configuration
  await initAccounts(config, type, optIn, encodedNote);
  if (executor) {
    await initExecutor(config, type, optIn, encodedNote);
  }
}

module.exports = accountSetup;
