function getSellAlgoDelegateTemplate() {

// Stateless delegate contract template to sell algos in an escrow account
let delegateTemplate = `#pragma version 3
////////////////////////
// ALGO (NON-ASA) ESCROW 
///////////////////////////
/// ORDER BOOK OPT IN & REGISTRATION
//////////////////////////
    // check for optin transaction or orderbook registration transaction
    global GroupSize
    int 2
    ==
    txn TypeEnum
    int appl
    ==
    &&
    txn Amount
    int 0
    ==
    &&
    txn CloseRemainderTo
    global ZeroAddress
    ==
    &&
    txn OnCompletion
    int OptIn //Check OnCompletion is OptIn or NoOp
    ==
    &&
    txn AssetCloseTo
    global ZeroAddress
    ==
    &&
    txn RekeyTo
    global ZeroAddress
    ==
    &&
    bz notOptInOrOrderReg 
    // If the above are not true, this is a closeout (without order execution) or pay transaction
    // Otherwise it is Opt-in so return early
    int 1
    
    return

///////////////////////
//// CLOSEOUT ////////
/////////////////////

    notOptInOrOrderReg:
    // Check for close out transaction (without execution)
    gtxn 0 CloseRemainderTo
    global ZeroAddress // This is an app call so should be set to 0 address
    ==
    gtxn 1 CloseRemainderTo
    addr <contractWriterAddr> // contractWriterAddr
    ==
    global GroupSize
    int 2
    ==
    &&
    gtxn 0 TypeEnum
    int appl
    ==
    &&
    gtxn 1 TypeEnum
    int pay
    ==
    &&
    gtxn 0 Amount
    int 0 //Check all the funds are being sent to the CloseRemainderTo address
    ==
    &&
    gtxn 1 Amount
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
    int NoOp //Check App Call OnCompletion is CloseOut (OptOut)
    ==
    && 
    gtxn 0 AssetCloseTo
    global ZeroAddress // should not matter, but add just in case
    ==
    &&
    gtxn 1 AssetCloseTo
    global ZeroAddress  // should not matter, but add just in case
    ==
    &&
    bz checkPayWithCloseout // If the above are not true, this is a pay transaction. Otherwise it is CloseOut so ret success
    
    int 1
    return

///////////////////////////////
// PAY (ORDER EXECUTION)
//   WITH CLOSEOUT
/////////////////////////////////
    checkPayWithCloseout:
    pop

    gtxn 1 CloseRemainderTo
    global ZeroAddress
    ==
    bnz partialPayTxn // Jump to here if close remainder is a zero address

    gtxn 0 OnCompletion // The application call must be
    int CloseOut  // A general application call or a closeout
    ==
    gtxn 1 CloseRemainderTo
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    // this delegate is
    // only used on an execute order
    global GroupSize
    int 3
    ==
    &&
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
    int <orderBookId> // stateful contract app id. orderBookId
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
    bz fail
    // min algos spent
    gtxn 1 Amount
    int <min>
    >=
    // asset id to trade for
    int <assetid>
    gtxn 2 XferAsset
    ==
    &&
    assert
    // handle the rate
    // future sell order (not in this contract)
    // gtxn[1].Amount * N >= gtxn[2].AssetAmount * D
    // BUY ORDER
    // gtxn[2].AssetAmount * D >= gtxn[1].Amount * N
    // N units of the asset per D microAlgos
    gtxn 2 AssetAmount
    int <D> // put D value here
    mulw // AssetAmount * D => (high 64 bits, low 64 bits)
    store 2 // move aside low 64 bits
    store 1 // move aside high 64 bits
    gtxn 1 Amount
    int <N> // put N value here
    mulw
    store 4 // move aside low 64 bits
    store 3 // move aside high 64 bits
    // compare high bits to high bits
    load 1
    load 3
    >
    bnz done
    load 1
    load 3
    ==
    load 2
    load 4
    >=
    && // high bits are equal and low bits are ok
    bnz done
    err
    done:
    int 1
    return
    fail:
    int 0 
    return


///////////////////////////////////
// PAY (ORDER EXECUTION)
//   PARTIAL EXECUTION
/////////////////////////////////
    partialPayTxn:

    gtxn 0 OnCompletion // The application call must be a NoOp
    int NoOp
    ==
    txn CloseRemainderTo  //all transactions from this escrow must not have closeouts
    global ZeroAddress
    ==
    &&
    // this delegate is
    // only used on an execute order
    global GroupSize
    int 4
    ==
    &&
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
    // The fourth transaction must be 
    // a payment tx for transaction fee reimbursement
    gtxn 3 TypeEnum //FIXME check amount
    int pay
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
    int <orderBookId> //stateful contract app id orderBookId
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
    assert
    // min algos spent
    gtxn 1 Amount
    int <min>
    >=
    // asset id to trade for
    int <assetid>
    gtxn 2 XferAsset
    ==
    &&
    assert
    // handle the rate
    // future sell order (not in this contract)
    // gtxn[1].Amount * N >= gtxn[2].AssetAmount * D
    // BUY ORDER
    // gtxn[2].AssetAmount * D >= gtxn[1].Amount * N
    // N units of the asset per D microAlgos
    gtxn 2 AssetAmount
    int <D> // put D value here
    mulw // AssetAmount * D => (high 64 bits, low 64 bits)
    store 2 // move aside low 64 bits
    store 1 // move aside high 64 bits
    gtxn 1 Amount
    int <N> // put N value here
    mulw
    store 4 // move aside low 64 bits
    store 3 // move aside high 64 bits
    // compare high bits to high bits
    load 1
    load 3
    >
    bnz done2
    load 1
    load 3
    ==
    load 2
    load 4
    >=
    && // high bits are equal and low bits are ok
    bnz done2
    err

    done2:
    int 1
    return



    `;
    return delegateTemplate;
}

window.getSellAlgoDelegateTemplate = getSellAlgoDelegateTemplate;