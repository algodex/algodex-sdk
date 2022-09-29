/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
