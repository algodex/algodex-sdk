/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
/**
 * @deprecated
 * @type {{getClearProgram: (function(): string), getAlgoOrderBookApprovalProgram: (function(): string)}}
 */
const AlgoOrderbookTeal = {

    /**
     * @deprecated
     * @returns {string}
     */
    getClearProgram : function getClearProgram() {
    const clearProgram =
            `
#pragma version 2
// This program clears program state.
// This will clear local state for any escrow accounts that call this from a ClearState transaction,
// the logic of which is contained within the stateless contracts as part of a Close Out (Cancel Order) operation.
// We use ClearState instead of CloseOut so that the order book cannot prevent an escrow from closing out.
int 1
`
;
return clearProgram;
},

    /**
     * @deprecated
     * @returns {string}
     */
    getAlgoOrderBookApprovalProgram : function getAlgoOrderBookApprovalProgram() {
    // stateful DEX contract
    // This is for the order book
    return `
//////////////////////////////////////////////////
// STATEFUL CONTRACT                             /
//   ORDER BOOK FOR ALGO ESCROWS (BUY ORDERS)    /
//////////////////////////////////////////////////

#pragma version 4

    // STATEFUL APP CREATION
    // check if the app is being created
    // if so save creator

    int 0
    txn ApplicationID // check if there is no application ID - means it hasn't been created
    ==
    bz not_creation
    byte "Creator"
    txn Sender
    app_global_put

    int 1
    return
    not_creation:

    int DeleteApplication // check if this is deletion transaction
    txn OnCompletion
    ==
    bz not_deletion
    byte "Creator"
    app_global_get
    txn Sender
    ==
    assert
    int 1
    return
    not_deletion:

    int UpdateApplication // check if this is update
    txn OnCompletion
    ==
    bz not_update

    byte "Creator" // verify that the creator is making the call
    app_global_get
    txn Sender
    ==
    assert
    int 1
    return

    not_update:

    txna ApplicationArgs 0
    byte "open"
    ==
    bnz open
    txna ApplicationArgs 0
    byte "execute"
    ==
    bnz execute
    txna ApplicationArgs 0
    byte "execute_with_closeout"
    ==
    bnz execute_with_closeout
    err

///////////////////////////
/// OPEN - ORDER BOOK OPT IN & REGISTRATION
//    Placing an Algo Escrow Order
//////////////////////////
    // TXN 0 - BUYER TO ESCROW:     Pay from order creator to escrow account
    // TXN 1 - ESCROW TO ORDERBOOK: Stateful app opt-in to order book
    // TXN 2 - BUYER TO BUYER:      (Optional) ASA opt-in for the order creator's original wallet account.

    // This is the situation when a new escrow contract and order book contract is created
    // These are for Algo-only escrow accounts, i.e. buy orders to buy ASAs
    // The orders are unique per users

    open:

    gtxn 0 Amount // pay transaction must be over 1 algo
    int 500000 // 0.5 algo. Also checked in the escrow contract
    >=
    assert

    global GroupSize
    int 2
    ==
    global GroupSize
    int 3
    ==
    ||
    assert

    int OptIn
    txn OnCompletion
    ==
    assert
    int 0 //sender
    txn ApplicationID //current smart contract
    txna ApplicationArgs 1 // 2nd arg is order number
    app_local_get_ex // if the value already exists return without setting anything
    bnz ret_success
    pop
    int 0 //address index
    txna ApplicationArgs 1 //order number
    int 1 // value - just set to 1
    app_local_put // Store the order number as the key
    int 0 //address index
    byte "creator" //creator key
    gtxn 0 Sender // The sender of the pay transaction
    app_local_put // Store creator as value.
    int 0 //address index. This is the Sender of this transaction.
    byte "version" //store version
    txna ApplicationArgs 2 //version
    int 0
    getbyte
    app_local_put // store the version
    ret_success:
    int 1
    return

///////////////////////////////////
// EXECUTE
//   (PARTIAL ORDER EXECUTION)
/////////////////////////////////
    // TXN 0 - ESCROW TO ORDERBOOK: Transaction must be a call to a stateful contract
    // TXN 1 - ESCROW TO SELLER:    Payment transaction from this escrow to seller
    // TXN 2 - SELLER TO BUYER:     Asset transfer from seller to owner of this escrow (buyer)
    // TXN 3 - SELLER TO ESCROW:    Pay fee refund transaction

    execute:

    txn OnCompletion
    int NoOp
    ==
    assert
    global GroupSize
    int 4
    ==
    gtxn 0 TypeEnum // First Transaction must be a call to a stateful contract
    int appl
    ==
    &&
    gtxn 1 TypeEnum // The second transaction must be a payment transaction
    int pay
    ==
    &&
    gtxn 2 TypeEnum // The third transaction must be an asset transfer
    int axfer
    ==
    &&
    gtxn 3 TypeEnum // The fourth transaction must be a payment transaction to refund escrow fees
    int pay
    ==
    &&
    assert

    txn Sender
    balance
    gtxn 1 Amount
    -
    int 499000
    >= // after subtracting the amount, over 0.499 algo must remain (0.5 - original txn fee from maker order)
    assert
    
    int 0 // Escrow account containing order
    txn ApplicationID // Current stateful smart contract
    txna ApplicationArgs 1 // 2nd argument is order number
    app_local_get_ex
    assert // If the value doesnt exists fail
    pop
    int 0 // Escrow account containing order
    txn ApplicationID // Current stateful smart contract
    byte "creator"
    app_local_get_ex // returns if it exists and the creator
    assert // If the value doesnt exist fail
    txna Accounts 1 // account arg is order creator
    ==
    assert

    global ZeroAddress
    gtxn 1 CloseRemainderTo
    ==
    assert

    int 1
    return

///////////////////////////////
// EXECUTE (ORDER EXECUTION)
//   WITH CLOSEOUT
/////////////////////////////////
    // TXN 0 - ESCROW TO ORDERBOOK: transaction must be a call to a stateful contract
    // TXN 1 - ESCROW TO SELLER:    Payment transaction from this escrow to seller, with closeout to owner (buyer)
    // TXN 2 - SELLER TO BUYER:     Asset transfer from seller to owner of this escrow (buyer)

    execute_with_closeout:

    txn Sender
    balance
    gtxn 1 Amount
    -
    int 500000
    < // after subtracting the amount, less than 0.5 algo must remain (to be closed out)
    assert

    txn OnCompletion
    int CloseOut
    ==
    global GroupSize // Must be three transactions
    int 3
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
    gtxn 2 TypeEnum // The third transaction must be an asset transfer
    int axfer
    ==
    &&
    assert
    int 0 // Escrow account containing order
    txn ApplicationID // Current stateful smart contract
    txna ApplicationArgs 1 // 2nd argument is order number
    app_local_get_ex
    assert // If the value doesnt exists fail
    pop

    int 0 // Escrow account containing order
    txn ApplicationID // Current stateful smart contract
    byte "creator"
    app_local_get_ex // returns if it exists and the creator
    assert // If the value doesnt exist fail
    txna Accounts 1 // account arg is order creator
    ==
    assert

    int 0 // Escrow account containing order
    txn ApplicationID // Current stateful smart contract
    byte "version"
    app_local_get_ex
    assert // If the value doesnt exists fail
    pop

    int 0 //escrow account containing order
    txna ApplicationArgs 1 // order details
    app_local_del // Delete the order details from the order book
    int 0 
    byte "creator"
    app_local_del // Delete creator from order book
    int 0
    byte "version" // Delete version from order book
    app_local_del

    int 1
    return

    `;

    }
}

/**
 * Export of deprecated functions
 */
Object.keys(AlgoOrderbookTeal).forEach((key)=>{
    AlgoOrderbookTeal[key] = deprecate(AlgoOrderbookTeal[key], {file:'dex_teal.js'})
})
module.exports = AlgoOrderbookTeal;

