const getSplitTimesByIter = require('./getSplitTimesByIter');
const cutQueuedOrder = require('./withCutQueuedOrder');

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
const cutQueuedOrderObj = {
  'queuedOrder': nonEscrowOrder,
  'cutOrder': cutOrder,
  'splitTimes': splitTimes,
  'loopIndex': 0,
  'runningBalance': 10000,

};
const escrowCutQueueOrderObj = {
  'queuedOrder': escrowOrder,
  'cutOrder': escrowcutOrder,
  'splitTimes': escrowSplitTimes,
  'loopIndex': 0,
  'runningBalance': 10000,

};


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

describe('withCutQueuedOrder', () => {
  it('should return the same queuedOrder if cutOrder is null ', ()=> {
    expect(cutQueuedOrder({...cutQueuedOrderObj, 'cutOrder': null})).toStrictEqual(nonEscrowOrder);
  });
  it('should return a modified balance if loop index> splitTimes-1', ()=> {
    expect(cutQueuedOrder({...cutQueuedOrderObj, 'loopIndex': splitTimes}).algoBalance).toBe(10000);
    expect(cutQueuedOrder(escrowCutQueueOrderObj).asaBalance).toBe(1);
    expect(cutQueuedOrder({...escrowCutQueueOrderObj, 'loopIndex': splitTimes}).algoBalance).toBe(498000);
  });
});
