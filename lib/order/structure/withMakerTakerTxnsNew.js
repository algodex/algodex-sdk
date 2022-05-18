const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const getMakerTakerTxns = require('../structure/getMakerTakerTxns');


async function withMakerTakerTxns(api, order) {
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await getMakerTakerTxns(api, order),
    },
  };
}

module.exports = withMakerTakerTxns;


