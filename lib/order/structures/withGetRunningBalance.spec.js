
const getRunningBalance = require('./withGetRunningBalance');

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


describe('getRunningBalance', ()=> {
  it('should throw an error if inputted object does not have needed properties', ()=> {
    expect(
        () => getRunningBalance({error: true}),
    ).toThrow('Object is missing necessary properties');
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
