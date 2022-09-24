/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const {deleteApplication, closeAccount} = require('../../teal');

/**
 *
 * @todo Refactor to config.apps and remove all
 * @param {TestConfig} config
 * @return {Promise<void>}
 */
async function afterAll(config) {
  const {
    client,
    openAccount,
    creatorAccount,
    executorAccount,
    maliciousAccount,
    appIndex,
    fakeAppIndex,
    oldCreatorAccount,
  } = config;

  const _account = typeof oldCreatorAccount !== 'undefined' ?
      oldCreatorAccount :
      creatorAccount;

  await deleteApplication(client, _account, appIndex);

  if (fakeAppIndex) {
    await deleteApplication(client, _account, fakeAppIndex);
  }

  await closeAccount(client, creatorAccount, openAccount);
  await closeAccount(client, executorAccount, openAccount);
  await closeAccount(client, maliciousAccount, openAccount);
}

module.exports = afterAll;
