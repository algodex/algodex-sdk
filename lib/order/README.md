/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////


Transaction Types

There are 4 smart contracts: 

===========================================================

ALGO ESCROWS (orders to buy ASAs via escrow accounts) - STATELESS contract

- Only algos are stored in these escrows

Algo escrow contracts are created by makers who wish to buy an ASA, and put algos into an escrow account. A taker must execute the trade by withdrawing the algos from the escrow and sending the ASA to the escrow owner. The price must be met. For partial executions, the fees must also be reimbursed by the taker.

===========================================================

ASA ESCROWS (orders to sell ASAs via escrow accounts) - STATELESS contract
- Minimum algo balance of 0.46 algos is stored in these escrows
- ASA listed for sale is also stored

ASA escrow contracts are created by makers who wish to sell an ASA, and put a minimum algo balance plus the ASA into an escrow account. A taker must execute the trade by withdrawing the ASA from the escrow and sending algos to the escrow owner. The price must be met. For partial executions, the fees must also be reimbursed by the taker. After full executions, the algo minimum balance is returned to the order creator.

============================================================

ALGO ORDER BOOK - STATEFUL contract

This contains the order information for all "Algo Escrows", which are buy orders of assets. The algo escrows opt-in to the Algo Order Book when they are created.

============================================================

ASA ORDER BOOK - STATEFUL contract
  
This contains the order information for all "ASA Escrows", which are sell orders of assets. The ASAs escrows opt-in to the ASA Order Book when they are created.

============================================================

The order books per entry store these three things:


1. n-d-min-assetid

  d: price denominator
  n: price numerator
  min: minimum order execution size. hard-coded to 0 and can be ignored
  assetid: this is the Algorand asset id
  
  d/n is the price of the asset in terms of algos. For example, n=100 and d=130 implies it costs 1.3 microalgos to buy one unit of the ASA.
  
2. creator

This is the creator and owner of the escrow, and is set to the wallet address of that person

3. version

This is the version of the escrow, in case we need to change the escrow versions after the product is released.
  
============================================================

ALGO ESCROW TRANSACTION TYPES
  These are each atomic groups of transactions, so all must succeed together, or all will fail.

///////////////////////////
/// ORDER BOOK OPT IN & REGISTRATION
//////////////////////////
    // TXN 0 - Pay from order creator to escrow account
    // TXN 1 - Stateful app opt-in to order book
    // TXN 2 - Possible ASA opt-in for the order creator's original wallet account. Doesn't need checks
	
////////////////////////////////////////
//// CLOSEOUT (ORDER CANCELLED) ////////
////////////////////////////////////////
    // TXN 0 - application call to order book contract for closeout
    // TXN 1 - close out call
    // TXN 2 - send transaction for proof that closeout sender owns the escrow

///////////////////////////////
// PAY (ORDER EXECUTION)
//   WITH CLOSEOUT
/////////////////////////////////
    // TXN 0 - transaction must be a call to a stateful contract
    // TXN 1 - Payment transaction from this escrow (buyer) to seller
    // TXN 2 - Asset transfer from seller to owner of this escrow
	
///////////////////////////////////
// PAY (ORDER EXECUTION)
//   PARTIAL EXECUTION
/////////////////////////////////
    // TXN 0 - transaction must be a call to a stateful contract
    // TXN 1 - Payment transaction from this escrow (buyer) to seller
    // TXN 2 - Asset transfer from seller to owner of this escrow
    // TXN 3 - fee refund transaction (pay transaction)
	
============================================================

ASA ESCROW TRANSACTION TYPES
  These are each atomic groups of transactions, so all must succeed together, or all will fail.

////////////////////////
// OPT IN
/////////////////////
    // TXN 0. - pay transaction into escrow (owner to escrow)
    // TXN 1. - application opt in (from escrow)
    // TXN 2. - asset opt in (from escrow)
    // TXN 3. - asset transfer (owner to escrow)
	
///////////////////////
/// CLOSE ORDER
//////////////////////
    // TXN 0. - app call to close order
    // TXN 1. - asset transfer (escrow to owner)
    // TXN 2. - pay transaction (from escrow to owner)
    // TXN 3. - proof pay transaction (owner to owner) - proof of ownership

////////////////////////////////
// EXECUTE
///////////////////////////////
    // TXN 0            - Application call (from escrow) to execute
    // TXN 1            - Pay transaction (from buyer/executor to escrow owner)
    // (Optional) TXN 2 - Optional asset opt-in transaction (for buyer/executor)
    // TXN 2 or 3       - Asset transfer (from escrow owner to buyer/executor)
    // TXN 3 or 4       - Pay transaction (fee refund from buyer/executor to escrow owner)
	
///////////////////////////////////////
// EXECUTE WITH CLOSE
//////////////////////////////////////
	// TXN 0            - Application call (from escrow) to execute_with_close
	// TXN 1            - Pay transaction (from buyer/executor to escrow owner)
	// (Optional) TXN 2 - Optional asset opt-in transaction (for buyer/executor)
	// TXN 2 or 3       - Asset transfer (from escrow owner to buyer/executor)
	//                            - closes out ASA to escrow owner as well
	// TXN 3 or 4       - Pay transaction to close out to escrow owner as well	
	
