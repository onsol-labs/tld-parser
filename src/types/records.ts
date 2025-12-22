/**
 * Unified Record enum for both SVM and EVM chains
 * SVM: Records are stored as sub-accounts (e.g., Twitter.miester.poor)
 * EVM: Records are stored in resolver contract (e.g., text(node, "com.twitter"))
 */
export enum Record {
    // Content/Storage
    IPFS = 'IPFS',
    ARWV = 'ARWV',
    Url = 'Url',

    // Crypto addresses
    SOL = 'SOL',
    ETH = 'ETH',
    BTC = 'BTC',
    APTOS = 'APTOS',
    NEAR = 'NEAR',
    STACKS = 'STACKS',
    BASE = 'BASE',
    SUI = 'SUI',
    LATTICA = 'Lattica',
    LTC = 'LTC',
    DOGE = 'DOGE',
    POINT = 'POINT',

    // Social
    Twitter = 'Twitter',
    Discord = 'Discord',
    Github = 'Github',
    Reddit = 'Reddit',
    Telegram = 'Telegram',

    // Profile
    Pic = 'Pic',
    Email = 'Email',
}

/**
 * Result type for batch record fetching
 */
export type RecordResult = {
    [key in Record]?: string | null;
};

/**
 * Options for avatar URL resolution
 */
export interface AvatarOptions {
    /** IPFS gateway URL (default: https://ipfs.io) */
    ipfsGateway?: string;
    /** Arweave gateway URL (default: https://arweave.net) */
    arweaveGateway?: string;
    /** NFT image gateway URL (default: https://alldomains.id) */
    nftGateway?: string;
}

/**
 * EVM-specific text record key mapping
 * Maps unified Record enum to ENS-style text record keys
 */
export const EVM_RECORD_KEYS: { [key in Record]: string } = {
    [Record.IPFS]: 'ipfs',
    [Record.ARWV]: 'arweave',
    [Record.Url]: 'url',
    [Record.SOL]: 'sol',
    [Record.ETH]: 'eth',
    [Record.BTC]: 'btc',
    [Record.APTOS]: 'aptos',
    [Record.NEAR]: 'near',
    [Record.STACKS]: 'stacks',
    [Record.BASE]: 'base',
    [Record.SUI]: 'sui',
    [Record.LATTICA]: 'lattica',
    [Record.LTC]: 'ltc',
    [Record.DOGE]: 'doge',
    [Record.POINT]: 'point',
    [Record.Twitter]: 'com.twitter',
    [Record.Discord]: 'com.discord',
    [Record.Github]: 'com.github',
    [Record.Reddit]: 'com.reddit',
    [Record.Telegram]: 'org.telegram',
    [Record.Pic]: 'avatar',
    [Record.Email]: 'email',
};

/**
 * All available record types as an array
 */
export const ALL_RECORDS: Record[] = Object.values(Record) as Record[];
