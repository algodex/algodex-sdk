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
//4 args on creation
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

//int OptIn
//txn OnCompletion
//==
//bz not_optin
//int 1
//return
//not_optin:

// the call support
// either open, close or execute
// every call has two/three params
//txn NumAppArgs
//int 2
//==
//bz fail
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
// only works for app call
// IMPORTANT TODO: Check both transactions in group
// for this open call to prevent
// bad orders from being entered into the order book
int OptIn
txn OnCompletion
==
assert
//global GroupSize
//int 2
//==
//bz fail
int 0 //sender
txn ApplicationID //current smart contract
// 2nd arg is order number
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
// store creator as a key
int 0 //address index
txna ApplicationArgs 2 //creator address
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
// only works for app call
global GroupSize
int 2
==
assert
pop
int 0 //account that opened order
gtxn  0 ApplicationID //current smart contract
gtxna 0 ApplicationArgs 1 // order number
app_local_get_ex
// if the value doesnt exist fail
assert
pop
int 0 //account that opened order
gtxn 0  ApplicationID //current smart contract
gtxn 0  ApplicationArgs 2 //order creator account number
app_local_get_ex
// if the value doesnt exist fail
assert

// delete the ordernumber
int 0 //escrow account that opened order
txna ApplicationArgs 1 // limit order number
app_local_del
// delete the original account number
int 0 //escrow account that opened order
txna ApplicationArgs 2 // original limit order creator account
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
// Must be three transacitons
global GroupSize
int 4
==
// First Transaction must be a call to a stateful contract
gtxn 0 TypeEnum
int appl
==
&&
// The second transaction must be a payment transaction
gtxn 1 TypeEnum
int pay
==
&&
// The third transaction must be an asset transfer
gtxn 2 TypeEnum
int axfer
==
&&
// The fourth transaction must be a payment transaction to refund escrow fees
// FIXME check amounts
gtxn 3 TypeEnum
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
txna ApplicationArgs 2 // 3rd argument is order creator
app_local_get_ex
assert // If the value doesnt exists fail
pop

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
// Must be three transacitons
global GroupSize
int 3
==
// First Transaction must be a call to a stateful contract
gtxn 0 TypeEnum
int appl
==
&&
// The second transaction must be a payment transaction
gtxn 1 TypeEnum
int pay
==
&&
// The third transaction must be an asset transfer
gtxn 2 TypeEnum
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
txna ApplicationArgs 2 // 3rd argument is order creator
app_local_get_ex
assert // If the value doesnt exists fail
pop

// Delete the ordernumber
int 0 //escrow account containing order
txna ApplicationArgs 1 // order details
app_local_del

// Delete other info
int 0 // escrow account containing order
txna ApplicationArgs 2 // creator of order address
app_local_del

int 1
return

`;

    }

window.getOrderBookApprovalProgram = getOrderBookApprovalProgram;