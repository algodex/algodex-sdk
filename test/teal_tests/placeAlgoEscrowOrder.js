const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');

const PRINT_TXNS = 0;

const Test = {
    runTest : async function (config, algoAmount, price, skipASAOptIn = false, returnOuterTransactions = false) {
        console.log("STARTING placeAlgoEscrowOrder test");
        const client = config.client;
        const creatorAccount = config.creatorAccount;
        const appId = config.appId;

        let outerTxns = await transactionGenerator.getPlaceAlgoEscrowOrderTxns(client, creatorAccount, algoAmount, price, 
                config.assetId, appId, false, skipASAOptIn);
        
        if (returnOuterTransactions) {
            return outerTxns;
        }

        let signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);

        return true;
    },


    runGroupSizeWrongTest : async function (config, skipASAOptIn = false) {
        const outerTxns = await this.runTest(config, 800000, 1.375, skipASAOptIn, true);
        const client = config.client;
        const maliciousAccount = config.maliciousAccount;

        if (PRINT_TXNS) {
            testHelper.printOuterTransactions(outerTxns);
        }

        const lsig = outerTxns[1].lsig;

        outerTxns.push( {
            unsignedTxn: await transactionGenerator.getPayTxn(client, lsig.address(), maliciousAccount.addr,
                1000, false),
            lsig: lsig
        });

        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
        try {
            await testHelper.sendAndCheckConfirmed(client, signedTxns);
        } catch (e) {
            // An exception is expected. Return true for success
            return testHelper.checkFailureType(e);
        }

        return false;
    },

    runGroupSizeWrongTest2 : async function (config, skipASAOptIn = false) {
        const outerTxns = await this.runTest(config, 800000, 1.375, skipASAOptIn, true);
        const client = config.client;
        const maliciousAccount = config.maliciousAccount;

        if (PRINT_TXNS) {
            testHelper.printOuterTransactions(outerTxns);
        }

        const lsig = outerTxns[1].lsig;

        outerTxns.push( {
            unsignedTxn: await transactionGenerator.getPayTxn(client, maliciousAccount.addr, maliciousAccount.addr,
                1000, false),
            senderAcct: maliciousAccount
        });

        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
        try {
            await testHelper.sendAndCheckConfirmed(client, signedTxns);
        } catch (e) {
            // An exception is expected. Return true for success
            return testHelper.checkFailureType(e);
        }

        return false;
    },

    runPayAmountTooLowTest : async function (config, skipASAOptIn = false) {
        const outerTxns = await this.runTest(config, 800000, 1.375, skipASAOptIn, true);
        const client = config.client;
        const maliciousAccount = config.maliciousAccount;

        if (PRINT_TXNS) {
            testHelper.printOuterTransactions(outerTxns);
        }

        const lsig = outerTxns[1].lsig;

        outerTxns[0].unsignedTxn.amount = 400000;

        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
        try {
            await testHelper.sendAndCheckConfirmed(client, signedTxns);
        } catch (e) {
            // An exception is expected. Return true for success
            return testHelper.checkFailureType(e);
        }

        return false;
    },

    runPayNotToLsigTest : async function (config, skipASAOptIn = false) {
        const outerTxns = await this.runTest(config, 800000, 1.375, skipASAOptIn, true);
        const client = config.client;
        const maliciousAccount = config.maliciousAccount;

        if (PRINT_TXNS) {
            testHelper.printOuterTransactions(outerTxns);
        }

        const lsig = outerTxns[1].lsig;

        outerTxns[0].unsignedTxn.to = algosdk.decodeAddress(maliciousAccount.addr);

        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
        try {
            await testHelper.sendAndCheckConfirmed(client, signedTxns);
        } catch (e) {
            // An exception is expected. Return true for success
            return testHelper.checkFailureType(e);
        }

        return false;
    },
}
module.exports = Test;
