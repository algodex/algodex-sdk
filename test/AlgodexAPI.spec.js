const constants = require ('../constants')
const algosdk = require('algosdk')
let api;
describe('Algodex API', () => {
    describe('construction', ()=>{
        it('should be created with defaults', () => {
            const AlgodexApi = require('../algodex_api.js');
            let _api = new AlgodexApi()
            expect(_api).toBeInstanceOf(AlgodexApi)
        });
        it('should fail with invalid configuration', () => {
            const AlgodexApi = require('../algodex_api.js');
            let _api = new AlgodexApi()
            expect(_api).toBeInstanceOf(AlgodexApi)
        });

        it('should be created with valid configuration', () => {
            const AlgodexApi = require('../algodex_api.js');
            let _api = new AlgodexApi()
            expect(_api).toBeInstanceOf(AlgodexApi)
        });
    })

    describe('methods', ()=>{
        beforeEach(()=>{
            const AlgodexApi = require('../algodex_api.js');
            api = new AlgodexApi()
        })

        it('should fail to do an alert', ()=>{
            expect(api.doAlert).toThrowError()
        });
        it('should get constants', ()=>{
            let result = api.getConstants()
            expect(result).toEqual(constants)
        });
        it('should resolve a map of promises', async ()=>{
            const promises = [...Array(5).keys()].map((v)=> new Promise((resolve, reject)=>{
                setTimeout(()=>{
                    v !== 3 ? resolve(v) : reject('Invalid')
                }, 1)
            }))
            let result = await api.allSettled(promises)
            expect(result).toEqual([
                {"status": "promiseFulfilled", "value": 0},
                {"status": "promiseFulfilled", "value": 1},
                {"status": "promiseFulfilled", "value": 2},
                {"reason": "Invalid", "status": "promiseRejected"},
                {"status": "promiseFulfilled", "value": 4},
            ])
        });

        it('should initialize smart contracts', ()=>{
            api.initSmartContracts('local')
            expect(api.getOrderBookId(true)).toEqual(constants.LOCAL_ALGO_ORDERBOOK_APPID)
            expect(api.getOrderBookId(false)).toEqual(constants.LOCAL_ASA_ORDERBOOK_APPID)
            api.initSmartContracts('test')
            expect(api.getOrderBookId(true)).toEqual(constants.TEST_ALGO_ORDERBOOK_APPID)
            expect(api.getOrderBookId(false)).toEqual(constants.TEST_ASA_ORDERBOOK_APPID)
            api.initSmartContracts('public_test')
            expect(api.getOrderBookId(true)).toEqual(constants.PUBLIC_TEST_ALGO_ORDERBOOK_APPID)
            expect(api.getOrderBookId(false)).toEqual(constants.PUBLIC_TEST_ASA_ORDERBOOK_APPID)
            api.initSmartContracts('production')
            expect(api.getOrderBookId(true)).toEqual(constants.PROD_ALGO_ORDERBOOK_APPID)
            expect(api.getOrderBookId(false)).toEqual(constants.PROD_ASA_ORDERBOOK_APPID)
        })

        it.skip('should get the orderbook id', ()=>{
            // TODO: Fix global pollution
            expect(api.getOrderBookId(true)).toEqual(-1)
            expect(api.getOrderBookId(false)).toEqual(-1)
        })

        it('should get a minimum wallet balance', async ()=>{
            let success = await api.getMinWalletBalance({address:'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI'})
            let fail = await api.getMinWalletBalance()
            expect(success).toEqual(11768000)
            expect(fail).toEqual(1000000)
        })

        it( 'should initialize an indexer', ()=>{
            let local = api.initIndexer('local')
            expect(local).toBeInstanceOf(algosdk.Indexer)
            let test = api.initIndexer('test')
            expect(test).toBeInstanceOf(algosdk.Indexer)
            let pt = api.initIndexer('public_test')
            expect(pt).toBeInstanceOf(algosdk.Indexer)
            let prod = api.initIndexer('production')
            expect(prod).toBeInstanceOf(algosdk.Indexer)
        })

        it('should initialize an algod', ()=>{
            let local = api.initAlgodClient('local')
            expect(local).toBeInstanceOf(algosdk.Algodv2)
            let test = api.initAlgodClient('test')
            expect(test).toBeInstanceOf(algosdk.Algodv2)
            let pt = api.initAlgodClient('public_test')
            expect(pt).toBeInstanceOf(algosdk.Algodv2)
            let prod = api.initAlgodClient('production')
            expect(prod).toBeInstanceOf(algosdk.Algodv2)
        })

        it.skip('should wait for confirmation', async ()=>{
            let confirm = await api.waitForConfirmation('CUI7CAVM4RMVNRLLAC52QTJG7PPXYBB3JPOH4JMYTCDGQHCSD6EA')
            expect(confirm).toBeNull()
        })

        it('should get numerator and denominator from price', ()=>{
            let {n, d} = api.getNumeratorAndDenominatorFromPrice(1.00001)
            expect(n).toEqual(100000)
            expect(d).toEqual(100001)
        })

        it('should create orderbook entry', ()=>{
            let entry = api.createOrderBookEntryObj(1,2,3,4,5,6,7,8,9,10,11,12,13)
            expect(entry).toEqual({
                orderEntry: 1, // this should match what's in the blockchain
                price: 2, // d/n
                n: 3,
                d: 4,
                min: 5,
                escrowAddr: 6,
                algoBalance: 7,
                asaBalance: 8,
                escrowOrderType: 9,
                isASAEscrow: 10,
                orderCreatorAddr: 11,
                assetId: 12,
                version: 13
            })
        })

        it('should get cut order times', ()=>{
            let asaOrder = api.getCutOrderTimes({
                isASAEscrow: true,
                asaBalance: 5
            })

            expect(asaOrder).toEqual({
                "cutOrderAmount": 1,
                "splitTimes": 4
            })

            let algoOrder = api.getCutOrderTimes({
                isASAEscrow: false,
                algoBalance: 5,
                price: 1
            })

            expect(algoOrder).toEqual({
                "cutOrderAmount": 500000,
                "splitTimes": 1
            })
        })

        it.skip('should execute order', ()=>{
            let result = api.executeOrder()
        })

        it.skip('should close order from orderbook', ()=>{
            let result = api.closeOrderFromOrderBookEntry()
        })

        it.skip('should assign groups', ()=>{
            let result = api.assignGroups()
        })

        it.skip('should do a final price check', ()=>{
            api.finalPriceCheck()
        })

        it.skip('should get algo and asa amounts', ()=>{
            api.getAlgoandAsaAmounts()
        })

        it.skip('should sign and send wallet connect transactions', ()=>{
            api.signAndSendWalletConnectTransactions()
        })

        it.skip('should sign and send transactions', ()=>{
            api.signAndSendTransactions()
        })

        it.skip('should generate an order', ()=>{
            api.generateOrder()
        })

        it.skip('should place algos to buy asa order into orderbook?', ()=>{
            api.getPlaceAlgosToBuyASAOrderIntoOrderbook()
        })

        it.skip('should execute a market order', ()=>{
            api.executeMarketOrder()
        })

        it.skip('should get palace asa to sell asa order into orderbook?', ()=>{
            api.getPlaceASAToSellASAOrderIntoOrderbook
        })

        it.skip('should print signed transactions', ()=>{
            api.printTransactionDebug()
        })

        it('should build teal templates', ()=>{
            let v3asa = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', false)
            expect(v3asa).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')
            let v3alg = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', true)
            expect(v3alg).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')

            let v4asa = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', true, 4)
            expect(v4asa).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')
            let v4alg = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', false, 4)
            expect(v4alg).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')

            let v5asa = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', true, 5)
            expect(v5asa).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')
            let v5alg = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', false, 5)
            expect(v5alg).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')

            let v6asa = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', true, 6)
            expect(v6asa).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')
            let v6alg = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', false, 6)
            expect(v6alg).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')

            let v7asa = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', true, 7)
            expect(v7asa).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')
            let v7alg = api.buildDelegateTemplateFromArgs(5, 0, 5,10, 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI', false, 7)
            expect(v7alg).toContain('WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI')
        })

        it.skip('should get lsig from program source', ()=>{
            api.getLsigFromProgramSource()
        })

        it.skip('should get account info', ()=>{
            api.getAccountInfo()
        })


    });

});
