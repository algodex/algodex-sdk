
const {getRunningBalance, getStructureLoopCheck, getSplitTimesByIter, getTxnOrderNumber} = require('./getCutTakerOrders');

const escrowOrder = {
  'orderEntry': '1-2000-0-15322902',
  'price': 2000,
  'n': 1,
  'd': 2000,
  'min': 0,
  'escrowAddr': 'A5UG4FTHSXOY23NGIXY46N53OQ6HNZVAKTGPHHFJM56GIYCF7ODZVBJQII',
  'algoBalance': 498000,
  'asaBalance': 6,
  'escrowOrderType': 'sell',
  'isASAEscrow': true,
  'orderCreatorAddr': 'DFV2MR2ILEZT5IVM6ZKJO34FTRROICPSRQYIRFK4DHEBDK7SQSA4NEVC2Q',
  'assetId': 15322902,
  'version': 6,
};

const nonEscrowOrder = {
  'orderEntry': '100-15-0-15322902',
  'price': 0.15,
  'n': 100,
  'd': 15,
  'min': 0,
  'escrowAddr': 'BSRIM2J6F7UWUWTQPYU7AE3JQYVQEX5555CHBWAKKPR4C3KW32DZLMOFXM',
  'algoBalance': 499000,
  'escrowOrderType': 'buy',
  'isASAEscrow': false,
  'orderCreatorAddr': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  'assetId': 15322902,
  'version': 5,
};

const {cutOrder, splitTimes} = getSplitTimesByIter(nonEscrowOrder, 0);
const {cutOrder: escrowcutOrder, splitTimes: escrowSplitTimes} = getSplitTimesByIter(escrowOrder, 0);

describe('getRunningBalance', ()=> {
  it('should throw an error if inputted object does not have needed properties', ()=> {
    expect(
        () => getRunningBalance({error: true}),
    ).toThrow('Invalid isASAEscrow Flag');
  });
  const escrowReturn = getRunningBalance(escrowOrder);
  const nonEscrowReturn = getRunningBalance(nonEscrowOrder);
  it('should return a number', () => {
    expect(typeof escrowReturn).toBe('number');
    expect(typeof nonEscrowReturn).toBe('number');
  });

  it('should return the expectedValue', () => {
    expect(escrowReturn).toEqual(6);
    expect(nonEscrowReturn).toEqual(499000);
  });
});


describe('getStructureLoopCheck', () => {
  const takerObjWithProperties = {'orderAlgoAmount': 1000, 'asaBalance': 50, 'algoBalance': 3000, 'limitPrice': 1000, 'walletAlgoBalance': 2000000};
  const negativeBalanceObject = {...takerObjWithProperties, 'algoBalance': 0, 'asaBalance': 0, 'walletAlgoBalance': 14030003};
  it('should throw an error when input object has missing properties', () => {
    expect(()=> {
      getStructureLoopCheck({fakeObj: true}, false, 20);
    }).toThrow('invalid orderBalance object');
  });
  it.skip('should return true if suplied an object with the correct properties', () => {
    expect(getStructureLoopCheck(takerObjWithProperties, false, 2000)).toBe(true);
    expect(getStructureLoopCheck(takerObjWithProperties, true, 20)).toBe(true);
  });
  it('should return false when it detects a 0 balance', ()=> {
    expect(getStructureLoopCheck(negativeBalanceObject, true, 100)).toBe(false);
    expect(getStructureLoopCheck(negativeBalanceObject, false, 100)).toBe(false);
  });
  it('should return false when none of the conditions were hit', ()=> {
    expect(getStructureLoopCheck(takerObjWithProperties, true, 2000)).toBe(true);
    expect(getStructureLoopCheck(takerObjWithProperties, false, 20)).toBe(true);
  });
});

describe('withGetSplitTimesByIter', () => {
  const nullCutOrder = getSplitTimesByIter(escrowOrder, 1);
  it('should return null cutOrder when loopIndex !== 0', () => {
    expect(nullCutOrder.cutOrder).toBe(null);
  });
  it('should return splitTime of 1 when cutOrder is null', () => {
    expect(nullCutOrder.splitTimes).toBe(1);
  });


  it('should split the asaBalance property of escrowOrder', () => {
    expect(escrowSplitTimes).toEqual(4);
  });
  it('should return the expected value:  Math.floor(6/4)', () => {
    expect(escrowcutOrder.cutOrderAmount).toEqual(1);
  });

  it('should split the asaBalance property of escrowOrder', () => {
    expect(splitTimes).toEqual(1);
  });
  it('should return the expected value:  Math.floor(6/4)', () => {
    expect(cutOrder.cutOrderAmount).toEqual(500000);
  });
});

describe('withStructureSingleTransListWithGroupOrder', ()=> {
  const allTransList = [];
  const singleTransList = [{f: 'fake'}, {f: 'fake'}, {f: 'fake'}, {f: 'fake'}];
  const groupNumber = 0;
  const txnNumber = -1;


  it('should throw errors when passed wrong inputs', () => {
    expect(
        () => getTxnOrderNumber(
            allTransList,
            allTransList,
            txnNumber,
            groupNumber),
    ).toThrow('singleOrderTransList must not be empty');
    expect(
        () => getTxnOrderNumber(
            'notArray',
            allTransList,
            txnNumber,
            groupNumber),
    ).toThrow('TransLists must be arrays');
    expect(
        () => getTxnOrderNumber(
            singleTransList,
            'notArray',
            txnNumber,
            groupNumber),
    ).toThrow('TransLists must be arrays');
  });

  it('should work as expected', ()=> {
    expect(
        getTxnOrderNumber(
            singleTransList,
            allTransList,
            txnNumber,
            groupNumber),
    ).toEqual(3);
  });
});
