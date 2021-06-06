function getSellASADelegateTemplate() {

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
    gtxn 1 TypeEnum
    int appl
    ==
    &&
    gtxn 1 Amount
    int 0
    ==
    &&
    gtxn 1 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 1 OnCompletion
    int OptIn //Check OnCompletion is OptIn or NoOp
    ==
    &&
    gtxn 1 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    bz notOptInOrOrderReg 
    // If the above are not true, this is a closeout (without order execution) or pay transaction
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
    global GroupSize
    int 3
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

    // this delegate is
    // only used on an execute order without closeout
    global GroupSize
    int 4
    ==
    // The first transaction must be 
    // an ApplicationCall (ie call stateful smart contract)
    gtxn 0 TypeEnum
    int appl
    ==
    &&
    // The second transaction must be 
    // a payment tx 
    gtxn 1 TypeEnum
    int pay
    ==
    &&
    // The third transaction must be 
    // an asset xfer tx 
    gtxn 2 TypeEnum
    int axfer
    ==
    &&
    // The third transaction is a pay to refund fees
    gtxn 3 TypeEnum
    int pay
    ==
    &&
    txn Fee // fee for all transactions must be low
    int 1000
    <=
    &&
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
    gtxn 2 RekeyTo
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
    gtxn 2 CloseRemainderTo
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
    gtxn 2 AssetCloseTo
    global ZeroAddress
    ==
    &&
    int <assetid> // asset id to trade for
    gtxn 2 XferAsset
    ==
    &&
    store 0 // store result in 0 register

    load 0
    bnz finalExecuteChecks  //If the above result is 0, skip next section

///////////////////////////////////////
// EXECUTE WITH CLOSE
//////////////////////////////////////
//FIXME : add 4th transaction checks
    // only used on an execute order without closeout
    global GroupSize
    int 4
    ==
    // The first transaction must be 
    // an ApplicationCall (ie call stateful smart contract)
    gtxn 0 TypeEnum
    int appl
    ==
    &&
    // The second transaction must be 
    // a payment tx 
    gtxn 1 TypeEnum
    int pay
    ==
    &&
    // The third transaction must be 
    // an asset xfer tx 
    gtxn 2 TypeEnum
    int axfer
    ==
    &&
    txn Fee
    int 1000
    <=
    &&
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
    int CloseOut
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
    gtxn 2 RekeyTo
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
    gtxn 0 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 1 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 2 AssetCloseTo // remainder of ASA escrow is being closed out to escrow owner
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    int <assetid> // Put <assetid> here. asset id to trade for
    gtxn 2 XferAsset
    ==
    &&
    store 1 // store result in 0 register

finalExecuteChecks:

    load 0
    load 1
    ||
    bz fail

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
    gtxn 2 AssetAmount
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

window.getSellASADelegateTemplate = getSellASADelegateTemplate;