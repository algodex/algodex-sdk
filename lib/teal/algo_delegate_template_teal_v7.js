/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

/**
 * @type {{getTealTemplate: (function(): string)}}
 */
const algoDelegateTemplate = {

    /**
     * @returns {string}
     */
    getTealTemplate : function getTealTemplate() {

let delegateTemplate = `
#pragma version 4

//////////////////////////////////////////////////////////////////////////////
// ALGO (NON-ASA) ESCROW (BUY ORDER) VERSION 4
//    Escrow limit order to BUY ASAs. These limit orders contain only algos.
//////////////////////////////////////////////////////////////////////////////

/////////////////////////////////
// CHECKS THAT APPLY TO ALL TXNS
////////////////////////////////
    global GroupSize
    int 4
    <=
    assert
    txn Fee
    global MinTxnFee
    ==
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
    gtxns AssetCloseTo
    global ZeroAddress
    ==
    assert
    load 9
    gtxns AssetSender
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

///////////////////////////
/// OPEN - ORDER BOOK OPT IN & REGISTRATION
//    Placing an Algo Escrow Order
//////////////////////////
    // TXN 0 - BUYER TO ESCROW:     Pay from order creator to escrow account
    // TXN 1 - ESCROW TO ORDERBOOK: Stateful app opt-in to order book
    // TXN 2 - BUYER TO BUYER:      (Optional) ASA opt-in for the order creator's original wallet account.
    global GroupSize
    int 2
    ==
    global GroupSize
    int 3
    ==
    ||
    gtxn 0 TypeEnum
    int pay
    ==
    &&
    gtxn 1 TypeEnum
    int appl
    ==
    &&
    gtxn 0 Amount
    int 500000 // Must be funded with at least 0.5 algo.
    >=
    &&
    gtxn 1 Amount // amount sent from escrow for this txn should always be 0
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
    gtxn 0 OnCompletion
    int NoOp //Check OnCompletion is OptIn or NoOp
    ==
    &&
    gtxn 1 OnCompletion
    int OptIn //Check OnCompletion is OptIn or NoOp
    ==
    &&
    gtxn 1 ApplicationID
    int <orderBookId> // stateful contract app id. orderBookId
    ==
    &&
    gtxn 0 Sender // must originate from buyer
    addr <contractWriterAddr> // contractWriterAddr (order creator)
    ==
    &&
    gtxn 1 Sender
    txn Sender // escrow account
    ==
    &&
    gtxn 0 Receiver // recipient of pay
    txn Sender // escrow account
    ==
    &&
    store 0

    global GroupSize // Third transaction is an optional asset opt-in
    int 2
    ==
    store 1

    load 1
    bnz notThreeTxns

    gtxn 2 TypeEnum// Third transaction. 
    int axfer
    ==
    gtxn 2 AssetAmount
    int 0
    ==
    &&
    gtxn 2 Sender
    addr <contractWriterAddr> // contractWriterAddr (order creator)
    ==
    &&
    gtxn 2 Sender
    gtxn 2 AssetReceiver // required to be the same for ASA opt-in
    ==
    &&
    gtxn 2 OnCompletion
    int NoOp
    ==
    &&
    int <assetid>  // asset id to trade for
    gtxn 2 XferAsset
    ==
    &&
    store 1

    notThreeTxns:
    load 0 
    load 1 // Both should now be set to 1 if this is an open order transaction
    && // If either of the above are set to 0, this is *not* a place order transaction, so check other types
    bz notOptInOrOrderReg // Jump if either is 0

    int 1 // Otherwise it is a valid Opt-in so return early
    return

////////////////////////////////////////
//// CLOSEOUT (ORDER CANCELLED) ////////
////////////////////////////////////////
    // TXN 0 - ESCROW TO ORDERBOOK: application call to order book contract for closeout
    // TXN 1 - ESCROW TO BUYER:     pay txn close out call
    // TXN 2 - BUYER TO BUYER:      send transaction for proof that closeout sender owns the escrow

    notOptInOrOrderReg:
    // Check for close out transaction (without execution)
    global GroupSize
    int 3
    ==
    gtxn 0 ApplicationID
    int <orderBookId> // stateful contract app id. orderBookId
    ==
    &&
    gtxn 0 CloseRemainderTo
    global ZeroAddress // This is an app call so should be set to 0 address
    ==
    &&
    gtxn 1 CloseRemainderTo
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 2 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 0 Sender // first transaction must come from the escrow
    txn Sender
    ==
    &&
    gtxn 1 Sender // second transaction must come from the escrow
    txn Sender
    ==
    &&
    gtxn 2 Sender // proof the close is coming from sender
    addr <contractWriterAddr> // contractWriterAddr
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
    gtxn 2 TypeEnum
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
    gtxn 2 Amount
    int 0 // This is just a proof so amount should be 0
    ==
    &&
    gtxn 0 OnCompletion
    int ClearState // App Call OnCompletion needs to be ClearState (OptOut), which will clear from the order book
    ==
    &&
    gtxn 1 OnCompletion
    int NoOp //pay transaction
    ==
    && 
    gtxn 2 OnCompletion
    int NoOp //proof pay transaction
    ==
    &&
    bz checkPayWithCloseout // If the above are not true, this is a pay transaction. Otherwise it is CloseOut so ret success
    
    int 1
    return

///////////////////////////////
// EXECUTE (ORDER EXECUTION)
//   WITH CLOSEOUT
/////////////////////////////////
    // TXN 0 - ESCROW TO ORDERBOOK: transaction must be a call to a stateful contract
    // TXN 1 - ESCROW TO SELLER:    Payment transaction from this escrow to seller, with closeout to owner (buyer)
    // TXN 2 - SELLER TO BUYER:     Asset transfer from seller to owner of this escrow (buyer)

    checkPayWithCloseout:

    gtxn 1 CloseRemainderTo
    global ZeroAddress
    ==
    bnz partialPayTxn // Jump to here if close remainder is a zero address. This is *not* a close-out

    // We should be here only if this is a full execution with closeout

    gtxn 0 OnCompletion // The application call must be
    int CloseOut  // A general application call or a closeout
    ==
    global GroupSize // this delegate is only used on an execute order
    int 3
    ==
    &&
    gtxn 0 TypeEnum // The first transaction must be an Application Call (i.e. call stateful smart contract)
    int appl
    ==
    &&
    gtxn 1 TypeEnum // The second transaction must be a payment tx
    int pay
    ==
    &&
    gtxn 2 TypeEnum // The third transaction must be an asset xfer tx 
    int axfer
    ==
    &&
    gtxn 0 ApplicationID // The specific Order Book App ID must be called
    int <orderBookId> // stateful contract app id. orderBookId
    ==
    &&
    gtxn 0 Sender
    txn Sender // escrow account
    ==
    &&
    gtxn 1 Sender
    txn Sender // escrow account
    ==
    &&
    gtxn 2 Sender
    txn Sender // escrow account
    != // should *not* be originating from escrow
    &&
    gtxn 1 Receiver // Receiver of the pay transaction from this escrow
    gtxn 2 Sender  // Sender of the asset transfer (person trading)
    ==
    &&
    gtxn 2 AssetReceiver // Receiver of asset transfer
    addr <contractWriterAddr> // contractWriterAddr must receive the asset
    ==
    &&
    gtxn 0 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 1 CloseRemainderTo
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 2 CloseRemainderTo
    global ZeroAddress
    ==
    && 
    gtxn 2 AssetCloseTo
    global ZeroAddress
    ==
    && 
    assert

    b handle_rate_check

///////////////////////////////////
// EXECUTE
//   (PARTIAL ORDER EXECUTION)
/////////////////////////////////
    // TXN 0 - ESCROW TO ORDERBOOK: Transaction must be a call to a stateful contract
    // TXN 1 - ESCROW TO SELLER:    Payment transaction from this escrow to seller
    // TXN 2 - SELLER TO BUYER:     Asset transfer from seller to owner of this escrow (buyer)
    // TXN 3 - SELLER TO ESCROW:    Pay fee refund transaction

    partialPayTxn:
    
    global MinTxnFee
    global MinTxnFee
    +
    store 8 // store 2x minimum fee

    gtxn 0 OnCompletion // The application call must be a NoOp
    int NoOp
    ==
    txn CloseRemainderTo  //all transactions from this escrow must not have closeouts
    global ZeroAddress
    ==
    &&
    global GroupSize // this delegate is only used on an execute order
    int 4
    ==
    &&
    gtxn 0 TypeEnum // The first transaction must be an ApplicationCall (ie call stateful smart contract)
    int appl
    ==
    &&
    gtxn 1 TypeEnum // The second transaction must be a payment tx 
    int pay
    ==
    &&
    gtxn 2 TypeEnum // The third transaction must be an asset xfer tx 
    int axfer
    ==
    &&
    gtxn 3 TypeEnum // The fourth transaction must be a payment tx for transaction fee reimbursement //FIXME check amount
    int pay
    ==
    &&
    gtxn 3 Amount // Refund amount must be 2x min amount
    load 8
    ==
    &&
    gtxn 3 Receiver // Fee refund recipient
    txn Sender // The escrow address
    ==
    &&
    gtxn 3 Sender // The fee sender must be the ASA seller
    gtxn 1 Receiver
    ==
    &&
    gtxn 0 Sender
    txn Sender // escrow account
    ==
    &&
    gtxn 1 Sender
    txn Sender // escrow account
    ==
    &&
    gtxn 2 Sender
    txn Sender // escrow account
    != // should *not* be originating from escrow
    &&
    gtxn 3 Sender
    txn Sender // escrow account
    != // should *not* be originating from escrow
    &&
    gtxn 0 ApplicationID // The specific App ID for the Algo escrow order book must be called
    int <orderBookId> //stateful contract app id orderBookId
    ==
    &&
    gtxn 1 Sender // Sender of the pay transaction must be this escrow
    txn Sender // Escrow address
    ==
    &&
    gtxn 1 Receiver // Receiver of the pay transaction from this escrow
    gtxn 2 Sender  // Sender of the asset transfer (person trading)
    ==
    &&
    gtxn 2 AssetReceiver // Receiver of asset transfer
    addr <contractWriterAddr> // contractWriterAddr must receive the asset
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
    assert

    handle_rate_check:
    gtxn 1 Amount 
    int 1 // must be at least one
    //int <min> NOTE** - leave this commented. We have intentionally disabled the custom min amount check 
    >=
    gtxn 2 AssetAmount
    int 1 // must be at least one
    >=
    &&
    int <assetid>  // asset id to trade for
    gtxn 2 XferAsset
    ==
    &&
    assert
    // handle the rate
    // BUY ORDER
    // gtxn[2].AssetAmount * D >= gtxn[1].Amount * N
    //
    // D/N is the price of the asset. For example, if D/N = 0.25, then with 5 microAlgos you can buy 20 of the ASA in base units
    //
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

}

module.exports = algoDelegateTemplate;
