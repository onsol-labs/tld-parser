'use strict';

import { EnumValues } from './EnumValues';

export const EVM_CHAINS = {
    MONAD: 'monad',
    MONAD_TESTNET: 'monad_testnet'
} as const;

export type EvmChainType = EnumValues<typeof EVM_CHAINS>;

export type EvmChainData = {
    chainId: number;
    rootContractAddress: string;
    registryContractAddress: string;
    /** ANS resolver contract address for text records */
    resolverAddress?: string;
    /** ANS reverse registrar address for reverse lookups */
    reverseRegistrarAddress?: string;
};

export type EvmChainConfig = { [key in EvmChainType]?: EvmChainData };
