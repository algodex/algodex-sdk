const withCloseAlgoOrderTxns = require('./structures/withCloseAlgoOrderTxns')
const withCloseAssetOrderTxns = require('./structures/withCloseAssetOrderTxns')
const withExecuteAlgoOrderTxns = require('./structures/withExecuteAlgoOrderTxns')
const withExecuteAssetOrderTxns = require('./structures/withExecuteAssetOrderTxns')
const withPlaceAlgoOrderTxns = require('./structures/withPlaceAlgoOrderTxns')
const withPlaceAssetOrderTxns = require('./structures/withPlaceAssetOrderTxns')

/**
 * @example
 *       RawOrder:{
 *          const {
 *           escrowAddress,
 *           ownerAddress,
 *           price: D/N
 *           N,
 *           D,
 *           assetId,
 *           version
 *         } = cellData.metadata
 *       }
 *
 *       order: {
 *         // Order
 *         type: 'buy',
 *         amount: '',
 *         total: '0',
 *         execution: 'maker' | 'taker' | 'market'
 *         asset: {
 *           id: 123124124,
 *           decimals: 10,
 *         }
 *         // Price
 *         price: this.D/this.N,
 *         N: 1223
 *         D: 1232
 *
 *         // Wallets
 *         to: wallet addr string || escrow addr string
 *         from: wallet addr string || escrow addr string
 *         contract:{lsig, entry, }
 *       },
 *       wallet: {
 *         address: "123123123213"
 *         algo: {
 *           balance: 12312312
 *         },
 *         assets: {
 *           123124124: {
 *             balance: 123123213
 *           }
 *         }
 *       }
 */

/**
 * @todo: Replace other functions with this
 * @todo: Accept standard Order Object
 * @todo: Accept Params
 * @todo: Accept Wallet
 * @param algodClient
 * @param isSellingASA
 * @param assetId
 * @param userWalletAddr
 * @param limitPrice
 * @param orderAssetAmount
 * @param orderAlgoAmount
 * @param allOrderBookOrders
 * @param includeMaker
 * @param walletConnector
 * @return {Promise<Array<OuterTxn>>}
 */

async function structure(client, state) {
  if (!(client instanceof algosdk.Algodv2)) throw new TypeError('Must have valid algod client!!!');
  if (typeof state?.contract?.lsig === 'undefined') throw new TypeError('Must have valid lsig!!!');

  switch (state.execution) {
    case 'maker':
      state.type === 'buy'
        ?
        withPlaceAlgoOrderTxns(state)
        :
        withPlaceAssetOrderTxns(state)
      break;
    
    case 'taker':
      state.type === 'buy'
        ?
        withExecuteAlgoOrderTxns(state)
        :
        withExecuteAssetOrderTxns(state)
      break
    
    case 'cancel': 
      state.type === 'algo' 
        ?
        withCloseAlgoOrderTxns(state)
        :
        withCloseAssetOrderTxns(state)
      break   
  }
}


module.exports = structure;
