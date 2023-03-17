/// <reference types="node" />
import { PublicKey } from '@solana/web3.js';
/**
 * This function can be used to compute the public key of a domain or subdomain and multi-level subdomain.
 * @param domainTld The domain to compute the public key for (e.g `vlad.poor`, `ipfs.miester.poor`, 'ipfs.super.miester.poor')
 * @returns
 */
export declare const getDomainKey: (domainTld: string, record?: boolean) => Promise<{
    isSub: boolean;
    parent: PublicKey;
    pubkey: PublicKey;
    hashed: Buffer;
} | {
    isSub: boolean;
    parent: PublicKey;
    isSubRecord: boolean;
    pubkey: PublicKey;
    hashed: Buffer;
}>;
//# sourceMappingURL=name-record-handler.d.ts.map