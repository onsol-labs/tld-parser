import { EVM_CHAINS, EvmChainConfig } from './types/EvmChainData';

export const EVM_CHAIN_CONFIGS: EvmChainConfig = {
    [EVM_CHAINS.AMOY]: {
        chainId: 137,
        rootContractAddress: '0xF000D4274ed78Ee8054dc5774e062e0E927f3b5A',
        registryContractAddress: '0xa8B8663F7f66301E2abc2fe3B18727f3a62769e7',
    },
};
