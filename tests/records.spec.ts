import { resolveAvatarUrl } from '../src/utils/avatar';
import { Record, EVM_RECORD_KEYS, ALL_RECORDS } from '../src/types/records';
import { getReverseNode } from '../src/evm/utils';

describe('Avatar Resolution', () => {
    it('should resolve ipfs:// URLs to gateway', () => {
        const result = resolveAvatarUrl('ipfs://QmXxxx');
        expect(result).toEqual('https://ipfs.io/ipfs/QmXxxx');
    });

    it('should resolve raw IPFS CIDv0 (Qm...)', () => {
        const result = resolveAvatarUrl('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
        expect(result).toEqual(
            'https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        );
    });

    it('should resolve raw IPFS CIDv1 (bafy...)', () => {
        const result = resolveAvatarUrl('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi');
        expect(result).toEqual(
            'https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        );
    });

    it('should resolve ar:// URLs to Arweave gateway', () => {
        const result = resolveAvatarUrl('ar://Ny-0nK4FFp55qafhMpKQMtOcCrihiSxWsztAZ2fp6-g');
        expect(result).toEqual(
            'https://arweave.net/Ny-0nK4FFp55qafhMpKQMtOcCrihiSxWsztAZ2fp6-g',
        );
    });

    it('should resolve arwv:// URLs to Arweave gateway', () => {
        const result = resolveAvatarUrl('arwv://Ny-0nK4FFp55qafhMpKQMtOcCrihiSxWsztAZ2fp6-g');
        expect(result).toEqual(
            'https://arweave.net/Ny-0nK4FFp55qafhMpKQMtOcCrihiSxWsztAZ2fp6-g',
        );
    });

    it('should pass through http(s) URLs unchanged', () => {
        const httpUrl = 'http://example.com/avatar.png';
        const httpsUrl = 'https://example.com/avatar.png';

        expect(resolveAvatarUrl(httpUrl)).toEqual(httpUrl);
        expect(resolveAvatarUrl(httpsUrl)).toEqual(httpsUrl);
    });

    it('should pass through data: URIs unchanged', () => {
        const dataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0';
        expect(resolveAvatarUrl(dataUri)).toEqual(dataUri);
    });

    it('should use custom IPFS gateway', () => {
        const result = resolveAvatarUrl('ipfs://QmXxxx', {
            ipfsGateway: 'https://cloudflare-ipfs.com',
        });
        expect(result).toEqual('https://cloudflare-ipfs.com/ipfs/QmXxxx');
    });

    it('should use custom Arweave gateway', () => {
        const result = resolveAvatarUrl('ar://txId', {
            arweaveGateway: 'https://custom-arweave.net',
        });
        expect(result).toEqual('https://custom-arweave.net/txId');
    });

    it('should return null for empty record', () => {
        expect(resolveAvatarUrl('')).toBeNull();
    });

    it('should return unknown formats as-is', () => {
        const unknown = 'some-random-value';
        expect(resolveAvatarUrl(unknown)).toEqual(unknown);
    });

    it('should resolve mpl: Metaplex NFT to gateway', () => {
        const result = resolveAvatarUrl('mpl:7EWJNaNYfPYMaqzdAAa4ps5kpqW95B7VHsjhW1kr18sj');
        expect(result).toEqual(
            'https://alldomains.id/api/nft/mpl/7EWJNaNYfPYMaqzdAAa4ps5kpqW95B7VHsjhW1kr18sj',
        );
    });

    it('should resolve core: Metaplex Core NFT to gateway', () => {
        const result = resolveAvatarUrl('core:AssetXxxx123');
        expect(result).toEqual('https://alldomains.id/api/nft/core/AssetXxxx123');
    });

    it('should resolve eip155: EVM NFT to gateway', () => {
        const result = resolveAvatarUrl(
            'eip155:1/erc721:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/1234',
        );
        expect(result).toEqual(
            'https://alldomains.id/api/nft/evm/eip155%3A1%2Ferc721%3A0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d%2F1234',
        );
    });

    it('should use custom NFT gateway', () => {
        const result = resolveAvatarUrl('mpl:mintAddress', {
            nftGateway: 'https://custom-nft.example.com',
        });
        expect(result).toEqual('https://custom-nft.example.com/nft/mpl/mintAddress');
    });
});

describe('Record Types', () => {
    it('should have all expected record types', () => {
        expect(Record.Twitter).toEqual('Twitter');
        expect(Record.Discord).toEqual('Discord');
        expect(Record.Github).toEqual('Github');
        expect(Record.Pic).toEqual('Pic');
        expect(Record.Email).toEqual('Email');
        expect(Record.IPFS).toEqual('IPFS');
        expect(Record.SOL).toEqual('SOL');
        expect(Record.ETH).toEqual('ETH');
    });

    it('should have correct EVM key mappings', () => {
        expect(EVM_RECORD_KEYS[Record.Twitter]).toEqual('com.twitter');
        expect(EVM_RECORD_KEYS[Record.Discord]).toEqual('com.discord');
        expect(EVM_RECORD_KEYS[Record.Github]).toEqual('com.github');
        expect(EVM_RECORD_KEYS[Record.Telegram]).toEqual('org.telegram');
        expect(EVM_RECORD_KEYS[Record.Pic]).toEqual('avatar');
        expect(EVM_RECORD_KEYS[Record.Email]).toEqual('email');
    });

    it('should have ALL_RECORDS array with all records', () => {
        expect(ALL_RECORDS).toContain(Record.Twitter);
        expect(ALL_RECORDS).toContain(Record.Pic);
        expect(ALL_RECORDS).toContain(Record.SOL);
        expect(ALL_RECORDS.length).toBeGreaterThan(20);
    });
});

describe('EVM Utilities', () => {
    it('should compute reverse node for address', () => {
        // The reverse node should be a valid hex hash
        const reverseNode = getReverseNode('0x94Bfb92da83B27B39370550CA038Af96d182462f');
        expect(reverseNode).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should handle address with or without 0x prefix', () => {
        const withPrefix = getReverseNode('0x94Bfb92da83B27B39370550CA038Af96d182462f');
        const withoutPrefix = getReverseNode('94Bfb92da83B27B39370550CA038Af96d182462f');
        expect(withPrefix).toEqual(withoutPrefix);
    });

    it('should be case-insensitive', () => {
        const lower = getReverseNode('0x94bfb92da83b27b39370550ca038af96d182462f');
        const upper = getReverseNode('0x94BFB92DA83B27B39370550CA038AF96D182462F');
        expect(lower).toEqual(upper);
    });
});
