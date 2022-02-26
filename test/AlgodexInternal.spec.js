const algodex = require('../algodex_internal_api.js')
const testWallet = 'DFV2MR2ILEZT5IVM6ZKJO34FTRROICPSRQYIRFK4DHEBDK7SQSA4NEVC2Q';
const indexerHost = 'algoindexer.testnet.algoexplorerapi.io';
const algodHost = 'node.testnet.algoexplorerapi.io';
const protocol = 'https:';

const ALGO_ESCROW_ORDER_BOOK_ID = 18988007;
const ASA_ESCROW_ORDER_BOOK_ID = 18988134;

test('imported algodex is an object', () => {
  expect(typeof algodex).toBe('object');
});

test('setAlgodServer properly sets', () => {
    
   let response= algodex.setAlgodServer('test')

});


test('generateOrder function', () => {
    let params = [testWallet, 1000, 54, 0, 15322902]
    let incldMakerorder = algodex.generateOrder(...params)
    expect(incldMakerorder).toEqual(`${testWallet}-1000-54-0-15322902`)

    params.push(false);
     let noMakerOrder = algodex.generateOrder(...params)
    expect(noMakerOrder).toEqual(`1000-54-0-15322902`)
 });

 test('getAccountInfo function', async () => {
     let emptyWallet = 'KDGKRDPA7KQBBJWF2JPQGKAM6JDO43JWZAK3SJOW25DAXNQBLRB3SKRULA'
     let emptyAccountVal =  {
        "address":emptyWallet,
        "amount":0,"amount-without-pending-rewards":0,"apps-local-state":[],
        "apps-total-schema":{"num-byte-slice":0,"num-uint":0},"assets":[],
        "created-apps":[],"created-assets":[],"pending-rewards":0,
        "reward-base":0,"rewards":0,"round":-1,"status":"Offline"
    }
    let accountInfo = await algodex.getAccountInfo(testWallet);
    expect(typeof accountInfo).toBe('object');
    expect(accountInfo.amount > 0).toBe(true)
    let emptyAccount = await algodex.getAccountInfo(emptyWallet, true)
    expect(emptyAccount).toStrictEqual(emptyAccountVal)
    let nullAccount = await algodex.getAccountInfo(emptyAccountVal, false)
    expect(nullAccount).toBe(null)

 
 });