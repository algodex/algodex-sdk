/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const addKeywords = require('ajv-keywords');
const instanceofDef = require('ajv-keywords/dist/definitions/instanceof');
instanceofDef.CONSTRUCTORS.Algodv2 = algosdk.Algodv2;
instanceofDef.CONSTRUCTORS.Indexer = algosdk.Indexer;
instanceofDef.CONSTRUCTORS.Ajv = Ajv;
let ajv;

/**
 *
 * @return {Ajv}
 */
function makeAjv() {
  if (!(ajv instanceof Ajv)) {
    ajv = new Ajv(/* {allErrors: true}*/);
    addFormats(ajv);
    addKeywords(ajv);
    // Define Schemas
    // TODO: Host schemas to remove them from the bundle
    const schemas = {
      'URI': require('../spec/URI.js'),
      'Config': require('../spec/Config.js'),
      'APIProperties': require('../spec/APIProperties.js'),
      'Asset': require('../spec/Asset.js'),
      'Wallet': require('../spec/Wallet.js'),
      'Addresses': require('../spec/Addresses.js'),
      'Transaction': require('../spec/Transaction'),
    };
    // Add Schemas to AJV
    Object.keys(schemas).forEach((key) => {
      ajv.addSchema(schemas[key], key);
    });
  }
  return ajv;
}
module.exports = makeAjv();
