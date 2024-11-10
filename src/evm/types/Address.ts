"use strict";

import { isAddress } from 'ethers';
import { z } from 'zod';

export type Address = `0x${string}`

export const AddressSchema = z.string().refine((val) => {
  return isAddress(val)
}, 'Not a valid ethereum address')