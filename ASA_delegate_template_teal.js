
const asaDelegateTemplate = {

    getTealTemplate : function getTealTemplate() {

    // Stateless delegate contract template to sell algos in an escrow account
    let asaDelegateTemplate = `

#pragma version 3

////////////////////////////////////
// ASA ESCROW (escrow limit order to sell ASA)
//////////////////////////////////////
////////////////////////
// OPT IN
/////////////////////

// First trans.   - pay transaction into escrow (owner to escrow)
// Second trans.  - application opt in (from escrow)
// Third trans.   - asset opt in (from escrow)
// Fourth trans.  - asset transfer (owner to escrow)

//FIXME - check all transactions!!!
    // check on completion
    // check for optin transaction or orderbook registration transaction
    //FIXME - check other transactions in group
    global GroupSize
    int 4
    ==
    gtxn 0 Receiver
    txn Sender
    ==
    &&
    gtxn 0 TypeEnum
    int pay
    ==
    &&
    gtxn 1 TypeEnum
    int appl
    ==
    &&
    gtxn 2 TypeEnum
    int axfer
    ==
    &&
    gtxn 3 TypeEnum
    int axfer
    ==
    &&
    //gtxn 0 Amount fixme - amount should be higher than 1 algo
    //int 1000000
    //== 
    //&& 
    gtxn 1 Amount
    int 0
    ==
    &&
    gtxn 2 AssetAmount // this is an optin
    int 0
    ==
    &&
    gtxn 0 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 1 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 2 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 3 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 0 OnCompletion
    int NoOp
    ==
    &&
    gtxn 1 OnCompletion
    int OptIn
    ==
    &&
    gtxn 2 OnCompletion
    int NoOp
    ==
    &&
    gtxn 3 OnCompletion
    int NoOp
    ==
    &&
    gtxn 0 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 1 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 2 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 3 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 0 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 2 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 3 RekeyTo
    global ZeroAddress
    ==
    &&
    bz notOptInOrOrderReg 
    // If the above are not true, this is a closeout (without order execution) or a trade execution
    // Otherwise it is Opt-in so return early
    int 1
    
    return

///////////////////////
/// CLOSE ORDER
//////////////////////

    notOptInOrOrderReg:
    // Check for close out transaction (without execution)
    gtxn 0 CloseRemainderTo
    global ZeroAddress // This is an app call so should be set to 0 address
    ==
    gtxn 1 AssetCloseTo // asset close transaction
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 2 CloseRemainderTo // close transaction
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 3 Sender // proof the close is coming from sender
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    global GroupSize
    int 4
    ==
    &&
    gtxn 0 TypeEnum
    int appl
    ==
    &&
    gtxn 1 TypeEnum
    int axfer
    ==
    &&
    gtxn 2 TypeEnum
    int pay
    ==
    &&
    gtxn 0 Amount
    int 0 //Check all the funds are being sent to the CloseRemainderTo address
    ==
    &&
    gtxn 1 AssetAmount
    int 0 //Check all the funds are being sent to the CloseRemainderTo address
    ==
    &&
    gtxn 2 Amount
    int 0 //Check all the funds are being sent to the CloseRemainderTo address
    ==
    &&
    gtxn 0 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 0 OnCompletion
    int CloseOut //Check App Call OnCompletion is CloseOut (OptOut)
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 1 OnCompletion
    int NoOp
    ==
    &&
    gtxn 2 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 2 OnCompletion
    int NoOp
    ==
    &&
    gtxn 2 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 2 OnCompletion
    int NoOp
    ==
    &&
    gtxn 0 AssetCloseTo
    global ZeroAddress // should not matter, but add just in case
    ==
    &&
    gtxn 2 AssetCloseTo
    global ZeroAddress  // should not matter, but add just in case
    ==
    &&
    bz notCloseOut // If the above are not true, this is a pay transaction. Otherwise it is CloseOut so ret success
    
    int 1
    return

notCloseOut:
////////////////////////////////
// EXECUTE
///////////////////////////////

    //FIXME : fix below to work with assets
    //txn CloseRemainderTo
    //addr <contractWriterAddr> // contractWriterAddr
    //!=
    //txn CloseRemainderTo
    //global ZeroAddress
    //!=
    //&&
    //bnz fail

    gtxna 0 ApplicationArgs 0
    byte "execute_with_closeout"
    ==
    bnz execute_with_closeout

    global GroupSize
    int 4
    ==
    global GroupSize //group size can be 5 for asset opt-in
    int 5
    ==
    ||
    assert

    // First Transaction must be a call to a stateful contract
    gtxn 0 TypeEnum
    int appl
    ==
    // The second transaction must be a payment transaction
    gtxn 1 TypeEnum
    int pay
    ==
    &&
    assert

    gtxn 2 TypeEnum // check for asset opt in transaction
    int axfer
    ==
    gtxn 2 AssetAmount
    int 0
    ==
    &&
    gtxn 2 Sender
    gtxn 2 AssetReceiver
    ==
    &&
    store 0 //this will store the next transaction offset

    load 0
    int 2
    + 
    gtxns TypeEnum //The next transaction must be an asset transfer
    int axfer
    ==
    assert

    load 0
    int 3
    +
    gtxns TypeEnum     // The last transaction must be a payment transfer
    int pay
    ==
    assert

    //int 1 //TEMPORARY FIX LATER
    //return

    txn Fee // fee for all transactions must be low
    int 1000
    <=
    // The specific App ID must be called
    // This should be changed after creation
    // This links this contract to the stateful contract
    gtxn 0 ApplicationID
    int <orderBookId> //stateful contract app id. orderBookId
    ==
    &&
    // The application call must be
    // A general application call or a closeout
    gtxn 0 OnCompletion
    int NoOp
    ==
    &&
    // verify no transaction
    // contains a rekey
    gtxn 0 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    assert

    load 0
    int 2
    +
    gtxns RekeyTo
    global ZeroAddress
    ==
    assert

    gtxn 0 CloseRemainderTo
    global ZeroAddress
    == 
    gtxn 1 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    assert

    load 0
    int 2
    +
    gtxns CloseRemainderTo
    global ZeroAddress
    ==
    assert
 
    gtxn 0 AssetCloseTo
    global ZeroAddress
    ==
    gtxn 1 AssetCloseTo
    global ZeroAddress
    ==
    &&
    assert

    load 0
    int 2
    +
    gtxns AssetCloseTo
    global ZeroAddress
    ==
    assert

    load 0
    int 2
    +
    gtxns XferAsset
    int <assetid> // asset id to trade for
    ==
    assert

//TODO check 3rd transaction
    b finalExecuteChecks  //If the above result is 0, skip next section

///////////////////////////////////////
// EXECUTE WITH CLOSE
//////////////////////////////////////

    execute_with_closeout:
    //FIXME : add 4th transaction checks
    // only used on an execute order without closeout
    global GroupSize
    int 4
    ==
    global GroupSize //group size can be 5 for asset opt-in from receiver
    int 5
    ==
    ||
    assert

    // The first transaction must be 
    // an ApplicationCall (ie call stateful smart contract)
    gtxn 0 TypeEnum
    int appl
    ==
    gtxn 1 TypeEnum // The second transaction must be a payment tx 
    int pay
    ==
    &&
    assert

    gtxn 2 TypeEnum // check for asset opt in transaction
    int axfer
    ==
    gtxn 2 AssetAmount
    int 0
    ==
    &&
    gtxn 2 Sender
    gtxn 2 AssetReceiver
    ==
    &&
    store 0 //this will store the next transaction offset

    load 0
    int 2
    + 
    gtxns TypeEnum //The next transaction must be an asset transfer
    int axfer
    ==
    assert

    load 0
    int 3
    +
    gtxns TypeEnum     // The last transaction must be a payment transfer. TODO add additional checks for this
    int pay
    ==
    assert


    txn Fee
    int 1000
    <=
    gtxn 0 ApplicationID // The specific App ID of stateful contract must be called
    int <orderBookId> //stateful contract app id. orderBookId
    ==
    && // The application call must be a general application call or a closeout
    gtxn 0 OnCompletion
    int CloseOut
    ==
    &&
    gtxn 0 RekeyTo // verify no transaction
    global ZeroAddress // contains a rekey
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    assert

    load 0
    int 2
    +
    gtxns RekeyTo
    global ZeroAddress
    ==
    gtxn 1 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    assert

    load 0
    int 2
    +
    gtxns CloseRemainderTo
    global ZeroAddress
    ==
    gtxn 0 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 1 AssetCloseTo
    global ZeroAddress
    ==
    &&
    assert
    
    load 0
    int 2
    +
    gtxns AssetCloseTo // remainder of ASA escrow is being closed out to escrow owner
    addr <contractWriterAddr> // contractWriterAddr
    ==
    assert

    load 0
    int 2
    +
    gtxns XferAsset
    int <assetid> // Put <assetid> here. asset id to trade for
    ==
    assert

    b finalExecuteChecks

finalExecuteChecks:

    gtxn 1 Amount // min algos spent
    int <min> //Put <min> here
    >=
    bz fail

    /////////////////////////////////////
    /// finalizing execution ratio checks
    /////////////////////////////////////

    // handle the rate
    // future sell order (not in this contract)
    // gtxn[1].Amount * N <= gtxn[2].AssetAmount * D
    // BUY ORDER
    // gtxn[2].AssetAmount * D <= gtxn[1].Amount * N
    // N units of the asset per D microAlgos
    load 0
    int 2
    +
    gtxns AssetAmount
    int <D> // put <D> value here
    mulw // AssetAmount * D => (high 64 bits, low 64 bits)
    store 2 // move aside low 64 bits
    store 1 // move aside high 64 bits
    gtxn 1 Amount
    int <N> // put <N> value here
    mulw
    store 4 // move aside low 64 bits
    store 3 // move aside high 64 bits
    // compare high bits to high bits
    load 1
    load 3
    <
    bnz done
    load 1
    load 3
    ==
    load 2
    load 4
    <=
    && // high bits are equal and low bits are ok
    bnz done

    err
    done:
    int 1
    return
    fail:
    int 0 
    return
`;
    return asaDelegateTemplate;
    }

}

module.exports = asaDelegateTemplate;
