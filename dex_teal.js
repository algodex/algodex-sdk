/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const AlgoOrderbookTeal = {

 getAlgoOrderBookApprovalProgram : function getAlgoOrderBookApprovalProgram() {
    // stateful DEX contract
    // This is for the order book
    return `
//////////////////////////////////
// STATEFUL CONTRACT             /
//   ORDER BOOK FOR ALGO ESCROWS /
//////////////////////////////////

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

//////////
// OPEN //
//////////
    // This is the situation when a new escrow contract and order book contract is created
    // These are for Algo-only escrow accounts, i.e. buy orders to buy ASAs
    // The orders are unique per users
    
    // TXN 0 - Pay from order creator to escrow account
    // TXN 1 - Stateful app opt-in to order book
    // TXN 2 - Possible ASA opt-in for the order creator's original wallet account. Doesn't need checks

    open:

    gtxn 0 Amount // pay transaction must be over 1 algo
    int 1000000 // 1 algo
    >=
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
    // Store the order number as the key
    int 0 //address index
    txna ApplicationArgs 1 //order number
    int 1 // value - just set to 1
    app_local_put
    // Store creator as value
    int 0 //address index
    byte "creator" //creator key
    gtxn 0 Sender
    app_local_put
    int 0 //address index
    byte "version" //store version
    int 1
    app_local_put
    ret_success:
    int 1
    return

/////////////
/// EXECUTE /
/////////////
    // Must be four transactions
    // TXN 0 - transaction must be a call to a stateful contract
    // TXN 1 - Payment transaction from this escrow (buyer) to seller
    // TXN 2 - Asset transfer from seller to owner of this escrow
    // TXN 3 - fee refund transaction (pay transaction)

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
    int 1000000
    >= // after subtracting the amount, over 1 algo must remain
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
    app_local_get_ex
    assert // If the value doesnt exists fail
    pop
    int 0
    byte "creator"
    app_local_get // check creator matches expectation
    txna ApplicationArgs 2 // 3rd argument is order creator
    ==
    assert

    global ZeroAddress
    gtxn 1 CloseRemainderTo
    ==
    assert

    int 1
    return

///////////////////////////
/// EXECUTE WITH CLOSEOUT /
///////////////////////////
    // Must be three transactions
    // TXN 0 - transaction must be a call to a stateful contract
    // TXN 1 - Payment transaction from this escrow (buyer) to seller
    // TXN 2 - Asset transfer from seller to owner of this escrow

    execute_with_closeout:

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
    app_local_get_ex
    assert // If the value doesnt exist fail
    pop
    int 0
    byte "creator"
    app_local_get // check creator matches expectation
    txna ApplicationArgs 2 // 3rd argument is order creator
    ==
    pop

    int 0 // Escrow account containing order
    txn ApplicationID // Current stateful smart contract
    byte "version"
    app_local_get_ex
    assert // If the value doesnt exists fail
    pop

    // Delete the order from the order book
    int 0 //escrow account containing order
    txna ApplicationArgs 1 // order details
    app_local_del
    int 0 // Delete creator from args
    byte "creator"
    app_local_del
    int 0 // Delete version from args
    byte "version"
    app_local_del

    int 1
    return




    `;

    }
}

module.exports = AlgoOrderbookTeal;

