/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

module.exports = `
#pragma version 2
// This program clears program state.
// This will clear local state for any escrow accounts that call this from a ClearState transaction,
// the logic of which is contained within the stateless contracts as part of a Close Out (Cancel Order) operation.
// We use ClearState instead of CloseOut so that the order book cannot prevent an escrow from closing out.

int 1
`;
