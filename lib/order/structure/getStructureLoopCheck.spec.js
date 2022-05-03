const continueStructureLoopCheck = require('./getStructureLoopCheck');


describe('continueStructureLoopCheck', () => {
  const takerObjWithProperties = {'orderAlgoAmount': 1000, 'asaBalance': 50, 'algoBalance': 3000, 'limitPrice': 1000, 'walletAlgoBalance': 2000000};
  const negativeBalanceObject = {...takerObjWithProperties, 'algoBalance': 0, 'asaBalance': 0, 'walletAlgoBalance': 14030003};
  it('should throw an error when input object has missing properties', () => {
    expect(()=> {
      continueStructureLoopCheck({fakeObj: true}, false, 20);
    }).toThrow('invalid orderBalance object');
  });
  it.skip('should return true if suplied an object with the correct properties', () => {
    expect(continueStructureLoopCheck(takerObjWithProperties, false, 2000)).toBe(true);
    expect(continueStructureLoopCheck(takerObjWithProperties, true, 20)).toBe(true);
  });
  it('should return false when it detects a 0 balance', ()=> {
    expect(continueStructureLoopCheck(negativeBalanceObject, true, 100)).toBe(false);
    expect(continueStructureLoopCheck(negativeBalanceObject, false, 100)).toBe(false);
  });
  it('should return false when none of the conditions were hit', ()=> {
    expect(continueStructureLoopCheck(takerObjWithProperties, true, 2000)).toBe(true);
    expect(continueStructureLoopCheck(takerObjWithProperties, false, 20)).toBe(true);
  });
});
