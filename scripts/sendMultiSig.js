//
// USAGE:
//   node scripts/sendMultiSig.js --in-file [in-file] --out-file [out-file] --send=[true|false] --mnemonic=[mnemonic] --first-address=[address] --second-address=[address]


const algosdk = require('algosdk');
const algodex = require('../index.js');
const constants = require('../constants.js');
const fs = require('fs');

// user declared account mnemonics

//fund the two accounts below before creating
//WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI
//const creatorMnemonic = "mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above";

//UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A
//const userMnemonic = "three satisfy build purse lens another idle fashion base equal echo recall proof hill shadow coach early palm act wealth dawn menu portion above mystery";

// declare application state storage (immutable)
localInts = 2;
localBytes = 1;
globalInts = 0;
globalBytes = 1;

// user declared approval program (initial)


// helper function to compile program source  
async function compileProgram(client, programSource) {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    return compiledBytes;
}

const getCreatorAccount = (mnemonic, fromAddr) => {
    let accountStr = null;
    let account = null;
    if (mnemonic) {
        account = algosdk.mnemonicToSecretKey(mnemonic);
    } else {
        accountStr = fromAddr;
        account = {
            addr: fromAddr,
            sk: null
        }
    }

    if (mnemonic && fromAddr && fromAddr != accountStr) {
        throw 'fromAddr does not match mnemonic addr!';
    }

    return account;
}

// create new application
async function updateApp(client, appId, creatorAccount, approvalProgram, clearProgram, saveToDisk=false) {
    // define sender as creator
    sender = creatorAccount.addr;

    // declare onComplete as NoOp
    onComplete = algosdk.OnApplicationComplete.NoOpOC;

	// get node suggested parameters
    let params = await client.getTransactionParams().do();

    // create unsigned transaction
    let txn = algosdk.makeApplicationUpdateTxn(sender, params, appId, 
                                            approvalProgram, clearProgram);
    let txId = txn.txID().toString();

    if (saveToDisk) {
        fs.writeFileSync('./unsigned.txn', algosdk.encodeUnsignedTransaction( txn ));
        console.log("Saved [unsigned.txn] to disk! returning early");
        return -1;
    }

    // Sign the transaction
    let signedTxn = txn.signTxn(creatorAccount.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    console.log("waiting for confirmation...");
    await algodex.waitForConfirmation(txId);

    // display results
    console.log("Updated app-id: ",appId);
    return appId;
}

async function readSignedMultisigTransactionFromFile(file, account, firstAddress, secondAddress, stxn) {
    // Setup the parameters for the multisig account
    const mparams = {
        version: 1,
        threshold: 2,
        addrs: [
            firstAddress,
            secondAddress,
        ],
    };

    let multsigaddr = algosdk.multisigAddress(mparams);
    console.log("Multisig Address: " + multsigaddr);

    try {
        let twosigs = algosdk.appendSignMultisigTransaction(stxn, mparams, account.sk).blob;
        //sign with second account - this can be signed before writing twosigs offline or when reading in, if second tx not signed here just writting stxn
        //let twosigs = algosdk.appendSignMultisigTransaction(stxn, mparams, account2.sk).blob;
        const algodClient = algodex.initAlgodClient('production');
        algodex.initIndexer('production');
        
        let txId = (await algodClient.sendRawTransaction(twosigs).do());        

        let confirmedTxn = await algodex.waitForConfirmation(txId.txId);

        console.log("Transaction " + txId.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
    } catch (err) {
        console.log(err.message);
    }
};


async function writeSignedMultisigTransactionToFile(account, firstAddress, secondAddress, txn) {
    // Setup the parameters for the multisig account
    const mparams = {
        version: 1,
        threshold: 2,
        addrs: [
            firstAddress,
            secondAddress,
        ],
    };

    let multsigaddr = algosdk.multisigAddress(mparams);
    console.log("Multisig Address: " + multsigaddr);

    try {
        let stxn = algosdk.signMultisigTransaction(txn, mparams, account.sk).blob;
        //sign with second account - this can be signed before writing twosigs offline or when reading in, if second tx not signed here just writting stxn
        //let twosigs = algosdk.appendSignMultisigTransaction(stxn, mparams, account2.sk).blob;

        fs.writeFileSync('./signedmultisig.stxn', stxn ); 
        console.log("The stxn file was saved!");
        // write out mparams as json file
        let mparamsinfo = JSON.stringify(mparams, undefined, 2); 
        fs.writeFileSync('./multisigparams.json', mparamsinfo)        
        console.log("The multisig params file was saved!"); 

        // fs.writeFileSync('./multisig.mparams', algosdk.encodeObj(mparams))        
        // console.log("The multisig params file was saved!");        
       
    } catch (err) {
        console.log(err.message);
    }
};


async function main() {
    try {
    
        const args = require('minimist')(process.argv.slice(2))
        const inFile = args['in-file'];
        const outFile = args['out-file'];
        const send = args['send'];
        const mnemonic = args['mnemonic'];
        const firstAddress = args['first-address'];
        const secondAddress = args['second-address'];

        const account = algosdk.mnemonicToSecretKey(mnemonic);

        if (!send) {
            const txn = algosdk.decodeUnsignedTransaction(fs.readFileSync(inFile));
            writeSignedMultisigTransactionToFile(account, firstAddress, secondAddress, txn);
        } else {
            const stxn = fs.readFileSync(inFile);
            readSignedMultisigTransactionFromFile(inFile, account, firstAddress, secondAddress, stxn);
        }

        //let rawSignedTxn = algosdk.signMultisigTransaction(txn, mparams, account1.sk).blob;


    }
    catch (err){
        console.log("err", err);  
    }
}

main();
