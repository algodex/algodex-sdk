/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const AsaOrderbookTeal = {

 getASAOrderBookApprovalProgram : function getASAOrderBookApprovalProgram() {
    // stateful DEX contract
    // This is for the order book
    return `
//////////////////////////////////
// STATEFUL CONTRACT             /
//   ORDER BOOK FOR ASA ESCROWS  /
//////////////////////////////////

#pragma version 3
    // check if the app is being created
    // if so save creator

    int 0
    txn ApplicationID
    ==
    bz not_creation
    byte "Creator"
    txn Sender
    app_global_put
    //4 args on creation
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

////////////////////////////////
// OPEN                       //
////////////////////////////////
    //
    // TXN 0. - pay transaction into escrow (owner to escrow)
    // TXN 1. - application opt in (from escrow)
    // TXN 2. - asset opt in (from escrow)
    // TXN 3. - asset transfer (owner to escrow)

    open:
    int OptIn
    txn OnCompletion
    ==
    global GroupSize
    int 4
    ==
    &&
    assert
    
    int 0 //address index
    txn ApplicationID //current smart contract
    // 2nd txn app arg is order number
    txna ApplicationArgs 1
    app_local_get_ex
    // if the value already exists return without setting anything
    bnz ret_success
    pop
    // store the ordernumber as the key
    int 0 //address index
    txna ApplicationArgs 1 //order number
    int 1 // value - just set to 1
    app_local_put
    // store creator as value
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

///////////////////////////////
/// EXECUTE                 ///
///////////////////////////////
    // TXN 0            - Application call (from escrow) to execute
    // TXN 1            - Pay transaction (from buyer/executor to escrow owner)
    // (Optional) TXN 2 - Optional asset opt-in transaction (for buyer/executor)
    // TXN 2 or 3       - Asset transfer (from escrow owner to buyer/executor)
    // TXN 3 or 4       - Pay transaction (fee refund from buyer/executor to escrow owner)

    execute:

    txn OnCompletion //FIXME check OnCompletion of each individual transaction
    int CloseOut
    ==
    txn OnCompletion
    int NoOp
    ==
    ||
    assert

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

    // Check for asset opt-in
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
    // The last transaction must be a payment transfer
    //FIXME make sure it goes to right place!
    gtxns TypeEnum
    int pay
    ==
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
    bnz ret_success2

    // Delete the ordernumber
    int 0 //escrow account containing order
    txna ApplicationArgs 1 // order details
    app_local_del

    // Delete other info
    int 0 // escrow account containing order
    txna ApplicationArgs 2 // creator of order address
    app_local_del

    ret_success2:
    int 1
    return


/////////////////////////////////////////////
/// EXECUTE WITH CLOSEOUT                  //
/////////////////////////////////////////////
    // TXN 0            - Application call (from escrow) to execute_with_close
    // TXN 1            - Pay transaction (from buyer/executor to escrow owner)
    // (Optional) TXN 2 - Optional asset opt-in transaction (for buyer/executor)
    // TXN 2 or 3       - Asset transfer (from escrow owner to buyer/executor)
    //                            - closes out ASA to escrow owner as well
    // TXN 3 or 4       - Pay transaction to close out to escrow owner as well

    execute_with_closeout:

    txn OnCompletion
    int CloseOut
    ==
    bz fail2

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
    // The last transaction must be a payment transfer
    //FIXME make sure it goes to right place!
    gtxns TypeEnum
    int pay
    ==
    assert

    int 0 // Escrow account containing order
    txn ApplicationID // Current stateful smart contract
    txna ApplicationArgs 1 // 2nd argument is order number
    app_local_get_ex
    bz fail2 // If the value doesnt exist fail
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
    assert

    int 0 // Escrow account containing order
    txn ApplicationID // Current stateful smart contract
    byte "version"
    app_local_get_ex
    assert // If the value doesnt exists fail
    pop

    global ZeroAddress
    gtxn 1 CloseRemainderTo
    ==
    bnz ret_success3

    //FIXME: make sure 4th transaction goes back to escrow creator and for closeout!!!

    // Delete the ordernumber
    int 0 //escrow account containing order
    txna ApplicationArgs 1 // order details
    app_local_del
    // Delete other info
    int 0 // escrow account containing order
    byte "creator"
    app_local_del
    // Delete other info
    int 0 // escrow account containing order
    byte "version"
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
