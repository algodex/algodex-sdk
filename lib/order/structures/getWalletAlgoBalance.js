/* eslint-disable max-len */

/**
 * ## ✉ withCheckWalletAlgoBalance
 * Validates and returns algoWalletAmount associated
 * with an account
 *
 * @param {Account} accountInfo Algorand Account
 * @param {Number} minBalance Minimum balance
 * @return {Boolean} whether algoAmount meets the requirement
 * @memberOf module:order/structures
 */
function withGetWalletAlgoBalance(accountInfo, minBalance= 0) {
    if (accountInfo.amount === undefined) throw new Error('Invalid Acct Object: Missing amount property');

    if (typeof minBalance !== 'number') throw new TypeError('Invalid Type: minBalance is not a number');

    const walletAlgoAmount = accountInfo['amount'] - minBalance - (0.004 * 1000000);

    if (walletAlgoAmount <= minBalance) throw new Error('Insufficient Balance');
    return walletAlgoAmount;

}

module.exports = withGetWalletAlgoBalance;
