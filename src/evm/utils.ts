import { EVM_CHAIN_CONFIGS } from "./constants";
import { EvmChainData } from "./types/EvmChainData";

export function getValues<T extends Record<string, any>>(obj: T): [T[keyof T]] {
  return Object.values(obj) as [(typeof obj)[keyof T]]
}

export function configOfEvmChainId(
    chainId: number | undefined
  ): EvmChainData | undefined {
    if (chainId === undefined) return undefined;
  
    const config = Object.values(EVM_CHAIN_CONFIGS).find((chainData) => {
      return chainData.chainId === chainId;
    });
  
    if (config === undefined) {
      throw new Error(`ChainId ${chainId} is not currently supported`);
    }
  
    return config;
  }
