/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const http = require('http');
const algosdk = require('algosdk');

let MyAlgo = null;

if (typeof window != 'undefined') {
    MyAlgo = require('@randlabs/myalgo-connect');
}

const myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
require('./algo_delegate_template_teal.js');
require('./ASA_delegate_template_teal.js');
//require('./dex_teal.js');

const dexInternal = require('./algodex_internal_api.js');

if (MyAlgo != null) {
    myAlgoWallet = new MyAlgo();
    console.log("printing my algo wallet");
    console.log(myAlgoWallet)
}

const constants = require('./constants.js');

let ALGO_ESCROW_ORDER_BOOK_ID = -1;
let ASA_ESCROW_ORDER_BOOK_ID = -1;

const AlgodexApi = {

    doAlert : function doAlert() {
        alert(1);
        console.log("api call!!!");
    },
	getConstants : () => {
			return constants;
	},
	
    allSettled : function(promises) {
        let wrappedPromises = promises.map(p => Promise.resolve(p)
            .then(
                val => ({ status: 'promiseFulfilled', value: val }),
                err => ({ status: 'promiseRejected', reason: err })));
        return Promise.all(wrappedPromises);
    },

    initSmartContracts : function(environment) {
        if (environment == "local") {
            ALGO_ESCROW_ORDER_BOOK_ID = constants.LOCAL_ALGO_ORDERBOOK_APPID;
            ASA_ESCROW_ORDER_BOOK_ID = constants.LOCAL_ASA_ORDERBOOK_APPID;
        } else if (environment == "test") {
            ALGO_ESCROW_ORDER_BOOK_ID = constants.TEST_ALGO_ORDERBOOK_APPID;
            ASA_ESCROW_ORDER_BOOK_ID = constants.TEST_ASA_ORDERBOOK_APPID;
        } else if (environment == "production") {
            ALGO_ESCROW_ORDER_BOOK_ID = constants.PROD_ALGO_ORDERBOOK_APPID;
            ASA_ESCROW_ORDER_BOOK_ID = constants.PROD_ASA_ORDERBOOK_APPID;
        } else {
            throw "environment must be local, test, or production";
        }

        dexInternal.initSmartContracts(ALGO_ESCROW_ORDER_BOOK_ID, ASA_ESCROW_ORDER_BOOK_ID);

    },
    
    //Options are: local, test, production
    initIndexer : function(environment) {
        let server = null;
        let port = null;
        let token = null;

        this.initSmartContracts(environment);

        if (environment == "local") {
            server = constants.LOCAL_INDEXER_SERVER;
            port =   constants.LOCAL_INDEXER_PORT;
            token =  constants.LOCAL_INDEXER_TOKEN;
        } else if (environment == "test") {
            server = constants.TEST_INDEXER_SERVER;
            port =   constants.TEST_INDEXER_PORT;
            token =  constants.TEST_INDEXER_TOKEN;
        } else if (environment == "production") {
            server = constants.PROD_INDEXER_SERVER;
            port =   constants.PROD_INDEXER_PORT;
            token =  constants.PROD_INDEXER_TOKEN;
        } else {
            throw "environment must be local, test, or production";
        }

        const indexerClient = new algosdk.Indexer(token, server, port);
        return indexerClient;
    },

    //local, test, production
    initAlgodClient : function(environment) {
        let server = null;
        let port = null;
        let token = null;

        this.initSmartContracts(environment);

        if (environment == "local") {
            server = constants.LOCAL_ALGOD_SERVER;
            port =   constants.LOCAL_ALGOD_PORT;
            token =  constants.LOCAL_ALGOD_TOKEN;
        } else if (environment == "test") {
            server = constants.TEST_ALGOD_SERVER;
            port =   constants.TEST_ALGOD_PORT;
            token =  constants.TEST_ALGOD_TOKEN;
        } else if (environment == "production") {
            server = constants.PROD_ALGOD_SERVER;
            port =   constants.PROD_ALGOD_PORT;
            token =  constants.PROD_ALGOD_TOKEN;
        } else {
            throw "environment must be local, test, or production";
        }

        const algodClient = new algosdk.Algodv2(token, server, port);
        return algodClient;
    },


    // Check the status of pending transactions
    checkPending : async function(algodClient, txid, numRoundTimeout) {
        return dexInternal.checkPending(algodClient, txid, numRoundTimeout);
    },

    // Wait for a transaction to be confirmed
    waitForConfirmation : async function(algodClient, txId) {
        return dexInternal.waitForConfirmation(algodClient, txId);
    },

    dumpVar : function dumpVar(x) {
        return dexInternal.dumpVar(x);
    },

    getNumeratorAndDenominatorFromPrice : function getNumeratorAndDenominatorFromPrice(limitPrice) {
        let countDecimals = function (limitPrice) {
            if(Math.floor(limitPrice) === limitPrice) return 0;
            return limitPrice.toString().split(".")[1].length || 0; 
        }

        const origDecCount = countDecimals(limitPrice);
        let d = 10**origDecCount * limitPrice;
        let n = 10**origDecCount;

        d = Math.floor(d);
        n = Math.floor(n);
        
        return {
            n: n,
            d: d
        }
    },
    createOrderBookEntryObj : function createOrderBookEntryObj (blockChainOrderVal, price, n, d, min, escrowAddr, 
                                            algoBalance, asaBalance, escrowOrderType, isASAEscrow, orderCreatorAddr, assetId) {
        const orderEntry = 
            {
                orderEntry: blockChainOrderVal, // this should match what's in the blockchain
                price: price, // d/n
                n: n,
                d: d,
                min: min,
                escrowAddr: escrowAddr,
                algoBalance: algoBalance,
                asaBalance: asaBalance,
                escrowOrderType: escrowOrderType,
                isASAEscrow: isASAEscrow,
                orderCreatorAddr: orderCreatorAddr,
                assetId: assetId
            };
        return orderEntry;
    },

    executeOrder : async function executeOrder (algodClient, isSellingASA_AsTakerOrder, assetId, 
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker) {

        console.log("in executeOrderClickz");
        let queuedOrders = dexInternal.getQueuedTakerOrders(takerWalletAddr, isSellingASA_AsTakerOrder, allOrderBookOrders);
        let allTransList = [];
        let transNeededUserSigList = [];
        
        let execAccountInfo = await this.getAccountInfo(takerWalletAddr);
        let alreadyOptedIn = false;
        console.log("herezz56");
        console.log({execAccountInfo});

        let takerMinBalance = 0;

        takerMinBalance += 100000 * (execAccountInfo['created-apps'].length); // Apps
        takerMinBalance += (25000+3500) * execAccountInfo['apps-total-schema']['num-uint']; // Total Ints
        takerMinBalance += (25000+25000) * execAccountInfo['apps-total-schema']['num-byte-slice']; // Total Bytes
        takerMinBalance += execAccountInfo['assets'].length * 100000;
        takerMinBalance += 1000000;

        console.log({min_bal: takerMinBalance});

        let walletAssetAmount = 0;
        const walletAlgoAmount = execAccountInfo['amount'] - takerMinBalance - (0.004 * 1000000);
        if (walletAlgoAmount <= 0) {
            console.log("not enough to trade!! returning early");
            return;
        }

        if (execAccountInfo != null && execAccountInfo['assets'] != null
            && execAccountInfo['assets'].length > 0) {
            for (let i = 0; i < execAccountInfo['assets'].length; i++) {
                let asset = execAccountInfo['assets'][i];
                if (asset['asset-id'] == assetId) {
                    walletAssetAmount = asset['amount']
                    break;
                    //console.log("execAccountInfo: " + execAccountInfo);
                }
            }
        }

        orderAssetAmount = Math.max(1, orderAssetAmount);
        orderAlgoAmount = Math.max(1, orderAlgoAmount);

        if (isSellingASA_AsTakerOrder) {
            // we are selling an ASA so check wallet balance
            orderAssetBalance = Math.min(orderAssetAmount, walletAssetAmount);
        } else {
            // wallet ASA balance doesn't matter since we are selling algos
            orderAssetBalance = orderAssetAmount;
        }

        if (!isSellingASA_AsTakerOrder) {
            //we are buying with algos. so check algo balance
            orderAlgoBalance = Math.min(orderAlgoAmount, walletAlgoAmount);
        } else {
            // wallet balance doesn't matter since we are selling an ASA
            orderAlgoBalance = orderAlgoAmount;
        }

        const takerOrderBalance = {
            'asaBalance': orderAssetBalance,
            'algoBalance': orderAlgoBalance,
            'walletAlgoBalance': walletAlgoAmount,
            'walletASABalance': walletAssetAmount,
            'limitPrice': limitPrice,
            'takerAddr': takerWalletAddr,
            'walletMinBalance': takerMinBalance
        };

        console.log("initial taker orderbalance: ", this.dumpVar(takerOrderBalance));

        //let walletBalance = 10; // wallet balance
        //let walletASABalance = 15;
        if (queuedOrders == null && !includeMaker) {
            console.log("null queued orders, returning early");
            return;
        }
        if (queuedOrders == null) {
            queuedOrders = [];
        }
        let txOrderNum = 0;
        let groupNum = 0;
        let txnFee = 0.004 * 1000000 //FIXME minimum fee;

        //console.log("queued orders: ", this.dumpVar(queuedOrders));

        for (let i = 0; i < queuedOrders.length; i++) {
            if (takerOrderBalance['orderAlgoAmount'] <= txnFee) {
                // Overspending issues
                continue;
            }

            if (isSellingASA_AsTakerOrder && parseFloat(takerOrderBalance['limitPrice']) > queuedOrders[i]['price']) {
                //buyer & seller prices don't match
                continue;
            }
            if (!isSellingASA_AsTakerOrder && parseFloat(takerOrderBalance['limitPrice']) < queuedOrders[i]['price']) {
                //buyer & seller prices don't match
                continue;
            }
            let singleOrderTransList = 
                await dexInternal.getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient, 
                    queuedOrders[i], takerOrderBalance);

            if (singleOrderTransList == null) {
                // Overspending issue
                continue;
            }

            for (let k = 0; k < singleOrderTransList.length; k++) {
                let trans = singleOrderTransList[k];
                trans['txOrderNum'] = txOrderNum;
                trans['groupNum'] = groupNum;
                txOrderNum++;
                allTransList.push(trans);
                if (trans['needsUserSig'] === true) {
                    transNeededUserSigList.push(trans);
                }
            }
            groupNum++;
           
        }

        let makerTxns = null;
        console.log('here55999a');
        if (includeMaker) {
            const numAndDenom = this.getNumeratorAndDenominatorFromPrice(limitPrice);
            let leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
            let leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
            console.log("includeMaker is true");
            if (isSellingASA_AsTakerOrder && leftoverASABalance > 0) {
                console.log("leftover ASA balance is: " + leftoverASABalance);

                makerTxns = await this.getPlaceASAToSellASAOrderIntoOrderbook(algodClient, 
                    takerWalletAddr, numAndDenom.n, numAndDenom.d, 0, assetId, leftoverASABalance, false);

            } else if (!isSellingASA_AsTakerOrder && leftoverAlgoBalance > 0) {
                console.log("leftover Algo balance is: " + leftoverASABalance);

                makerTxns = await this.getPlaceAlgosToBuyASAOrderIntoOrderbook(algodClient,
                    takerWalletAddr, numAndDenom.n, numAndDenom.d, 0, assetId, leftoverAlgoBalance, false);            
            }
        }

        if (makerTxns != null) {
            for (let k = 0; k < makerTxns.length; k++) {
                let trans = makerTxns[k];
                trans['txOrderNum'] = txOrderNum;
                trans['groupNum'] = groupNum;
                txOrderNum++;
                allTransList.push(trans);
                if (trans['needsUserSig'] === true) {
                    transNeededUserSigList.push(trans);
                }

                if (typeof(trans.lsig) !== 'undefined') {
                    let signedTxn = algosdk.signLogicSigTransactionObject(trans.unsignedTxn, trans.lsig);
                    trans.signedTxn = signedTxn.blob;
                } 
            }
            groupNum++;
        }

        if (allTransList == null || allTransList.length == 0) {
            console.log("no transactions, returning early");
        }

        let txnsForSigning = [];
        for (let i = 0; i < transNeededUserSigList.length; i++) {
            txnsForSigning.push(transNeededUserSigList[i]['unsignedTxn']);
        }

        console.log("here 8899b signing!!");
        if (txnsForSigning == null || txnsForSigning.length == 0) {
            return;
        }
        let signedTxns =  await myAlgoWallet.signTransaction(txnsForSigning);
        
        if (!Array.isArray(signedTxns)) {
            signedTxns = [signedTxns];
        }

        for (let i = 0; i < transNeededUserSigList.length; i++) {
            transNeededUserSigList[i]['signedTxn'] = signedTxns[i].blob;
        }
        signedTxns = [];
        let sentTxns = [];

        let lastGroupNum = -1;
        for (let i = 0; i < allTransList.length; i++) {  // loop to end of array 
            if (lastGroupNum != allTransList[i]['groupNum']) {
                // If at beginning of new group, send last batch of transactions
                if (signedTxns.length > 0) {
                    try {
                        this.printTransactionDebug(signedTxns);
                        let txn = await algodClient.sendRawTransaction(signedTxns).do();
                        sentTxns.push(txn.txId);
                        console.log("sent: " + txn.txId);
                    }  catch (e) {
                        console.log(e);
                    }
                }
                // send batch of grouped transactions
                signedTxns = [];
                lastGroupNum = allTransList[i]['groupNum'];
            }

            signedTxns.push(allTransList[i]['signedTxn']);
            
            if (i == allTransList.length - 1) {
                // If at end of list send last batch of transactions
                if (signedTxns.length > 0) {
                    try {
                        this.printTransactionDebug(signedTxns);
                        const DO_SEND = true;
                        if (DO_SEND) {
                            let txn = await algodClient.sendRawTransaction(signedTxns).do();
                            sentTxns.push(txn.txId);
                            console.log("sent: " + txn.txId);
                        } else {
                            console.log("skipping sending for debugging reasons!!!");
                        }
                    }  catch (e) {
                        console.log(e);
                    }
                }
                break;
            }

        }

        console.log("going to wait for confirmations");

        let waitConfirmedPromises = [];

        for (let i = 0; i < sentTxns.length; i++) {
            console.log("creating promise to wait for: " + sentTxns[i]);
            const confirmPromise = this.waitForConfirmation(algodClient, sentTxns[i]);
            waitConfirmedPromises.push(confirmPromise);
        }

        console.log("final9 trans are: " );
        // console.log(alTransList);
        // console.log(transNeededUserSigList);
        
        console.log("going to send all ");
        
        let confirmedTransactions = await this.allSettled(waitConfirmedPromises);

        let transResults = JSON.stringify(confirmedTransactions, null, 2); 
        console.log("trans results after confirmed are: " );
        console.log(transResults);

       // await this.waitForConfirmation(algodClient, txn.txId);
        return;
    },

    closeOrderFromOrderBookEntry : async function closeOrderFromOrderBookEntry(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry) {
            let valSplit = orderBookEntry.split("-");
            console.log("closing order from order book entry!");
            console.log("escrowAccountAddr, creatorAddr, orderBookEntry", 
                escrowAccountAddr, creatorAddr, orderBookEntry);

            let n = valSplit[0];
            let d = valSplit[1];
            let min = valSplit[2];
            let assetid = valSplit[3];
            let appArgs = [];
            let enc = new TextEncoder();
            appArgs.push(enc.encode("close"));
            appArgs.push(enc.encode(orderBookEntry));
            appArgs.push(enc.encode(creatorAddr));
            console.log("args length: " + appArgs.length);
            let accountInfo = await this.getAccountInfo(escrowAccountAddr);
            let assetId = null;
            if (accountInfo != null && accountInfo['assets'] != null
                && accountInfo['assets'].length > 0 && accountInfo['assets'][0] != null) {
                // check if escrow has an assetId in the blockchain
                assetId = accountInfo['assets'][0]['asset-id']; 
            }
            const isAsaOrder = (assetId != null);

            let escrowSource = this.buildDelegateTemplateFromArgs(min,assetid,n,d,creatorAddr, isAsaOrder);
            let lsig = await dexInternal.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
            console.log("lsig is: " + lsig.address());            
            if (assetId == null) {
                console.log("closing order");
                await dexInternal.closeOrder(algodClient, escrowAccountAddr, creatorAddr, ALGO_ESCROW_ORDER_BOOK_ID, appArgs, lsig);
            } else {
                console.log("closing ASA order");
                await dexInternal.closeASAOrder(algodClient, escrowAccountAddr, creatorAddr, ASA_ESCROW_ORDER_BOOK_ID, appArgs, lsig, assetId);
            }
    },

    assignGroups: function assignGroups (txns) {
        const groupID = algosdk.computeGroupID(txns)
        for (let i = 0; i < txns.length; i++) {
            txns[i].group = groupID;
        }
    },

    signAndSendTransactions :
        async function signAndSendTransactions(algodClient, outerTxns) {
            console.log("inside signAndSend transactions");
            let txnsForSig = [];
            let txns = [];

            for (let i = 0; i < outerTxns.length; i++) {
                txns.push(outerTxns[i].unsignedTxn);
                if (outerTxns[i].needsUserSig == true) {
                    txnsForSig.push(outerTxns[i].unsignedTxn);
                }
            }

            let signedTxnsFromUser =  await myAlgoWallet.signTransaction(txnsForSig);

            if (Array.isArray(signedTxnsFromUser)) {
                let userSigIndex = 0;
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser[userSigIndex].blob;
                        userSigIndex++;
                    }
                }
            } else {
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser.blob;
                        break;
                    }
                }
            }
            
            for (let i = 0; i < outerTxns.length; i++) {
                if (!outerTxns[i].needsUserSig) {
                    let signedLsig = await algosdk.signLogicSigTransactionObject(outerTxns[i].unsignedTxn, outerTxns[i].lsig);
                    outerTxns[i].signedTxn = signedLsig.blob;
                }
            }

            let signed = [];

            for (let i = 0; i < outerTxns.length; i++) {
                signed.push(outerTxns[i].signedTxn);
            }
            console.log("printing transaction debug");
            this.printTransactionDebug(signed);

            const groupTxn = await algodClient.sendRawTransaction(signed).do()
            return this.waitForConfirmation(algodClient, groupTxn.txId)
    },

    getPlaceAlgosToBuyASAOrderIntoOrderbook : async function 
        getPlaceAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, signAndSend) {

        console.log("placeAlgosToBuyASAOrderIntoOrderbook makerWalletAddr, n, d, min, assetId",
            makerWalletAddr, n, d, min, assetId);
        let program = this.buildDelegateTemplateFromArgs(min, assetId, n, d, makerWalletAddr, false);

        let lsig = await this.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
        let generatedOrderEntry = dexInternal.generateOrder(makerWalletAddr, n, d, min, assetId);
        console.log("address is: " + lsig.address());
        console.log("here111 generatedOrderEntry " + generatedOrderEntry);
        // check if the lsig has already opted in
        let alreadyOptedIntoOrderbook = false;
        
        let makerAccountInfo = await this.getAccountInfo(makerWalletAddr);
        let makerAlreadyOptedIntoASA = false;
        if (makerAccountInfo != null && makerAccountInfo['assets'] != null
            && makerAccountInfo['assets'].length > 0) {
            for (let i = 0; i < makerAccountInfo['assets'].length; i++) {
                if (makerAccountInfo['assets'][i]['asset-id'] === assetId) {
                    makerAlreadyOptedIntoASA = true;
                    break;
                }
            }
        }

        let escrowAccountInfo = await this.getAccountInfo(lsig.address());

        if (escrowAccountInfo != null && escrowAccountInfo['apps-local-state'] != null
                && escrowAccountInfo['apps-local-state'].length > 0
                && escrowAccountInfo['apps-local-state'][0].id == ALGO_ESCROW_ORDER_BOOK_ID) {
            alreadyOptedIntoOrderbook = true;
        }

        console.log({makerAlreadyOptedIntoASA});
        console.log({alreadyOptedIntoOrderbook});

        if (alreadyOptedIntoOrderbook == false && algoOrderSize < constants.MIN_ASA_ESCROW_BALANCE) {
            algoOrderSize = constants.MIN_ASA_ESCROW_BALANCE;
        }
        console.log("alreadyOptedIn: " + alreadyOptedIntoOrderbook);
        console.log("acct info:" + JSON.stringify(escrowAccountInfo));

        let params = await algodClient.getTransactionParams().do();
        console.log("sending trans to: " + lsig.address());
        let txn = {
            type: 'pay',
            from: makerWalletAddr,
            to:  lsig.address(),
            amount: parseInt(algoOrderSize), // the order size that gets stored into the contract account
            firstRound: params.firstRound,
            lastRound: params.lastRound,
            genesisHash: "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
            genesisID: "testnet-v1.0"
        };

        let outerTxns = [];

        outerTxns.push({
            unsignedTxn: txn,
            needsUserSig: true
        });

        myAlgoWalletUtil.setTransactionFee(txn);

        console.log("here3 calling app from logic sig to open order");
        let appArgs = [];
        var enc = new TextEncoder();
        appArgs.push(enc.encode("open"));
        console.log("before slice: " + generatedOrderEntry);
        console.log(generatedOrderEntry.slice(59));
        console.log("after slice: " + generatedOrderEntry.slice(59));

        appArgs.push(enc.encode(generatedOrderEntry.slice(59)));

        appArgs.push(algosdk.decodeAddress(makerWalletAddr).publicKey);

        //console.log("owners bit addr: " + ownersBitAddr);
        console.log("herezzz_888");
        console.log(appArgs.length);
        let logSigTrans = null;

        if (!alreadyOptedIntoOrderbook) {
            logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig, ALGO_ESCROW_ORDER_BOOK_ID, appArgs, "appOptIn");
            outerTxns.push({
                unsignedTxn: logSigTrans,
                needsUserSig: false,
                lsig: lsig
            });
        }
        // asset opt-in transfer
        let assetOptInTxn = null;

        if (!makerAlreadyOptedIntoASA) {
            assetOptInTxn = {
                type: "axfer",
                from: makerWalletAddr,
                to: makerWalletAddr,
                amount: 0,
                assetIndex: assetId,
                ...params
            };
            outerTxns.push({
                unsignedTxn: assetOptInTxn,
                needsUserSig: true
            });
        }
        
        if (signAndSend) {
            return await this.signAndSendTransactions(algodClient, outerTxns);
        }

        unsignedTxns = [];
        for (let i = 0; i < outerTxns.length; i++) {
            unsignedTxns.push(outerTxns[i].unsignedTxn);
        }
        this.assignGroups(unsignedTxns);
        return outerTxns;
    },

    getPlaceASAToSellASAOrderIntoOrderbook : 
        async function getPlaceASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, signAndSend) {

        console.log("checking assetId type");
        assetId = parseInt(assetId+"");

        let outerTxns = [];

        let program = this.buildDelegateTemplateFromArgs(min, assetId, n, d, makerWalletAddr, true);

        let lsig = await this.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
        let generatedOrderEntry = dexInternal.generateOrder(makerWalletAddr, n, d, min, assetId);
        console.log("address is: " + lsig.address());
        
        // check if the lsig has already opted in
        let accountInfo = await this.getAccountInfo(lsig.address());
        let alreadyOptedIn = false;
        if (accountInfo != null && accountInfo['apps-local-state'] != null
                && accountInfo['apps-local-state'].length > 0
                && accountInfo['apps-local-state'][0].id == ASA_ESCROW_ORDER_BOOK_ID) {
            alreadyOptedIn = true;
        }
        console.log("alreadyOptedIn: " + alreadyOptedIn);
        console.log("acct info:" + JSON.stringify(accountInfo));

        let params = await algodClient.getTransactionParams().do();
        console.log("sending trans to: " + lsig.address());

        let assetSendTrans = await algodClient.getTransactionParams().do();

        assetSendTrans = {
            ...assetSendTrans,
            fee: 1000,
            flatFee: true,
            type: 'axfer',
            assetIndex: assetId,
            from: makerWalletAddr,
            to:  lsig.address(),
            amount: assetAmount
        };


        console.log("herez88888 ", this.dumpVar(assetSendTrans));

        if (alreadyOptedIn) {
            outerTxns.push({
                unsignedTxn: assetSendTrans,
                needsUserSig: true
            });
            if (signAndSend) {
                return await this.signAndSendTransactions(algodClient, outerTxns);
            } else {
                return outerTxns;
            }
        }

        let payTxn = {
            type: 'pay',
            from: makerWalletAddr,
            to:  lsig.address(),
            amount: constants.MIN_ASA_ESCROW_BALANCE, //fund with enough to subtract from later
            firstRound: params.firstRound,
            lastRound: params.lastRound,
            genesisHash: "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
            genesisID: "testnet-v1.0"
        };
        myAlgoWalletUtil.setTransactionFee(payTxn);

        console.log("typeof: " + typeof payTxn.txId);
        console.log("the val: " + payTxn.txId);

        let payTxId = payTxn.txId;
        //console.log("confirmed!!");
        // create unsigned transaction

        console.log("here3 calling app from logic sig to open order");
        let appArgs = [];
        var enc = new TextEncoder();
        appArgs.push(enc.encode("open"));
        console.log("before slice: " + generatedOrderEntry);
        console.log(generatedOrderEntry.slice(59));
        console.log("after slice: " + generatedOrderEntry.slice(59));

        appArgs.push(enc.encode(generatedOrderEntry.slice(59)));

        // add owners address as arg
        //ownersAddr = "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI";
        //ownersBitAddr = (algosdk.decodeAddress(ownersAddr)).publicKey;
        appArgs.push(enc.encode(makerWalletAddr));
        console.log(appArgs.length);

        let logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig, ASA_ESCROW_ORDER_BOOK_ID, 
                    appArgs, "appOptIn");

        // create optin transaction
        // sender and receiver are both the same
        let sender = lsig.address();
        let recipient = sender;
        // We set revocationTarget to undefined as 
        // This is not a clawback operation
        let revocationTarget = undefined;
        // CloseReaminerTo is set to undefined as
        // we are not closing out an asset
        let closeRemainderTo = undefined;
        // We are sending 0 assets
        let amount = 0;

        // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
        let logSigAssetOptInTrans = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, 
            revocationTarget,
            amount, undefined, assetId, params);

        outerTxns.push({
            unsignedTxn: payTxn,
            needsUserSig: true
        });
        outerTxns.push({
            unsignedTxn: logSigTrans,
            needsUserSig: false,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: logSigAssetOptInTrans,
            needsUserSig: false,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: assetSendTrans,
            needsUserSig: true
        });

        if (signAndSend) {
            return await this.signAndSendTransactions(algodClient, outerTxns);
        }
        unsignedTxns = [];
        for (let i = 0; i < outerTxns.length; i++) {
            unsignedTxns.push(outerTxns[i].unsignedTxn);
        }
        this.assignGroups(unsignedTxns);

        return outerTxns;
    },

/////////////////////////////////
// INTERNAL PASS-THRU FUNCTIONS /
/////////////////////////////////

    printTransactionDebug : function printTransactionDebug(signedTxns) {
        return dexInternal.printTransactionDebug(signedTxns);
    },

    buildDelegateTemplateFromArgs : function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow) {
        return dexInternal.buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow);
    },

    getLsigFromProgramSource : async function getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource) {
        return await dexInternal.getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource);
    },

    getAccountInfo : async function getAccountInfo(accountAddr) {
        return dexInternal.getAccountInfo(accountAddr);
    },


};

module.exports = AlgodexApi;
