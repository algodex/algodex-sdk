const getTakerTxns = require('./getTakerTxns');
const makePlaceAlgoOrderTxns = require('../txns/buy/makePlaceAlgoTxns');
const makePlaceAssetOrderTxns = require('../txns/sell/makeExecuteAssetTxns')
const compile = require('../compile/compile');

async function getMakerTakerTxns(api, order) {

    let outerTxns;
    let compiledAsMaker


    const _takerOrder = await getTakerTxns(api, order);
    const takerTxns = _takerOrder?.takerOrderBalance?.allTransList;

    const potentialScenarios = ["undefinedTaker", "emptyTaker", "makerTaker",]

    const scenario = typeof takerTxns === 'undefined' ?
        potentialScenarios[0] :
        takerTxns.length === 0 ?
            potentialScenarios[1] :
            takerTxns.length > 0 ?
                potentialScenarios[2] : "None Applicable"


    switch (scenario) {
        case "undefinedTaker":
            delete order.contract //Ask Michael whether or not he prefers to copy order before deleting contract
            compiledAsMaker = await compile({ ...order, execution: "maker" })


            outerTxns = order.type === 'buy' ?
                await makePlaceAlgoOrderTxns(compiledAsMaker) :
                await makePlaceAssetOrderTxns(compiledAsMaker)
            break

        case "emptyTaker":
            delete order.contract
            compiledAsMaker = await compile({
                ...order,
                execution: "maker"
            })
            outerTxns = order.type === 'buy' ?
                await makePlaceAlgoOrderTxns(compiledAsMaker) :
                await makePlaceAssetOrderTxns(compiledAsMaker)
            break

        case "makerTaker":

            // TODO: Extend to sell side
            const { groupNum, txOrderNum } = _takerOrder.takerOrderBalance.currentOrderValues;

            const leftOverMakerOrder = {
                ...order,
                execution: 'maker',
                appId: 22045503, // Note: Test order for buy has ASA appID, need to switch to AlgoAppId for makers
                total: _takerOrder.takerOrderBalance.algoBalance,
            };
            delete leftOverMakerOrder.contract;
            compiledAsMaker = await compile(leftOverMakerOrder);
            const leftOverMakerTxns = await makePlaceAlgoOrderTxns(compiledLeftOverOrder);
            const groupedMakerTxns = leftOverMakerTxns.map((txn, i) => {
                return { ...txn, groupNum: groupNum, txOrderNum: i + txOrderNum };
            });

            outerTxns = takerTxns.concat(groupedMakerTxns)
            break
        default:
            throw new TypeError('improperly formatted order.');
    }

    return outerTxns
}


module.exports = getMakerTakerTxns;
