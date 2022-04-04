const {getNumeratorAndDenominatorFromPrice, scientificToString} = require('./algodex_api');
const Big = require('big.js')
it('should return sciToString', ()=>{
  expect(scientificToString(new Big(2.22))).toEqual("2.22")
  expect(scientificToString(new Big(1e-7))).toEqual("0.0000001")
})


it('getNumDen', ()=>{
  const res = getNumeratorAndDenominatorFromPrice(2.22);
  expect(res).toEqual({
    d: 222,
    n: 100,
  });
});

it('should add algorand units with scientific notation', ()=>{
  const res = getNumeratorAndDenominatorFromPrice(1e-7);
  expect(res).toEqual({
    d: 1,
    n: 10000000,
  });
});
