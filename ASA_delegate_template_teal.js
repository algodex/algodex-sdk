
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

    // TXN 0. - pay transaction into escrow (owner to escrow)
    // TXN 1. - application opt in (from escrow)
    // TXN 2. - asset opt in (from escrow)
    // TXN 3. - asset transfer (owner to escrow)

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

    // TXN 0. - app call to close order
    // TXN 1. - asset transfer (escrow to owner)
    // TXN 2. - pay transaction (from escrow to owner)
    // TXN 3. - proof pay transaction (owner to owner) - proof of ownership

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
// If this exists, it's the third transaction (gtxn 2).
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

    load 0
    int 2
    +
    store 2
    load 0
    int 3
    +
    store 3 

    int 4
    load 0
    +
    global GroupSize // GroupSize must be 4 or 5 according to whether optional ASA opt in exists
    ==
    assert

////////////////////////////////
// ANY EXECUTE (with close or not)
///////////////////////////////
    // TXN 0            - Application call (from escrow) to execute
    // TXN 1            - Pay transaction (from buyer/executor to escrow owner)
    // (Optional) TXN 2 - Optional asset opt-in transaction (for buyer/executor)
    // TXN 2 or 3       - Asset transfer (from escrow owner to buyer/executor)
    // TXN 3 or 4       - don't check this - different on whether closing or not

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
    load 2
    gtxns TypeEnum //The next transaction must be an asset transfer
    int axfer
    ==
    &&
    load 3
    gtxns TypeEnum     // The last transaction must be a payment transfer
    int pay
    ==
    &&
    txn Fee // fee for all transactions from the escrow must be low
    int 1000
    <=
    &&
    gtxn 0 ApplicationID // The specific App ID must be called
    int <orderBookId> //stateful contract app id. orderBookId
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
    load 2
    gtxns RekeyTo
    global ZeroAddress
    ==
    &&
    load 3
    gtxns RekeyTo
    global ZeroAddress
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
    load 2
    gtxns CloseRemainderTo
    global ZeroAddress
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
    load 2
    gtxns XferAsset
    int <assetid> // asset id to trade for
    ==
    &&
    load 2
    gtxns CloseRemainderTo // this is an asset transfer so only assets should be closed
    global ZeroAddress
    ==
    &&
    assert

////////////////////////////////
// EXECUTE
///////////////////////////////

    // TXN 0            - Application call (from escrow) to execute
    // TXN 1            - Pay transaction (from buyer/executor to escrow owner)
    // (Optional) TXN 2 - Optional asset opt-in transaction (for buyer/executor)
    // TXN 2 or 3       - Asset transfer (from escrow owner to buyer/executor)
    // TXN 3 or 4       - Pay transaction (fee refund from buyer/executor to escrow owner)

    gtxna 0 ApplicationArgs 0
    byte "execute_with_closeout"
    ==
    bnz execute_with_closeout

    gtxn 0 OnCompletion // The application call must be a general application call
    int NoOp
    ==
    load 2
    gtxns AssetCloseTo
    global ZeroAddress
    ==
    &&
    load 3
    gtxns CloseRemainderTo // check fee refund has no close remainder to
    global ZeroAddress
    ==
    &&
    load 3
    gtxns Fee // check fee refund has no close remainder to
    int 1000
    ==
    &&
    load 3
    gtxns Amount // check fee refund amount is 2000
    int 2000
    ==
    &&
    assert

    b finalExecuteChecks  //If the above result is 0, skip next section

///////////////////////////////////////
// EXECUTE WITH CLOSE
//////////////////////////////////////

// TXN 0            - Application call (from escrow) to execute_with_close
// TXN 1            - Pay transaction (from buyer/executor to escrow owner)
// (Optional) TXN 2 - Optional asset opt-in transaction (for buyer/executor)
// TXN 2 or 3       - Asset transfer (from escrow owner to buyer/executor)
//                            - closes out ASA to escrow owner as well
// TXN 3 or 4       - Pay transaction to close out to escrow owner as well
    execute_with_closeout:

    // The first transaction must be 
    // an ApplicationCall (ie call stateful smart contract)
   
    gtxn 0 OnCompletion
    int CloseOut
    ==
    gtxn 1 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    load 3
    gtxns CloseRemainderTo
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    load 3
    gtxns Receiver
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    load 3
    gtxns Sender // escrow account
    txn Sender // escrow account
    ==
    &&
    load 2
    gtxns AssetCloseTo // remainder of ASA escrow is being closed out to escrow owner
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
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
