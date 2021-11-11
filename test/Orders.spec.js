const AlgodexInternal = require('../algodex_internal_api.js');
const AlgodexApi = require('../algodex_api.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;


describe('Test Order Matching', () => {
  test('ASA order with closeout', async () => {

    const orderBookEscrowEntry = {
        algoBalance: 498000,
        asaBalance: 4000000,
        assetId: 15322902,
        d: 277,
        escrowAddr: "DKPQP3NO4CSJPGOE7VW7KLHFAHCWUHAQXL7VEGFVLJLPTPZ5I2OO3YLGME",
        escrowOrderType: "sell",
        isASAEscrow: true,
        min: 0,
        n: 1000,
        orderCreatorAddr: "UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A",
        orderEntry: "1000-277-0-15322902",
        price: 0.277,
        version: 3
    };

    const takerCombOrderBalance = {
      algoBalance: 14440433,
      asaBalance: 485089385,
      limitPrice: 0.3,
      takerAddr: "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
      walletASABalance: 485089385,
      walletAlgoBalance: 132732986069,
      walletMinBalance: 10768000
    }


    const orderAmount = AlgodexInternal.getExecuteASAOrderTakerTxnAmounts(takerCombOrderBalance, orderBookEscrowEntry);

    console.log({orderAmount});

    expect(orderAmount.escrowAsaTradeAmount).toBe(4000000);
    expect(orderAmount.algoTradeAmount).toBe(1108000);
    expect(orderAmount.executionFees).toBe(4000);
    expect(orderAmount.closeoutFromASABalance).toBe(true);
  }, JEST_MINUTE_TIMEOUT);

  test('ASA partial order without closeout', async () => {
    const orderBookEscrowEntry = {
        algoBalance: 498000,
        asaBalance: 4000000,
        assetId: 15322902,
        d: 277,
        escrowAddr: "DKPQP3NO4CSJPGOE7VW7KLHFAHCWUHAQXL7VEGFVLJLPTPZ5I2OO3YLGME",
        escrowOrderType: "sell",
        isASAEscrow: true,
        min: 0,
        n: 1000,
        orderCreatorAddr: "UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A",
        orderEntry: "1000-277-0-15322902",
        price: 0.277,
        version: 3
    };

    const takerCombOrderBalance = {
      algoBalance: 1000000,
      asaBalance: 485089385,
      limitPrice: 0.3,
      takerAddr: "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
      walletASABalance: 485089385,
      walletAlgoBalance: 132732986069,
      walletMinBalance: 10768000
    }


    const orderAmount = AlgodexInternal.getExecuteASAOrderTakerTxnAmounts(takerCombOrderBalance, orderBookEscrowEntry);

    console.log({orderAmount});

    expect(orderAmount.algoTradeAmount).toBe(1000000);
    expect(orderAmount.escrowAsaTradeAmount).toBe(3610108);
    expect(orderAmount.executionFees).toBe(4000);
    expect(orderAmount.closeoutFromASABalance).toBe(false);
  }, JEST_MINUTE_TIMEOUT);

  test('Algo buy order with closeout', async () => {
    const orderBookEscrowEntry =  {
      "orderEntry": "1000-285-0-15322902",
      "price": 0.285,
      "n": 1000,
      "d": 285,
      "min": 0,
      "escrowAddr": "QLSUTY3GS4HQ4EZCPQBCZVRH2HO2DJT5IJX3JQJD2IABNQ5MYMAJ6B4BGE",
      "algoBalance": 854000,
      "escrowOrderType": "buy",
      "isASAEscrow": false,
      "orderCreatorAddr": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
      "assetId": 15322902,
      "version": 4
    };

    const takerCombOrderBalance = {
      "asaBalance": 4777272,
      "algoBalance": 132734430069,
      "walletAlgoBalance": 132734430069,
      "walletASABalance": 479992396,
      "limitPrice": 0.22,
      "takerAddr": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
      "walletMinBalance": 10768000
    };

    const orderAmount = AlgodexInternal.getExecuteAlgoOrderTakerTxnAmounts(orderBookEscrowEntry, takerCombOrderBalance);

    console.log({orderAmount});

    expect(orderAmount.algoAmountReceiving).toBe(849999);
    expect(orderAmount.asaAmountSending).toBe(2982456);
    expect(orderAmount.txnFee).toBe(4000);
  }, JEST_MINUTE_TIMEOUT);
});

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