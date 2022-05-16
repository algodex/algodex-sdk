const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const getTakerTxns = require('../structure/getTakerTxns');


async function withTakerTxns(api, order) {
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  if (typeof order.contract !== 'undefined' && typeof order.contract.entry !== 'string') {
    throw new TypeError('Order must have a valid contract state with an entry!');
  }
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await getTakerTxns(api, order),
    },
  };
}

module.exports = withTakerTxns;


