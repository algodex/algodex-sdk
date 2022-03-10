/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

/**
 * @type {{getClearProgram: (function(): string), getASAOrderBookApprovalProgram: (function(): string)}}
 */
const AsaOrderbookTeal = {

    /**
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
    getASAOrderBookApprovalProgram : function getASAOrderBookApprovalProgram() {
    // stateful DEX contract
    // This is for the order book
    return `
////////////////////////////////////////////////
// STATEFUL CONTRACT                           /
//   ORDER BOOK FOR ASA ESCROWS (SELL ORDERS) /
////////////////////////////////////////////////

#pragma version 4
    // check if the app is being created
    // if so save creator

    int 0
    txn ApplicationID
    ==
    bz not_creation
    byte "Creator"
    txn Sender
    app_global_put
    int 1
    return
  not_creation:
    int DeleteApplication
    txn OnCompletion
    ==
    bz not_deletion 
    byte "Creator" // verify creator is deleting app
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

// function to check for ASA opt in transaction
  check_asa_optin:
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
    retsub
    
///////////////////////////////////////////////////////////////////////
// OPEN - ORDER BOOK OPT IN & REGISTRATION
//   Placing an ASA Escrow Order. The escrow opts into the order book.
///////////////////////////////////////////////////////////////////////
    // TXN 0 - SELLER TO ESCROW:    pay transaction into escrow
    // TXN 1 - ESCROW TO ORDERBOOK: application opt in
    // TXN 2 - ESCROW TO ESCROW:    asset opt in
    // TXN 3 - SELLER TO ESCROW:    asset transfer

  open:
    int OptIn
    txn OnCompletion
    ==
    global GroupSize
    int 4
    ==
    &&
    assert
    
    gtxn 0 Sender
    gtxn 3 Sender
    ==
    assert

    int 0 //address index. This is the Sender of this transaction.
    txn ApplicationID //current smart contract
    txna ApplicationArgs 1 // 2nd txn app arg is order number
    app_local_get_ex    
    bnz ret_success // if the value already exists return without setting anything
    pop
    int 0 //address index. This is the Sender of this transaction.
    txna ApplicationArgs 1 //order number
    int 1 // value - just set to 1
    app_local_put // store the ordernumber as the key
    int 0 //address index. This is the Sender of this transaction.
    byte "creator" //creator key
    gtxn 0 Sender // store creator as value. This is the sender of the pay transaction 
    app_local_put
    int 0 //address index. This is the Sender of this transaction.
    byte "version" //store version
    txna ApplicationArgs 2 //version
    int 0
    getbyte
    app_local_put // store the version
  ret_success:
    int 1
    return

//////////////////////////////////////////////////////////////////////////////
// EXECUTE (partial)                                                        
//  Partial execution of an ASA escrow, where an ASA balance remains in it  
//////////////////////////////////////////////////////////////////////////////
    // TXN 0   - ESCROW TO ORDERBOOK: Application call to execute
    // TXN 1   - BUYER TO SELLER:     Pay transaction (from buyer/executor to escrow owner)
    // TXN 2   - BUYER TO BUYER:      (Optional) asset opt-in transaction (for buyer/executor)
    // TXN 2/3 - ESCROW TO BUYER:     Asset transfer (from escrow to buyer/executor)
    // TXN 3/4 - BUYER TO ESCROW:     Pay transaction for fee refund (from buyer/executor to escrow)

  execute:

    txn OnCompletion //FIXME check OnCompletion of each individual transaction
    int CloseOut
    ==
    txn OnCompletion
    int NoOp
    ==
    ||
    assert
    
    callsub check_asa_optin // this will store transaction offsets into registers if the asa opt-in exists or not

    txn Sender
    int 0 // foreign asset id 0
    asset_holding_get AssetBalance // pushes 1 for success, then asset onto stack
    assert //make sure asset exists
    load 2
    gtxns AssetAmount
    > // The asset balance should be greater than or equal to the amount transferred. Otherwise should be with closeout
    assert

    global GroupSize
    int 4
    ==
    global GroupSize //group size can be 5 for asset opt-in
    int 5
    ==
    ||
    assert

    gtxn 0 TypeEnum // First Transaction must be a call to a stateful contract
    int appl
    ==
    gtxn 1 TypeEnum // The second transaction must be a payment transaction
    int pay
    ==
    &&
    assert

    
    load 2
    gtxns TypeEnum //The next transaction must be an asset transfer
    int axfer
    ==
    assert
    load 3
    gtxns TypeEnum
    int pay
    ==
    assert

    int 0 // Escrow account containing order. This is the Sender of this transaction.
    txn ApplicationID // Current stateful smart contract
    txna ApplicationArgs 1 // 2nd argument is order number
    app_local_get_ex
    assert // If the value doesnt exists fail
    pop

    int 0 // Escrow account containing order. This is the Sender of this transaction.
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

    txn OnCompletion
    int CloseOut
    ==
    bz fail2

    callsub check_asa_optin // this will store transaction offsets into registers if the asa opt-in exists or not

    txn Sender
    int 0 // foreign asset id 0
    asset_holding_get AssetBalance // pushes 1 for success, then asset onto stack
    assert //make sure asset exists
    load 2
    gtxns AssetAmount
    == // Check we are going to transfer the entire ASA amount to the buyer. Otherwise should be a partial execute
    assert

    global GroupSize
    int 4
    ==
    global GroupSize //group size can be 5 for asset opt-in
    int 5
    ==
    ||
    assert

    gtxn 0 TypeEnum // First Transaction must be a call to a stateful contract
    int appl
    ==
    gtxn 1 TypeEnum // The second transaction must be a payment transaction
    int pay
    ==
    &&
    assert

    load 2
    gtxns TypeEnum //The next transaction must be an asset transfer
    int axfer
    ==
    assert

    load 3 // The last transaction must be a payment transfer
    gtxns TypeEnum
    int pay
    ==
    assert

    int 0 // Escrow account containing order. This is the Sender of this transaction.
    txn ApplicationID // Current stateful smart contract
    txna ApplicationArgs 1 // 2nd argument is order number
    app_local_get_ex
    bz fail2 // If the value doesnt exist fail
    pop

    int 0 // Escrow account containing order. This is the Sender of this transaction.
    txn ApplicationID // Current stateful smart contract
    byte "creator"
    app_local_get_ex // returns if it exists and the creator
    assert // If the value doesnt exist fail
    txna Accounts 1 // account arg is order creator
    ==
    assert

    int 0 // Escrow account containing order. This is the Sender of this transaction.
    txn ApplicationID // Current stateful smart contract
    byte "version"
    app_local_get_ex
    assert // If the value doesnt exists fail
    pop

    global ZeroAddress
    gtxn 1 CloseRemainderTo
    ==
    bnz ret_success3

    int 0 //escrow account containing order. This is the Sender of this transaction.
    txna ApplicationArgs 1 // order details
    app_local_del // Delete the ordernumber
    int 0 // escrow account containing order
    byte "creator"
    app_local_del // Delete the creator
    int 0 // escrow account containing order
    byte "version" // Delete the version
    app_local_del

  ret_success3:
    int 1
    return

  fail2:
    int 0
    return
    
    
    
    `;

    }
};

module.exports = AsaOrderbookTeal;
