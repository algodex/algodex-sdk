/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const asaDelegateTemplate = {

    getTealTemplate : function getTealTemplate() {

    let asaDelegateTemplate = `

#pragma version 4

////////////////////////////////////
// ASA ESCROW (SELL ORDER) VERSION 4
//   Escrow limit order to SELL ASAs. These limit orders contain a minimum algo balance and then the ASA to sell.
//////////////////////////////////////

/////////////////////////////////
// CHECKS THAT APPLY TO ALL TXNS
////////////////////////////////

    global GroupSize
    int 5
    <=
    assert
    txn Fee
    int MinTxnFee
    <=
    assert

    int 0
    store 9

    checkAllTxns: // This is basically a for loop that checks all transactions

    load 9
    gtxns RekeyTo
    global ZeroAddress
    ==
    assert

    load 9
    int 1
    +
    store 9
    load 9
    global GroupSize
    <
    bnz checkAllTxns

///////////////////////////////////////////////////////////////////////
// OPEN - ORDER BOOK OPT IN & REGISTRATION
//   Placing an ASA Escrow Order. The escrow opts into the order book.
///////////////////////////////////////////////////////////////////////

    // TXN 0 - SELLER TO ESCROW:    pay transaction into escrow
    // TXN 1 - ESCROW TO ORDERBOOK: application opt in
    // TXN 2 - ESCROW TO ESCROW:    asset opt in
    // TXN 3 - SELLER TO ESCROW:    asset transfer

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
    gtxn 0 Amount // amount should be higher than 0.5 algo
    int 500000
    >= 
    && 
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
    int <assetid>  // asset id to trade for
    gtxn 2 XferAsset
    ==
    &&
    int <assetid>  // asset id to trade for
    gtxn 3 XferAsset
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
    
    bz notOptInOrOrderReg 
    // If the above are not true, this is a closeout (without order execution) or a trade execution
    // Otherwise it is Opt-in so return early
    int 1
    
    return

////////////////////////////////////////////////////////
/// CLOSE ORDER
//    Cancelling an order and refunding the amounts
////////////////////////////////////////////////////////

    // TXN 0 - ESCROW TO ORDERBOOK: app call to close order
    // TXN 1 - ESCROW TO SELLER: asset transfer (escrow to owner)
    // TXN 2 - ESCROW TO SELLER: pay transaction (from escrow to owner)
    // TXN 3 - SELLER TO SELLER: proof of ownership pay transaction (owner to owner)

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
    gtxn 0 OnCompletion
    int ClearState // App Call OnCompletion needs to be ClearState (OptOut), which will clear from the order book
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

    bz anyExecute // If the above are not true, this is a pay transaction. Otherwise it is CloseOut so ret success
    
    int 1
    return

///////////////////////////////////////////////////////
// ANY EXECUTE (with close or not)
//   Preamble for any order execution transaction
///////////////////////////////////////////////////////
    // TXN 0   - ESCROW TO ORDERBOOK: Application call to execute
    // TXN 1   - BUYER TO SELLER:     Pay transaction (from buyer/executor to escrow owner)
    // TXN 2   - BUYER TO BUYER:      (Optional) asset opt-in transaction (for buyer/executor)
    // TXN 2/3 - ESCROW TO BUYER:     Asset transfer (from escrow to buyer/executor)
    // TXN 3/4 - DEPENDS: don't check this here - different on whether closing or not
    //              Either: Pay transaction for fee refund (from buyer/executor to escrow)
    //              OR:     Pay transaction to close out to escrow owner (from escrow to escrow owner)

anyExecute:

///////////////////////
// OPTIONAL ASSET-OPT IN CHECK
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
    gtxn 2 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 2 Sender
    txn Sender // Sender must come from the user's wallet, not the escrow
    != // should *not* be originating from escrow
    &&
    store 0 //this will store the next transaction offset depending if opt in exists


    load 0
    int 2
    +
    store 2 // store offset of transaction 2, depending on if opt-in exists

    load 0
    int 3
    +
    store 3 // store offset of transaction 3, depending on if opt-in exists

/// END OPTIONAL ASSET OPT IN CHECK

// NOW CHECK TRANSACTIONS

    int 4
    load 0
    +
    global GroupSize // GroupSize must be 4 or 5 according to whether optional ASA opt in exists
    ==
    assert

    gtxn 0 Sender
    txn Sender // escrow account
    ==
    gtxn 1 Sender
    txn Sender // escrow account
    != // should *not* be originating from escrow
    &&
    load 2 
    gtxns Sender // Asset transfer comes from escrow account
    txn Sender // Escrow account
    ==
    &&
    gtxn 1 Sender // The buyer
    load 2 
    gtxns AssetReceiver // Asset transfer is sent to the buyer
    ==
    &&
    gtxn 1 Receiver
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 0 TypeEnum // First Transaction must be a call to a stateful contract
    int appl
    ==
    &&
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
    gtxn 0 ApplicationID // The specific App ID must be called
    int <orderBookId> //stateful contract app id. orderBookId
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
    assert

//////////////////////////////////////////////////////////////////////////////
// EXECUTE (partial)                                                        
//  Partial execution of an ASA escrow, where an ASA balance remains in it  
//////////////////////////////////////////////////////////////////////////////
    // TXN 0   - ESCROW TO ORDERBOOK: Application call to execute
    // TXN 1   - BUYER TO SELLER:     Pay transaction (from buyer/executor to escrow owner)
    // TXN 2   - BUYER TO BUYER:      (Optional) asset opt-in transaction (for buyer/executor)
    // TXN 2/3 - ESCROW TO BUYER:     Asset transfer (from escrow to buyer/executor)
    // TXN 3/4 - BUYER TO ESCROW:     Pay transaction for fee refund (from buyer/executor to escrow)

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
    load 3
    gtxns Receiver // receiver of fee transaction
    txn Sender  // escrow addr. check fee must be received by escrow account
    ==
    &&
    load 3 
    gtxns Sender // The fee sender must be the ASA buyer
    gtxn 1 Sender
    ==
    &&
    load 3 
    gtxns Sender // The fee sender
    txn Sender // Escrow account
    != // Fee sender should *not* be originating from escrow
    &&

    assert

    b finalExecuteChecks  //If the above result is 0, skip next section

/////////////////////////////////////////////////////////////////////////////////////////////////
// EXECUTE WITH CLOSE
//   Full order execution where the remaining minimum algo balance is closed to the escrow owner
/////////////////////////////////////////////////////////////////////////////////////////////////
    // TXN 0   - ESCROW TO ORDERBOOK: Application call to execute
    // TXN 1   - BUYER TO SELLER:     Pay transaction (from buyer/executor to escrow owner)
    // TXN 2   - BUYER TO BUYER:      (Optional) asset opt-in transaction (for buyer/executor)
    // TXN 2/3 - ESCROW TO BUYER:     Asset transfer (from escrow to buyer/executor)
    //                                 - closes out any remaining ASA to seller (escrow owner) as well
    // TXN 3/4 - ESCROW TO SELLER:    Pay transaction to close out to escrow owner
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
    load 2
    gtxns AssetCloseTo // remainder of ASA escrow is being closed out to escrow owner
    addr <contractWriterAddr> // contractWriterAddr
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
    load 3
    gtxns Amount
    int 0 // probably shouldn't matter, but the full amount should be in the CloseTo, not the Amount
    ==
    &&

    assert

    b finalExecuteChecks

finalExecuteChecks:

    gtxn 1 Amount // min algos spent
    //int <min> // NOTE** We have intentionally disabled the custom min amount check 
    int 1  // must be at least one algo spent
    >=
    load 2
    gtxns AssetAmount
    int 1  // must be at least one ASA spent
    >=
    &&
    bz fail

    /////////////////////////////////////
    /// finalizing execution ratio checks
    /////////////////////////////////////

    // handle the rate
    // SELL ORDER
    // D/N is the price of the asset. For example, if D/N = 0.25, then with 5 microAlgos you can buy 20 of the ASA in base units
    //
    // gtxn[2].AssetAmount * D <= gtxn[1].Amount * N 
    // N units of the asset per D microAlgos
    load 2
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