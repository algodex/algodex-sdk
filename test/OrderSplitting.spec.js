const AlgodexInternal = require('../algodex_internal_api.js');
const AlgodexAPI = require('../algodex_api.js');
const AlgodexApi = new AlgodexAPI();
const JEST_MINUTE_TIMEOUT = 60 * 1000;


describe('Test Splitting Initial Order', () => {
  test('Test getCutOrderTimes()', async () => {
        const getCutOrderTimes = AlgodexApi.getCutOrderTimes;
        let times = getCutOrderTimes( {asaBalance: 40, isASAEscrow: true} );
        expect(times.cutOrderAmount).toBe(10);
        expect(times.splitTimes).toBe(4);

        times = getCutOrderTimes( {asaBalance: 160, isASAEscrow: true} );
        expect(times.cutOrderAmount).toBe(40);
        expect(times.splitTimes).toBe(4);

        times = getCutOrderTimes( {asaBalance: 100000, isASAEscrow: true} );
        expect(times.cutOrderAmount).toBe(25000);
        expect(times.splitTimes).toBe(4);

        times = getCutOrderTimes( {asaBalance: 3, isASAEscrow: true} );
        expect(times.cutOrderAmount).toBe(1);
        expect(times.splitTimes).toBe(3);
        times = getCutOrderTimes( {asaBalance: 1, isASAEscrow: true} );
        expect(times.cutOrderAmount).toBe(1);
        expect(times.splitTimes).toBe(1);

        times = getCutOrderTimes( {price: 0.25, algoBalance: 500000, isASAEscrow: false} );
        expect(times.cutOrderAmount).toBe(500000);
        expect(times.splitTimes).toBe(1);

        times = getCutOrderTimes( {price: 0.25, algoBalance: 700000, isASAEscrow: false} );
        expect(times.cutOrderAmount).toBe(500000);
        expect(times.splitTimes).toBe(1);

        times = getCutOrderTimes( {price: 0.25, algoBalance: 900000, isASAEscrow: false} );
        expect(times.cutOrderAmount).toBe(500000);
        expect(times.splitTimes).toBe(1);

        times = getCutOrderTimes( {price: 0.25, algoBalance: 1300000, isASAEscrow: false} );
        expect(times.cutOrderAmount).toBe(500000);
        expect(times.splitTimes).toBe(2);

        times = getCutOrderTimes( {price: 0.25, algoBalance: 999900000, isASAEscrow: false} );
        expect(times.cutOrderAmount).toBe(249975000);
        expect(times.splitTimes).toBe(4);

        times = getCutOrderTimes( {price: 1000000, algoBalance: 999900000, isASAEscrow: false} );
        expect(times.cutOrderAmount).toBe(249975000);
        expect(times.splitTimes).toBe(4);

        times = getCutOrderTimes( {price: 1000000, algoBalance: 1200000, isASAEscrow: false} );
        expect(times.cutOrderAmount).toBe(1000001);
        expect(times.splitTimes).toBe(1);
  }, JEST_MINUTE_TIMEOUT);


});
