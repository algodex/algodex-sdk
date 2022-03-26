/**
 * @typedef import('algosdk').LogicSigAccount
 */
/**
 * @typedef {Array<>} OrderContractTxns
 */

/**
 * @typedef {Object} OrderContract
 * @property {OrderContractTxns} txns Txns array
 * @property {LogicSigAccount} lsig Lsig instance
 * @property {string} source Contract String
 */

/**
 * @typedef {Object} WithContract
 * @property {OrderContract} contract
 */

/**
 * @typedef {Order & WithContract} OrderWithTxns
 */
