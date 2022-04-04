module.exports = `
#pragma version 2
// This program clears program state.
// This will clear local state for any escrow accounts that call this from a ClearState transaction,
// the logic of which is contained within the stateless contracts as part of a Close Out (Cancel Order) operation.
// We use ClearState instead of CloseOut so that the order book cannot prevent an escrow from closing out.

int 1
`;
