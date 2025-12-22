import { AvatarOptions } from '../types/records';

const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io';
const DEFAULT_ARWEAVE_GATEWAY = 'https://arweave.net';
const DEFAULT_NFT_GATEWAY = 'https://alldomains.id/api';

/**
 * Resolve avatar record to HTTP-accessible URL
 * Handles: ipfs://, ar://, arwv://, http(s)://, data:, and NFT formats
 *
 * NFT formats supported:
 * - mpl:<mint> - Metaplex Token Metadata
 * - core:<asset> - Metaplex Core
 * - eip155:<chainId>/<type>:<contract>/<tokenId> - EVM NFTs (ERC-721/ERC-1155)
 *
 * @param record The raw avatar record value
 * @param options Gateway URLs for IPFS/Arweave/NFT
 * @returns HTTP-accessible URL or null
 */
export function resolveAvatarUrl(
    record: string,
    options?: AvatarOptions,
): string | null {
    if (!record) return null;

    const ipfsGateway = options?.ipfsGateway ?? DEFAULT_IPFS_GATEWAY;
    const arweaveGateway = options?.arweaveGateway ?? DEFAULT_ARWEAVE_GATEWAY;
    const nftGateway = options?.nftGateway ?? DEFAULT_NFT_GATEWAY;

    // Already HTTP(S)
    if (record.startsWith('http://') || record.startsWith('https://')) {
        return record;
    }

    // IPFS with protocol
    if (record.startsWith('ipfs://')) {
        const cid = record.slice(7);
        return `${ipfsGateway}/ipfs/${cid}`;
    }

    // Raw IPFS CID (Qm... for CIDv0 or bafy... for CIDv1)
    if (record.startsWith('Qm') || record.startsWith('bafy')) {
        return `${ipfsGateway}/ipfs/${record}`;
    }

    // Arweave with ar:// protocol
    if (record.startsWith('ar://')) {
        const txId = record.slice(5);
        return `${arweaveGateway}/${txId}`;
    }

    // Arweave with arwv:// protocol (ANS-style)
    if (record.startsWith('arwv://')) {
        const txId = record.slice(7);
        return `${arweaveGateway}/${txId}`;
    }

    // Metaplex Token Metadata NFT (mpl:<mint>)
    if (record.startsWith('mpl:')) {
        const mint = record.slice(4);
        return `${nftGateway}/nft/mpl/${mint}`;
    }

    // Metaplex Core NFT (core:<asset>)
    if (record.startsWith('core:')) {
        const asset = record.slice(5);
        return `${nftGateway}/nft/core/${asset}`;
    }

    // EVM NFT - EIP-155/CAIP-22 format (eip155:<chainId>/<type>:<contract>/<tokenId>)
    if (record.startsWith('eip155:')) {
        return `${nftGateway}/nft/evm/${encodeURIComponent(record)}`;
    }

    // Data URI (pass through)
    if (record.startsWith('data:')) {
        return record;
    }

    // Unknown format, return as-is (might be a direct URL or raw value)
    return record;
}
