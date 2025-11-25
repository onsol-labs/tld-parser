'use strict';

import { EnumValues } from './EnumValues';

export const EVM_CHAINS = {
    SEPOLIA: 'sepolia',
    AMOY: 'amoy',
    MONAD: 'monad',
    MONAD_TESTNET: 'monad_testnet'
} as const;

export type EvmChainType = EnumValues<typeof EVM_CHAINS>;

export type EvmChainData = {
    chainId: number;
    rootContractAddress: string;
    registryContractAddress: string;
};

export type EvmChainConfig = { [key in EvmChainType]?: EvmChainData };
