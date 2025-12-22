import { EVM_CHAINS, EvmChainConfig } from './types/EvmChainData';

export const EVM_CHAIN_CONFIGS: EvmChainConfig = {
    [EVM_CHAINS.MONAD]: {
        chainId: 143,
        rootContractAddress: '0xE6d461c863987F2a1096eA3476137F30f75B3d46',
        registryContractAddress: '0xa4338eadf4D2e0851eFb225b0Eab90bE47A095F1',
        // ANS resolver contracts
        resolverAddress: '0x314582158A0a72802aD8F6EeE6243C73dCf1F562',
        reverseRegistrarAddress: '0x270BC6b51006F4C5cbe1c38238a0cC6CAeCFbff1',
    },
    [EVM_CHAINS.MONAD_TESTNET]: {
        chainId: 10143,
        rootContractAddress: '0xE6d461c863987F2a1096eA3476137F30f75B3d46',
        registryContractAddress: '0xa4338eadf4D2e0851eFb225b0Eab90bE47A095F1',
        resolverAddress: undefined,
        reverseRegistrarAddress: undefined,
    },
};
