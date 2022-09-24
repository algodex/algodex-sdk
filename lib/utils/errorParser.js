/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


const errorParser = {
  getAssetId: (errorMessage) => {
    const start = errorMessage.search('ForeignAssets') + 15;
    if (start === -1) return 'NA';
    const end = start + 8;
    return Number(errorMessage.slice(start, end));
  },
  getAppId: (errorMessage) => {
    return errorMessage.search('22045522') !== -1 ? 22045522 : errorMessage.search('22045503') ? 22045503: 0;
  },

  processError: (error) => {
    return {
      error: error,
      assetId: errorParser.getAssetId(error.message),
      appId: errorParser.getAppId(error.message),

    };
  },
  findEdgeCase: (error, txnGroupArr, sentTxnGroupArr) => {
    const {assetId, appId} = errorParser.processError(error);
    const waveTakerOrderEdgeCase = assetId === 22060777 && appId === 22045522 && (txnGroupArr.length === 6 && sentTxnGroupArr.length === 5);

    return waveTakerOrderEdgeCase;
    // simple solution for single edgecase but can be modified to search for a variety of edgecases depending on how far we want to take it
  },

};

module.exports = errorParser;
