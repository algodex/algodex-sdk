
const asaDelegateTemplate = {

    getTealTemplate : function getTealTemplate() {

    // Stateless delegate contract template to sell ASAs in an escrow account
    let asaDelegateTemplate = `

#pragma version 4

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

    global GroupSize
    int 4
    ==
    gtxn 1 ApplicationID
    int <orderBookId> //stateful contract app id. orderBookId
    ==
    &&
    gtxn 0 Sender // escrow address
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 0 Receiver
    txn Sender // escrow address
    ==
    &&
    gtxn 1 Sender
    txn Sender // escrow address
    ==
    &&
    gtxn 2 Sender
    txn Sender // escrow address
    ==
    &&
    gtxn 2 Sender
    gtxn 2 AssetReceiver
    ==
    &&
    txn Sender // escrow address
    gtxn 3 AssetReceiver
    ==
    &&
    gtxn 3 Sender // escrow address
    addr <contractWriterAddr> // contractWriterAddr
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
    gtxn 3 AssetAmount // this is an optin
    int 1 // Needs to put at least one ASA into the account
    >=
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

// First trans.   - pay transaction into escrow (owner to escrow)
// Second trans.  - application opt in (from escrow)
// Third trans.   - asset opt in (from escrow)
// Fourth trans.  - asset transfer (owner to escrow)

    notOptInOrOrderReg:
    // Check for close out transaction (without execution)
    global GroupSize
    int 4
    ==
    gtxn 0 ApplicationID
    int <orderBookId> //stateful contract app id. orderBookId
    ==
    &&
    gtxn 0 CloseRemainderTo
    global ZeroAddress // This is an app call so should be set to 0 address
    ==
    &&
    gtxn 0 AssetCloseTo
    global ZeroAddress // should not matter, but add just in case
    ==
    &&
    gtxn 1 CloseRemainderTo
    global ZeroAddress  // should not matter, but add just in case. We are closing ASAs not algos
    ==
    &&
    gtxn 1 AssetCloseTo // asset close transaction
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 2 CloseRemainderTo // close algo minimum balance transaction
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 2 AssetCloseTo // should not matter. Third transaction is for closing algos
    global ZeroAddress // contractWriterAddr
    ==
    &&
    gtxn 3 CloseRemainderTo // should not matter. Fourth transaction is a proof of ownership
    global ZeroAddress
    ==
    &&
    gtxn 3 AssetCloseTo // should not matter. Fourth transaction is a proof of ownership
    global ZeroAddress
    ==
    &&
    gtxn 0 Sender
    txn Sender // escrow address
    ==
    &&
    gtxn 1 Sender
    txn Sender // escrow address   
    ==
    &&
    gtxn 2 Sender
    txn Sender // escrow address 
    ==
    &&
    gtxn 3 Sender // proof the close is coming from sender
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 0 Receiver
    global ZeroAddress // This is an app call, so no receiver
    ==
    &&
    gtxn 1 AssetReceiver
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 2 Receiver // 0 funds are being transferred, but still expected to be set
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 3 Receiver // 0 funds are being transferred, but still expected to be set
    addr <contractWriterAddr> // contractWriterAddr
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
    gtxn 3 TypeEnum
    int pay
    ==
    &&
    gtxn 0 Amount // Should not matter since this is an app call
    int 0 //Check all the funds are being sent to the CloseRemainderTo address
    ==
    &&
    gtxn 1 Amount
    int 0 // Should not matter since this is an ASA transfer
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
    gtxn 2 AssetAmount
    int 0 //Should not matter since this is a pay transaction
    ==
    &&
    gtxn 3 Amount
    int 0 //This is a proof of ownership so the amount should be 0
    ==
    &&
    gtxn 3 AssetAmount
    int 0 //Should not matter since this is a pay transaction
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
    gtxn 0 OnCompletion
    int CloseOut // App Call OnCompletion needs to be CloseOut (OptOut)
    ==
    &&
    gtxn 1 OnCompletion
    int NoOp
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

    bz notCloseOut // If the above are not true, this is a pay transaction. Otherwise it is CloseOut so ret success
    
    int 1
    return

notCloseOut:

// First check if we have the optional asset opt-in transaction for the buyer's wallet
// This happens for both execute and execute_with_close
    gtxn 2 TypeEnum
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
    gtxn 2 RekeyTo // verify no transaction contains a rekey
    global ZeroAddress
    ==
    &&
    gtxn 2 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 2 Sender
    txn Sender // Sender must come from the user's wallet, not the escrow
    !=
    &&
    store 0 //this will store the next transaction offset depending if opt in exists


////////////////////////////////
// EXECUTE
///////////////////////////////

// Trans 1            - Application call (from escrow) to execute
// Trans 2            - Pay transaction (from buyer/executor to escrow owner)
// (Optional) Trans 3 - Optional asset opt-in transaction (for buyer/executor)
// Trans 3 or 4       - Asset transfer (from escrow owner to buyer/executor)
// Trans 4 or 5       - Pay transaction (fee refund from buyer/executor to escrow owner)

    gtxna 0 ApplicationArgs 0
    byte "execute_with_closeout"
    ==
    bnz execute_with_closeout

    int 4
    load 0
    +
    global GroupSize // GroupSize must be 4 or 5 according to whether optinal ASA opt in exists
    ==
    assert

    gtxn 0 TypeEnum // First Transaction must be a call to a stateful contract
    int appl
    ==
    gtxn 1 TypeEnum // The second transaction must be a payment transaction
    int pay
    ==
    &&
    gtxn 2 TypeEnum // third transaction must be an asset opt-in/transfer
    int axfer
    ==
    &&
    assert
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

    txn Fee // fee for all transactions from the escrow must be low
    int 1000
    <=
    gtxn 0 ApplicationID // The specific App ID must be called
    int <orderBookId> //stateful contract app id. orderBookId
    ==
    &&
    gtxn 0 OnCompletion // The application call must be a general application call
    int NoOp
    ==
    &&
    gtxn 0 RekeyTo // verify no transaction contains a rekey
    global ZeroAddress
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    assert

    load 0 //load offset depending on whether there is the asa opt-in transaction
    int 2
    +
    gtxns RekeyTo
    global ZeroAddress
    ==
    assert
    load 0 //load offset depending on whether there is the asa opt-in transaction
    int 3
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
    int 3
    +
    gtxns CloseRemainderTo // check fee refund has no close remainder to
    global ZeroAddress
    ==
    assert

    load 0
    int 3
    +
    gtxns Fee // check fee refund has no close remainder to
    int 1000
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
    int 4
    load 0
    +
    global GroupSize // GroupSize must be 4 or 5 according to whether optinal ASA opt in exists
    ==
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
    gtxn 2 TypeEnum // third transaction must be an asset opt-in or transfer
    int axfer
    ==
    &&
    assert
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
    int 1000 // all fees must be 1000 or less
    <=
    gtxn 0 ApplicationID // The specific App ID of stateful contract must be called
    int <orderBookId> //stateful contract app id. orderBookId
    ==
    && // The application call must be a closeout
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

    gtxn 2 XferAsset // third transaction must be an asset opt-in or transfer
    int <assetid> // Put <assetid> here. asset id to trade for
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
    // SELL ORDER
    // gtxn[1].Amount * N <= gtxn[2].AssetAmount * D
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
