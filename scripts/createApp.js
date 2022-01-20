//
// USAGE:
//   node scripts/createApp.js --environment=[local|test|production] --orderbook=[algo|asa]


const algosdk = require('algosdk');
const algodex = require('../index.js');

// user declared account mnemonics

//fund the account below before creating

const userMnemonic = "into client electric fantasy region output firm urban cattle slim action great exit mammal swear dolphin sting fame mix blouse often crime camp absent alone"

// declare application state storage (immutable)
localInts = 2;
localBytes = 1;
globalInts = 0;
globalBytes = 1;

// user declared approval program (initial)


// declare clear state program source
clearProgramSource = `#pragma version 2
int 1
`;

// helper function to compile program source  
async function compileProgram(client, programSource) {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    return compiledBytes;
}

// helper function to await transaction confirmation
// Function used to wait for a tx confirmation
const waitForConfirmation = async function (algodclient, txId) {
    let status = (await algodclient.status().do());
    let lastRound = status["last-round"];
      while (true) {
        const pendingInfo = await algodclient.pendingTransactionInformation(txId).do();
        if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
          //Got the completed Transaction
          console.log("Transaction " + txId + " confirmed in round " + pendingInfo["confirmed-round"]);
          break;
        }
        lastRound++;
        await algodclient.statusAfterBlock(lastRound).do();
      }
    };

// create new application
async function createApp(client, creatorAccount, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes) {
    // define sender as creator
    sender = creatorAccount.addr;

    // declare onComplete as NoOp
    onComplete = algosdk.OnApplicationComplete.NoOpOC;

	// get node suggested parameters
    const params = await client.getTransactionParams().do();

    // create unsigned transaction
    const txn = algosdk.makeApplicationCreateTxn(sender, params, onComplete, 
                                            approvalProgram, clearProgram, 
                                            localInts, localBytes, globalInts, globalBytes,);
    const txId = txn.txID().toString();

    // Sign the transaction
    const signedTxn = txn.signTxn(creatorAccount.sk);
    console.log("Signed transaction with txID: %s", txId);

    // Submit the transaction
    await client.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    // display results

    const transactionResponse = (await algodex.waitForConfirmation(txId)).transaction;
    const appId = transactionResponse['created-application-index'];
    console.log("Created new app-id: ",appId);
    return appId;
}

async function main() {
    try {
    
        const args = require('minimist')(process.argv.slice(2))
        const environment = args['environment'];
        const orderbook = args['orderbook'];
        let approvalProgramSourceInitial = null;

        // asa or algo
        if (orderbook === 'algo') {
            approvalProgramSourceInitial = algodex.getAlgoOrderBookTeal();
        } else {
            approvalProgramSourceInitial = algodex.getAsaOrderBookTeal();
        }

        // initialize an algodClient
        let algodClient = algodex.initAlgodClient(environment);

        // get accounts from mnemonic
        let creatorAccount = algosdk.mnemonicToSecretKey(userMnemonic);
        //create sample token and optin note the switch of accounts
        //useraccount will be the token creator
        //await createToken(algodClient, userAccount, creatorAccount);

        // compile programs 
        let approvalProgram = await compileProgram(algodClient, approvalProgramSourceInitial);
        let clearProgram = await compileProgram(algodClient, clearProgramSource);

        // create new application
        let appId = await createApp(algodClient, creatorAccount, approvalProgram, clearProgram, localInts, localBytes, globalInts, globalBytes);
        console.log( "APPID="+appId);

    }
    catch (err){
        console.log("err", err);  
    }
}

main();