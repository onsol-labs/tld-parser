import { EVM_CHAINS, EvmChainConfig } from "./types/EvmChainData";

export const EVM_CHAIN_CONFIGS: EvmChainConfig = {
    [EVM_CHAINS.AMOY]: {
        chainId: 137,
        rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/NcyrcRlO9XKhgEjbgp2nBaOLf4EeCVBi',
        rootContractAddress: '0xcE00dF02E86870d1ED2CAaD82635832C2d32D90b',
        registryContractAddress: '0x4d4f5eB033E0E5ba6963C275dd337457d07E1484',
    }
}
