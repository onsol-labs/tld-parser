import { Contract, Provider } from 'ethers';
import { Address } from '../types/Address';

/**
 * ABI for text record resolution
 */
const TEXT_RESOLVER_ABI = [
    'function text(bytes32 node, string key) view returns (string)',
];

/**
 * ABI for reverse name resolution
 */
const NAME_RESOLVER_ABI = [
    'function name(bytes32 node) view returns (string)',
];

/**
 * ABI for getting resolver address from registry
 */
const REGISTRY_RESOLVER_ABI = [
    'function resolver(bytes32 node) view returns (address)',
];

/**
 * Get a text record from the resolver contract
 *
 * @param provider Ethers provider
 * @param resolverAddress Resolver contract address
 * @param namehash The namehash of the domain
 * @param key The text record key (e.g., "com.twitter", "avatar")
 * @returns The text record value or null
 */
export async function getTextRecord(
    provider: Provider,
    resolverAddress: Address,
    namehash: string,
    key: string,
): Promise<string | null> {
    try {
        const resolver = new Contract(
            resolverAddress,
            TEXT_RESOLVER_ABI,
            provider,
        );
        const result = await resolver.text(namehash, key);
        return result || null;
    } catch {
        return null;
    }
}

/**
 * Get reverse name from the resolver contract
 *
 * @param provider Ethers provider
 * @param resolverAddress Resolver contract address
 * @param reverseNode The reverse node hash
 * @returns The resolved name or null
 */
export async function getReverseName(
    provider: Provider,
    resolverAddress: Address,
    reverseNode: string,
): Promise<string | null> {
    try {
        const resolver = new Contract(
            resolverAddress,
            NAME_RESOLVER_ABI,
            provider,
        );
        const result = await resolver.name(reverseNode);
        return result || null;
    } catch {
        return null;
    }
}

/**
 * Get the resolver address for a name from the registry
 *
 * @param provider Ethers provider
 * @param registryAddress Registry contract address
 * @param namehash The namehash of the domain
 * @returns The resolver address or null
 */
export async function getResolverForName(
    provider: Provider,
    registryAddress: Address,
    namehash: string,
): Promise<Address | null> {
    try {
        const registry = new Contract(
            registryAddress,
            REGISTRY_RESOLVER_ABI,
            provider,
        );
        const result = await registry.resolver(namehash);
        return result === '0x0000000000000000000000000000000000000000'
            ? null
            : result;
    } catch {
        return null;
    }
}

export const resolverFetchers = {
    getTextRecord,
    getReverseName,
    getResolverForName,
};
