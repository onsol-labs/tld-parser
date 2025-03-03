import { EVM_CHAINS, EvmChainConfig } from './types/EvmChainData';

export const EVM_CHAIN_CONFIGS: EvmChainConfig = {
    [EVM_CHAINS.MONAD]: {
        chainId: 10143,
        rootContractAddress: '0xE6d461c863987F2a1096eA3476137F30f75B3d46',
        registryContractAddress: '0xa4338eadf4D2e0851eFb225b0Eab90bE47A095F1',
    },
};
