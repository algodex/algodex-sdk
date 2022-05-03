const withStructureSingleTransListWithGroupOrder = require('./getTxnOrderNumber');


describe('withStructureSingleTransListWithGroupOrder', ()=> {
  const allTransList = [];
  const singleTransList = [{f: 'fake'}, {f: 'fake'}, {f: 'fake'}, {f: 'fake'}];
  const groupNumber = 0;
  const txnNumber = -1;


  it('should throw errors when passed wrong inputs', () => {
    expect(
        () => withStructureSingleTransListWithGroupOrder(
            allTransList,
            allTransList,
            txnNumber,
            groupNumber),
    ).toThrow('singleOrderTransList must not be empty');
    expect(
        () => withStructureSingleTransListWithGroupOrder(
            'notArray',
            allTransList,
            txnNumber,
            groupNumber),
    ).toThrow('TransLists must be arrays');
    expect(
        () => withStructureSingleTransListWithGroupOrder(
            singleTransList,
            'notArray',
            txnNumber,
            groupNumber),
    ).toThrow('TransLists must be arrays');
  });

  it('should work as expected', ()=> {
    expect(
        withStructureSingleTransListWithGroupOrder(
            singleTransList,
            allTransList,
            txnNumber,
            groupNumber),
    ).toEqual(3);
  });
});
