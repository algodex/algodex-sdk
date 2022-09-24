/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const getWalletAlgoBalance = require('./getWalletAlgoBalance');

describe('getWalletAlgoBalance', () => {
  it('Should throw an error when account info is missing an amount property', () => {
    expect(() => {
      getWalletAlgoBalance({'fakeObj': true});
    }).toThrow('Invalid Acct Object: Missing amount property');
  });

  it('Should throw an insufficient balance error when given a zero amount', () => {
    expect(() => {
      getWalletAlgoBalance({'amount': 0});
    }).toThrow('Insufficient Balance');
  });

  it('Should throw a type error when given a non number minBalance', () => {
    expect(() => {
      getWalletAlgoBalance({'amount': 100}, 'notNumberMinBalance');
    }).toThrow('Invalid Type: minBalance is not a number');
  });

  it('Should return a a valid walletAlgoBalance', () => {
    expect(typeof getWalletAlgoBalance({'amount': 13000})).toBe('number');
  });
});
