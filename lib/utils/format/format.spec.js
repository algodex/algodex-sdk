/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const floatToFixed = require('./floatToFixed');

describe('floatToFixed', () => {
  it(`should return a number rounded to the provided number of decimal points`, () => {
    const float = 123.456789;
    const toDisplay = '123.4568';

    const result = floatToFixed(float, 4);
    expect(result).toBe(toDisplay);
  });

  it(`should add more decimal points if needed for smaller numbers`, () => {
    const float = 0.0000123456789;
    const toDisplay = '0.00001';

    const result = floatToFixed(float, 4);
    expect(result).toBe(toDisplay);
  });

  it(`should return 0.00 if above max digits`, () => {
    const float = 0.0000004;
    const toDisplay = '0.00';

    const result = floatToFixed(float, 2, 6);
    expect(result).toBe(toDisplay);
  });

  it(`should also accept a string that can be parsed as a float`, () => {
    expect(floatToFixed('123.456789', 4)).toBe('123.4568');
    expect(floatToFixed('0.0000123456789', 4)).toBe('0.00001');
    expect(floatToFixed('0.0000004', 2, 6)).toBe('0.00');

    expect(floatToFixed).toThrowError();
  });
});
