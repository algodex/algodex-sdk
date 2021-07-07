function getOrderBookApprovalProgram() {
// stateful DEX contract
// This is for the order book
return `
//////////////////////////////////
// STATEFUL CONTRACT
//   ORDER BOOK FOR ALGO ESCROWS
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

int 1
return
not_creation:
// check if this is deletion transaction
int DeleteApplication
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
//---
// check if this is update ---
int UpdateApplication
txn OnCompletion
==
bz not_update
// verify that the creator is
// making the call
byte "Creator"
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
byte "close"
==
bnz close
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
open:

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

////////////
// CLOSE   /
////////////
close:
txn OnCompletion
int CloseOut
==
global GroupSize // only works for app call
int 3
==
&&
assert
int 0 //account that opened order
gtxn  0 ApplicationID //current smart contract
gtxna 0 ApplicationArgs 1 // order number
app_local_get_ex
assert
pop
int 0 //account that opened order
gtxn 0  ApplicationID //current smart contract
byte "creator" //order creator account number
app_local_get_ex
assert
pop
int 0 //account that opened order
gtxn 0  ApplicationID //current smart contract
byte "version" //order creator account number
app_local_get_ex
assert
pop
int 0
byte "creator"
app_local_get // check creator matches expectation
gtxn 1 CloseRemainderTo
==
assert
int 0
byte "creator"
app_local_get // check creator matches expectation
gtxn 1 Receiver
==
assert
int 0
byte "creator"
app_local_get // check creator matches expectation
gtxn 2 Sender
==
assert

// delete the ordernumber
int 0 //escrow account that opened order
txna ApplicationArgs 1 // limit order number
app_local_del // delete the original account number
int 0 //escrow account that opened order
byte "creator" // original limit order creator account
app_local_del
int 0 //escrow account that opened order
byte "version"
app_local_del

int 1
return


/////////////
/// EXECUTE /
/////////////
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

////////////////////////
/// EXECUTE WITH CLOSEOUT /
///////////////////////
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

window.getOrderBookApprovalProgram = getOrderBookApprovalProgram;