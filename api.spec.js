const {getNumeratorAndDenominatorFromPrice, scientificToString} = require('./algodex_api');
const Big = require('big.js')
it('should return sciToString', ()=>{
  expect(scientificToString(new Big(2.22))).toEqual("2.22")
  expect(scientificToString(new Big(1e-7))).toEqual("0.0000001")
})

it('getNumeratorAndDenominatorFromPrice', ()=>{
  expect(getNumeratorAndDenominatorFromPrice(2.22)).toEqual({
    d: 222,
    n: 100,
  });
  expect(getNumeratorAndDenominatorFromPrice(1e-7)).toEqual({
    d: 1,
    n: 10000000,
  });
  expect(getNumeratorAndDenominatorFromPrice(0.45)).toEqual({
    d: 45,
    n: 100,
  })
  expect(getNumeratorAndDenominatorFromPrice(10.45)).toEqual({
    d: 1045,
    n: 100
  });
  expect(getNumeratorAndDenominatorFromPrice(0.0171)).toEqual({
    d: 171,
    n: 10000
  });
});
