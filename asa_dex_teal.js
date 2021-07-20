/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const AsaOrderbookTeal = {

getClearProgram : function getClearProgram() {
    const clearProgram = 
            `
#pragma version 2
// This program clears program state
int 1
`
;
return clearProgram;
},

getASAOrderBookApprovalProgram : function getASAOrderBookApprovalProgram() {
    // stateful DEX contract
    // This is for the order book
    return `
//////////////////////////////////
// STATEFUL CONTRACT             /
//   ORDER BOOK FOR ASA ESCROWS  /
//////////////////////////////////

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

  check_asa_optin:
    gtxn 2 TypeEnum // Check for asset opt-in
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
    store 0 //this will store the next transaction offset if opt-in exists
    load 0
    int 2
    +
    store 2 // store offset of 2nd transaction, depending on if opt-in exists
    
    load 0
    int 3
    +
    store 3 // store offset of 3rd transaction, depending on if opt-in exists
    retsub
    
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
    txna ApplicationArgs 1 // 2nd txn app arg is order number
    app_local_get_ex    
    bnz ret_success // if the value already exists return without setting anything
    pop
    int 0 //address index
    txna ApplicationArgs 1 //order number
    int 1 // value - just set to 1
    app_local_put // store the ordernumber as the key
    int 0 //address index
    byte "creator" //creator key
    gtxn 0 Sender // store creator as value
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

    int 0 //escrow account containing order
    txna ApplicationArgs 1 // Delete the order details
    app_local_del

    int 0 // escrow account containing order
    txna ApplicationArgs 2 // Delete the creator of order address
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

    int 0 //escrow account containing order
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
