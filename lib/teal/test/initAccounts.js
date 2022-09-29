/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const {transferFunds, transferASA} = require('../utils');

/**
 *
 * @param {TestConfig} config
 * @param {boolean} optIn
 * @param {boolean} newCreator
 * @return {Promise<void>}
 */
async function initAccounts(config, optIn = false, newCreator = false) {
  // If we are overriding the default creator account
  if (newCreator) {
    // This creates the config.oldCreatorAccount key
    // and overrides the current creator account
    config.setCreatorAccount(algosdk.generateAccount());
  }

  await transferFunds(config.client, config.openAccount, config.creatorAccount, 2000000);

  const {client, openAccount, maliciousAccount, creatorAccount, executorAccount} = config;


  await transferFunds(client, openAccount, creatorAccount, 5000000); // 5 algos
  await transferFunds(client, openAccount, executorAccount, 5000000); // 5 algos
  await transferASA(client, creatorAccount, creatorAccount, 0, config.assetIndex); // opt in transaction
  await transferASA(client, openAccount, creatorAccount, 2000000, config.assetIndex); // 5 algos

  if (optIn) {
    await transferASA(client, executorAccount, executorAccount, 0, config.assetIndex); // opt in transaction
    await transferASA(client, openAccount, executorAccount, 2000000, config.assetIndex); // 5 algos
  }

  await transferFunds(client, openAccount, maliciousAccount, 5000000); // 5 algos
  await transferASA(client, maliciousAccount, maliciousAccount, 0, config.assetIndex); // opt in transaction
  await transferASA(client, openAccount, maliciousAccount, 2000000, config.assetIndex); // 5 algos
}

module.exports = initAccounts;
