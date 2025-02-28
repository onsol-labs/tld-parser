import {
    concat,
    ensNormalize,
    hexlify,
    keccak256,
    Network,
    toUtf8Bytes,
    ZeroHash,
} from 'ethers';
import { EVM_CHAIN_CONFIGS } from './constants';
import { EvmChainData } from './types/EvmChainData';

export class NetworkWithRpc extends Network {
    public rpcUrl: string;

    constructor(name: string, chainId: number, rpcUrl: string) {
        super(name, chainId);
        this.rpcUrl = rpcUrl;
    }
}

export function getValues<T extends Record<string, any>>(obj: T): [T[keyof T]] {
    return Object.values(obj) as [(typeof obj)[keyof T]];
}

export function configOfEvmChainId(
    chainId: number | undefined,
): EvmChainData | undefined {
    if (chainId === undefined) return undefined;

    const config = Object.values(EVM_CHAIN_CONFIGS).find(chainData => {
        return chainData.chainId === chainId;
    });

    if (config === undefined) {
        throw new Error(`ChainId ${chainId} is not currently supported`);
    }

    return config;
}

export function labelhashFromLabel(label: string): string {
    const labelhash = keccak256(toUtf8Bytes(label));
    return labelhash;
}

export function namehashFromDomain(domain: string): string {
    const label = ansNamehash(domain);
    return label;
}


export function ansNamehash(name: string): string {
    let result: string | Uint8Array = ZeroHash;

    const comps = ansNameSplit(name);
    while (comps.length) {
        result = keccak256(concat([ result, keccak256(<Uint8Array>(comps.pop()))] ));
    }

    return hexlify(result);
}


function ansNameSplit(name: string): Array<Uint8Array> {
    const bytes = toUtf8Bytes(ensNormalize(name));
    const comps: Array<Uint8Array> = [ ];

    if (name.length === 0) { return comps; }

    let last = 0;
    for (let i = 0; i < bytes.length; i++) {
        const d = bytes[i];

        // A separator (i.e. "."); copy this component including the dot
        if (d === 0x2e) {
            comps.push(bytes.slice(last, i));
            last = i + 1;
        }
    }

    comps.push(bytes.slice(last - 1));
    return comps;
}
