'use strict';

import { isAddress } from 'ethers';

export type HexAddress = `0x${string}`;

export function isValidAddress(address: string): boolean {
    return isAddress(address);
}
