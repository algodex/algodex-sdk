/**
 * # Compile
 *
 * Library for Compiling Smart Contracts. Includes three main exports
 *
 * - [withLogicSigAccount](#.withLogicSigAccount)
 * - [withOrderBookEntry](#.withOrderbookEntry)
 * - [withUnits](#withUnits)
 *
 * @example
 * const compile = require('@algodex/algodex-sdk/lib/compile')
 * await compile({
 *   // Standard {@link Order} Shape
 * })
 *
 * @example
 * const {withUnits} = require('@algodex/algodex-sdk/lib/compile');
 * withUnits({
 *   // Standard {@link Order} Shape
 * })
 *
 * @module order/compile
 **/

const compile = require('./compile');
compile.withLogicSigAccount = require('./withLogicSigAccount.js');
compile.withOrderbookEntry= require('./withOrderbookEntry.js');
compile.withUnits = require('./withUnits');
module.exports = compile;
