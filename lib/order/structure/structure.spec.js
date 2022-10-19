/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../../teal/test/config');
const compile = require('../compile');
const sdkSigner = require('../../wallet/signers/AlgoSDK');
const withLogicSigAccount = require('../compile/withLogicSigAccount');
const structure = require('./structure');

/**
 *
 * @param {Array} items
 * @param {string} key
 * @return {*}
 * @ignore
 */
const groupBy = (items, key) => items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [
        ...(result[item[key]] || []),
        item.signedTxn.blob,
      ],
    }),
    {},
);

const
  sendGroupsTransactions = async (client, groupsOfTransactions) => {
    // terrible practice but fine for the time being.
    for (const group in groupsOfTransactions) {
      if (group !== 'prototype') {
        const {txId} = await client.sendRawTransaction(groupsOfTransactions[group]).do();
        await algosdk.waitForConfirmation(client, txId, 10);
      }
    }
  };

// ToDo: Change the loading of orders to accomadate taker
// fetch orderbook => filter against order => compile escrowLsig=> structure takerTransactions
/**
 * This test suite is for "Sell" side Orders in "Taker" Mode
 */
describe('structure', () => {
  // TODO configure test accounts with beforeAll when TEST_ENV==='integration'
  beforeAll(async () => {
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
      // config.setAssetIndex(21582668);
    }
  });


  let signedTxns;
  it.skip('should structure a single transaction when placeAlgo escrow already exists', async () => {
    const order = {
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 2,
      'amount': 1,
      'total': 2,
      'execution': 'maker',
      'type': 'buy',
      'appId': 22045503,
      'version': 6,
    };
    order.client = config.client;

    const structuredOrders = await structure(config.api, order);
    const outerTxns = structuredOrders[0].contract.txns;
    expect(outerTxns.length).toEqual(1); // In this scenario we only expect a single transaction of type:'pay'
    expect(outerTxns[0].unsignedTxn.type).toBe('pay');
    expect(outerTxns[0].unsignedTxn.appArgs.length).toEqual(0);

    signedTxns = await sdkSigner(outerTxns, config.api.wallet.connector.sk);
    signedTxns.forEach((inner) => {
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });

    if (process.env.TEST_ENV === 'integration') {
      if (typeof signedTxns.groupNum !== 'undefined') {
        const signedBuyGroups = groupBy(signedTxns, 'groupNum');
        expect(signedBuyGroups).toBeTruthy();
        await sendGroupsTransactions(config.client, signedBuyGroups);
      } else {
        const signedBuyTxns = signedTxns.map((txn) => txn.signedTxn.blob);
        const {txId} = await config.client.sendRawTransaction(signedBuyTxns).do();
        await algosdk.waitForConfirmation(config.client, txId, 10);
        // await sendGroupsTransactions(config.client, signedBuyGroups);
      }
    }
  }, 500000);

  it.skip('should structure a single transaction when placeAsset and escrow already exists', async () => {
    const order = {
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 430,
      'amount': 0.001,
      'total': 0.430,
      'execution': 'maker',
      'type': 'sell',
      'appId': 22045522,
      'version': 6,
    };
    order.client = config.client;
    const _order = await compile(order);
    _order.contract.from = _order.address;
    _order.contract.to = _order.contract.escrow;
    // _order.isExistingEscrow = true
    _order.contract.creator = order.address;

    const structuredOrder = await structure(_order);
    const outerTxns = structuredOrder.contract.txns;
    // expect(outerTxns.length).toEqual(1) //In this scenario we only expect a single transaction of type:'pay'
    // expect(outerTxns[0].unsignedTxn.type).toBe('axfer')
    // expect(outerTxns[0].unsignedTxn.appArgs.length).toEqual(0)

    signedTxns = await sdkSigner(outerTxns, config.api.wallet.connector.sk);
    signedTxns.forEach((inner) => {
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });

    if (process.env.TEST_ENV === 'integration') {
      if (typeof signedTxns.groupNum !== 'undefined') {
        const signedBuyGroups = groupBy(signedTxns, 'groupNum');
        expect(signedBuyGroups).toBeTruthy();
        await sendGroupsTransactions(config.client, signedBuyGroups);
      } else {
        const signedBuyTxns = signedTxns.map((txn) => txn.signedTxn.blob);
        const {txId} = await config.client.sendRawTransaction(signedBuyTxns).do();
        await algosdk.waitForConfirmation(config.client, txId, 10);
        // await sendGroupsTransactions(config.client, signedBuyGroups);
      }
    }
  }, 500000);

  it.skip('should cancel an existing sellOrder', async () => {
    // const orderbook = await getOrderbook(15322902, config.api);
    /**
     * Check for bad order
     * @param {Order} o
     * @return {boolean}
     */
    function isBadOrder(o) {
      return o.type === 'sell' && o.appId === 22045522 && o.asset.id === 24891477 && o.price === 360;
    }
    // Fetch the Orderbook
    const openOrders = (await config.api.http.dexd.fetchOrders('wallet', config.openAccount.addr))
        .filter((o) => o.type === 'sell' && !isBadOrder(o));


    const lsig = await withLogicSigAccount({
      ...openOrders[0],
      client: config.client,
      address: config.openAccount.addr,
    });

    const structuredOrder = await structure({
      ...lsig,
      execution: 'close',
      type: 'sell',
    });

    const outerTxns = structuredOrder.contract.txns;

    outerTxns.forEach((inner) => {
      expect(inner.unsignedTxn).toBeInstanceOf(algosdk.Transaction);
      expect(['pay', 'appl', 'axfer'].includes(inner.unsignedTxn.type)).toEqual(true);
      if (inner.unsignedTxn.type === 'pay') {
        expect(inner.unsignedTxn.appArgs.length).toEqual(0);
      }

      if (inner.unsignedTxn.type === 'appl') {
        expect(inner.unsignedTxn.appArgs.length).toEqual(2);
        expect((new TextDecoder()).decode(inner.unsignedTxn.appArgs[0])).toEqual('close');
        // expect((new TextDecoder()).decode(inner.unsignedTxn.appArgs[1])).toEqual(_order.contract.entry);
      }
    });


    signedTxns = await sdkSigner(outerTxns, config.api.wallet.connector.sk);
    signedTxns.forEach((inner) => {
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });

    if (process.env.TEST_ENV === 'integration') {
      if (typeof signedTxns.groupNum !== 'undefined') {
        const signedBuyGroups = groupBy(signedTxns, 'groupNum');
        expect(signedBuyGroups).toBeTruthy();
        await sendGroupsTransactions(config.client, signedBuyGroups);
      } else {
        const signedBuyTxns = signedTxns.map((txn) => txn.signedTxn.blob);
        const {txId} = await config.client.sendRawTransaction(signedBuyTxns).do();
        await algosdk.waitForConfirmation(config.client, txId, 10);
        // await sendGroupsTransactions(config.client, signedBuyGroups);
      }
    }
  });


  it.skip('should structure and send taker buy transactions', async () => {
    const order = {
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 1000,
      'amount': 0.001,
      'total': 1,
      'execution': 'taker',
      'type': 'buy',
      'appId': 22045522,
      'version': 6,
    };

    order.client = config.client;
    const _order = await compile(order);
    const outerTxns = await structure(config.api, _order);
    signedTxns = await sdkSigner(outerTxns, config.api.wallet.connector.sk);
    signedTxns.forEach((inner) => {
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });
    if (process.env.TEST_ENV === 'integration') {
      if (typeof signedTxns.groupNum !== 'undefined') {
        const signedBuyGroups = groupBy(signedTxns, 'groupNum');
        expect(signedBuyGroups).toBeTruthy();
        await sendGroupsTransactions(config.client, signedBuyGroups);
      } else {
        const signedBuyTxns = signedTxns.map((txn) => txn.signedTxn.blob);
        const {txId} = await config.client.sendRawTransaction(signedBuyTxns).do();
        await algosdk.waitForConfirmation(config.client, txId, 10);
        // await sendGroupsTransactions(config.client, signedBuyGroups);
      }
    }
  }, 100000);

  it.skip('should structure and send taker split order buy transactions', async () => {
    const order = {
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 250,
      'amount': 0.002,
      'total': 250 * 0.002,
      'execution': 'taker',
      'type': 'sell',
      'appId': 22045503,
      'version': 6,
    };

    const appIdForAssetEscrow = 22045522;

    order.client = config.client;
    const _order = await compile(order);
    // makeSure specified price is larger or equal to an existing order price or this will fail.
    const orderWithOuterTxns = await structure(config.api, {..._order, appId: appIdForAssetEscrow});
    signedTxns = await sdkSigner(orderWithOuterTxns.contract.txns, config.api.wallet.connector.sk);
    signedTxns.forEach((inner) => {
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });
    if (process.env.TEST_ENV === 'integration' && orderWithOuterTxns.length > 0) {
      if (typeof signedTxns[0].groupNum !== 'undefined') {
        const signedBuyGroups = groupBy(signedTxns, 'groupNum');
        expect(signedBuyGroups).toBeTruthy();
        await sendGroupsTransactions(config.client, signedBuyGroups);
      } else {
        const signedBuyTxns = signedTxns.map((txn) => txn.signedTxn.blob);
        const {txId} = await config.client.sendRawTransaction(signedBuyTxns).do();
        await algosdk.waitForConfirmation(config.client, txId, 10);
        // await sendGroupsTransactions(config.client, signedBuyGroups);
      }
    }
  }
  , 100000);

  it.skip('should structure and send taker sell transactions', async () => {
    const order = {
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 254,
      'amount': 0.01,
      'total': 2.54,
      'execution': 'taker',
      'type': 'sell',
      'appId': 22045503,
      'version': 6,
    };

    order.client = config.client;
    const _order = await compile(order);
    const outerTxns = await structure(config.api, _order);
    signedTxns = await sdkSigner(outerTxns, config.api.wallet.connector.sk);
    signedTxns.forEach((inner) => {
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });
    if (process.env.TEST_ENV === 'integration') {
      if (typeof signedTxns.groupNum !== 'undefined') {
        const signedBuyGroups = groupBy(signedTxns, 'groupNum');
        expect(signedBuyGroups).toBeTruthy();
        await sendGroupsTransactions(config.client, signedBuyGroups);
      } else {
        const signedBuyTxns = signedTxns.map((txn) => txn.signedTxn.blob);
        const {txId} = await config.client.sendRawTransaction(signedBuyTxns).do();
        await algosdk.waitForConfirmation(config.client, txId, 10);
        // await sendGroupsTransactions(config.client, signedBuyGroups);
      }
    }
  }, 100000);

  it.skip('should structure and send taker split order buy transactions', async () => {
    const order = {
      'wallet': config.api.wallet,
      'client': config.client,
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 360,
      'amount': 0.002,
      'total': 360 * 0.002,
      'execution': 'both',
      'type': 'buy',
      'appId': 22045503,
      'version': 6,
    };

    order.client = config.client;
    const orders = await structure(config.api, order);

    // Below demonstates the result of compiling executables
    // group order is preserved, no need to track groupNums

    const executableOrders = orders.map((execObj) => execObj.contract.txns.map((txn) => txn)); // don't need extra mapping
    executableOrders.forEach((txnArr) => algosdk.assignGroupID(txnArr.map((txn) => txn.unsignedTxn)));
    // const flatGroups = executableOrders.flat();

    const signedTransactions = executableOrders.map((txns) => {
      return txns.map((txn) => txn.lsig instanceof algosdk.LogicSigAccount ?
            algosdk.signLogicSigTransaction(txn.unsignedTxn, txn.lsig) :
            algosdk.signTransaction(txn.unsignedTxn, config.api.wallet.connector.sk) )
      ;
    });

    expect(signedTransactions).toBeTruthy();


    // new way of signing, group is implied in order
    for (const group of signedTransactions) {
      const rawTxns = group.map((txn) => txn.blob);

      const {txId} = await config.client.sendRawTransaction(rawTxns).do();

      await algosdk.waitForConfirmation(config.client, txId, 10);
    }
  }, 100000);

  it.skip('should structure and send taker split order sell transactions', async () => {
    const order = {
      'wallet': config.api.wallet,
      'client': config.client,
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 265,
      'amount': 0.4,
      'total': 265 * 0.4,
      'execution': 'both',
      'type': 'sell',
      'appId': 22045522,
      'version': 6,
    };

    order.client = config.client;
    const orders = await structure(config.api, order);

    // Below demonstates the result of compiling executables
    // group order is preserved, no need to track groupNums

    const executableOrders = orders.map((execObj) => execObj.contract.txns.map((txn) => txn)); // don't need extra mapping
    executableOrders.forEach((txnArr) => algosdk.assignGroupID(txnArr.map((txn) => txn.unsignedTxn)));

    const signedTransactions = executableOrders.map((txns) => {
      return txns.map((txn) => txn.lsig instanceof algosdk.LogicSigAccount ?
            algosdk.signLogicSigTransaction(txn.unsignedTxn, txn.lsig) :
            algosdk.signTransaction(txn.unsignedTxn, config.api.wallet.connector.sk) )
      ;
    });

    expect(signedTransactions).toBeTruthy();


    // new way of signing, group is implied in order
    for (const group of signedTransactions) {
      const rawTxns = group.map((txn) => txn.blob);

      const {txId} = await config.client.sendRawTransaction(rawTxns).do();

      await algosdk.waitForConfirmation(config.client, txId, 10);
    }
  }, 100000);


  it.skip('should prove that two seperately constructed transactions with the same parameters have the same txnId despite being signed seperately', async () => {
    const params = await config.client.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    const receiver = 'HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA';
    const enc = new TextEncoder();
    const note = enc.encode('Hello World');
    const amount = 1000000; // equals 1 ALGO
    const sender = 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI';

    const identicalTxns= [algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender,
      to: receiver,
      amount: amount,
      note: note,
      suggestedParams: params,
    }),
    algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender,
      to: receiver,
      amount: amount,
      note: note,
      suggestedParams: params,
    })];

    const signedIdenticalTxns = identicalTxns.map((txn) => algosdk.signTransaction(txn, config.api.wallet.connector.sk));


    expect(signedIdenticalTxns[0].txID).toEqual(signedIdenticalTxns[1].txID);
  });
}, 100000);


