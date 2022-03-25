const fromAlgoUnits = require('./fromAlgoUnits');
const fromAssetUnits = require('./fromAssetUnits');
const toAlgoUnits = require('./toAlgoUnits');
const toAssetUnits = require('./toAssetUnits');

describe('fromAlgoUnits', () => {
  it(`should convert microalgos to algos`, () => {
    const microalgos = 2187000;
    const algos = 2.187;

    const result = fromAlgoUnits(microalgos);
    expect(result).toBe(algos);
  });

  it(`should convert a LAMP (decimals: 6) amount from base units to whole units`, () => {
    const asset = {
      name: 'LAMP',
      decimals: 6,
    };
    const baseUnitAmount = 9385691;
    const wholeUnitAmount = 9.385691;

    const result = fromAlgoUnits(baseUnitAmount, asset.decimals);
    expect(result).toBe(wholeUnitAmount);
  });

  it(`should convert a JOHN1 (decimals: 2) amount from base units to whole units`, () => {
    const asset = {
      name: 'JOHN1',
      decimals: 2,
    };
    const baseUnitAmount = 9385691;
    const wholeUnitAmount = 93856.91;

    const result = fromAlgoUnits(baseUnitAmount, asset.decimals);
    expect(result).toBe(wholeUnitAmount);
  });
});

describe('toAlgoUnits', () => {
  it(`should convert microalgos to algos`, () => {
    const algos = 2.187;
    const microalgos = 2187000;

    const result = toAlgoUnits(algos);
    expect(result).toBe(microalgos);
  });

  it(`should convert a LAMP (decimals: 6) amount from whole units to base units`, () => {
    const asset = {
      name: 'LAMP',
      decimals: 6,
    };
    const wholeUnitAmount = 9.385691;
    const baseUnitAmount = 9385691;

    const result = toAlgoUnits(wholeUnitAmount, asset.decimals);
    expect(result).toBe(baseUnitAmount);
  });

  it(`should convert a JOHN1 (decimals: 2) amount from whole units to base units`, () => {
    const asset = {
      name: 'JOHN1',
      decimals: 2,
    };
    const wholeUnitAmount = 93856.91;
    const baseUnitAmount = 9385691;

    const result = toAlgoUnits(wholeUnitAmount, asset.decimals);
    expect(result).toBe(baseUnitAmount);
  });
});

describe('toAssetUnits', () => {
  it(`should return the same price if the ASA decimals are the same as ALGO`, () => {
    const asset = {
      name: 'LAMP',
      decimals: 6,
    };
    const price = 2.945;
    const result = toAssetUnits(price, asset.decimals);
    expect(result).toBe(price);
  });

  it(`should convert to JOHN1 limit price from ALGO limit price`, () => {
    const asset = {
      name: 'JOHN1',
      decimals: 2,
    };
    const algoPrice = 2.945637;
    const john1Price = 29456.37;
    const result = toAssetUnits(algoPrice, asset.decimals);
    expect(result).toBe(john1Price);
  });

  it(`should return zero if the first argument is null`, () => {
    const asset = {
      name: 'GABE1',
      decimals: 2,
    };
    const result = toAssetUnits(null, asset.decimals);
    expect(result).toBe(0);
  });
});

describe('fromAssetUnits', () => {
  it(`should return the same price if the ASA decimals are the same as ALGO`, () => {
    const asset = {
      name: 'LAMP',
      decimals: 6,
    };
    const price = 2.945;
    const result = fromAssetUnits(price, asset.decimals);
    expect(result).toBe(price);
  });

  it(`should convert from JOHN1 limit price to ALGO limit price`, () => {
    const asset = {
      name: 'JOHN1',
      decimals: 2,
    };
    const john1Price = 0.69999958;
    const algoPrice = 0.000069999958;
    const result = fromAssetUnits(john1Price, asset.decimals);
    expect(result).toBe(algoPrice);
  });
});
