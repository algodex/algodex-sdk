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

    expect(orderAmount.algoAmountReceiving).toBe(851999);
    expect(orderAmount.asaAmountSending).toBe(2989473);
    expect(orderAmount.txnFee).toBe(2000);
  }, JEST_MINUTE_TIMEOUT);

  test('Algo buy order (partial)', async () => {
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
      "asaBalance": 50000,
      "algoBalance": 132734430069,
      "walletAlgoBalance": 132734430069,
      "walletASABalance": 479992396,
      "limitPrice": 0.22,
      "takerAddr": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
      "walletMinBalance": 10768000
    };

    const orderAmount = AlgodexInternal.getExecuteAlgoOrderTakerTxnAmounts(orderBookEscrowEntry, takerCombOrderBalance);

    console.log({orderAmount});

    expect(orderAmount.algoAmountReceiving).toBe(14250);
    expect(orderAmount.asaAmountSending).toBe(50000);
    expect(orderAmount.txnFee).toBe(2000);
  }, JEST_MINUTE_TIMEOUT);

});
