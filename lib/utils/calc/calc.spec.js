/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const toAlgoAmount = require('./toAlgoAmount');

describe('utils/big/calc/toAlgoAmount', () => {
  it(`should calculate amount in algos using total cost`, () => {
    let priceInAlgos = 1.5;
    let totalCostInMicroAlgos = 1500000;
    let asaAmount = 1;

    let result = toAlgoAmount(priceInAlgos, totalCostInMicroAlgos);
    expect(result).toBe(asaAmount);

    priceInAlgos = 0.6;
    totalCostInMicroAlgos = 328863;
    asaAmount = 0.548105;

    result = toAlgoAmount(priceInAlgos, totalCostInMicroAlgos);
    expect(result).toBe(asaAmount);
  });
});
