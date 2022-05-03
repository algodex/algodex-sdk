/* eslint-disable max-len */

/**
 * ## ✉ withStructureSingleTransListWithGroupOrder
 * takes a queued order object and returns a new object that has cutOrdertTimes
 * logic if needed
 *
 * @todo Remove mutations to allTransList and return a new array
 * @param {Array} singleOrderTransList Array of cut transactions
 * @param {Array} allTransList Array of all transactions
 * @param {Number} txOrderNum Object Of Order And Wallet amounts
 * @param {Number} groupNum Object Of Order And Wallet amounts
 *
 * @return {Number} returns number to persist txOrderNum for outerloop
 * @memberOf module:order/structures
 */
function getTxnOrderNumber(singleOrderTransList, allTransList, txOrderNum, groupNum) {
  if (!Array.isArray(singleOrderTransList) || !Array.isArray(allTransList)) throw new TypeError('TransLists must be arrays');
  if (singleOrderTransList.length < 1) throw new Error('singleOrderTransList must not be empty');
  for (let k = 0; k < singleOrderTransList.length; k++) {
    const trans = singleOrderTransList[k];
    trans['txOrderNum'] = txOrderNum;
    trans['groupNum'] = groupNum;
    txOrderNum++;
    allTransList.push(trans); // perhaps not the best practice but works well with the for loop
  }
  return txOrderNum;
}


module.exports = getTxnOrderNumber;


