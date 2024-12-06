'use strict';

import { Contract, ensNormalize, Provider, Typed } from 'ethers';

import { Address } from '../types/Address';
import { EvmChainData } from '../types/EvmChainData';
import { labelhashFromLabel } from '../utils';

type NameData = {
    name: string;
    expiry: number;
    frozen: boolean;
};
export type UserNft = NameData & { id: bigint; url: string };

type ScData = {
    name: string;
    owner: Address;
    tldNode: string;
    symbol: string;
    baseUrl: string;
    gracePeriod: number;
    tldFrozen: boolean;
    defaultTTL: number;
};

async function getNameData(params: {
    name: string;
    config: EvmChainData;
    provider: Provider;
    registrarAddress: Address | undefined;
}): Promise<NameData> {
    const { name, config, provider, registrarAddress } = params;
    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const contract = new Contract(
        registrarAddress,
        ['function nameData(string) view returns ((string, uint256, bool))'],
        provider,
    );
    const nameData = await contract.nameData(name);

    return nameData;
}

async function getScData(params: {
    config: EvmChainData;
    provider: Provider;
    registrarAddress: Address | undefined;
}): Promise<ScData> {
    const { config, provider, registrarAddress } = params;

    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const contract = new Contract(
        registrarAddress,
        [
            'function name() view returns (string)',
            'function owner() view returns (address)',
            'function tldNode() view returns (string)',
            'function symbol() view returns (string)',
            'function baseUri() view returns (string)',
            'function gracePeriod() view returns (uint256)',
            'function allFrozen() view returns (bool)',
            'function defaultTTL() view returns (uint256)',
        ],
        provider,
    );

    const name = (await contract.name()) as unknown as string;
    const owner = (await contract.owner()) as unknown as string;
    const tldNode = (await contract.tldNode()) as unknown as string;
    const symbol = (await contract.symbol()) as unknown as string;
    const baseUrl = (await contract.baseUri()) as unknown as string;
    const gracePeriod = (await contract.gracePeriod()) as unknown as bigint;
    const tldFrozen = (await contract.allFrozen()) as unknown as boolean;
    const defaultTTL = (await contract.defaultTTL()) as unknown as bigint;

    return {
        name,
        owner: owner as Address,
        tldNode,
        symbol,
        baseUrl,
        gracePeriod: parseInt(gracePeriod.toString()),
        tldFrozen,
        defaultTTL: parseInt(defaultTTL.toString()),
    };
}

async function getUsersNfts(params: {
    config: EvmChainData;
    provider: Provider;
    registrarAddress: Address | undefined;
    userAddress: Address | undefined;
}): Promise<UserNft[]> {
    const { config, provider, registrarAddress, userAddress } = params;

    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');
    if (!userAddress) throw Error('No user address');

    const contract = new Contract(
        registrarAddress,
        [
            'function getUserNfts(address) view returns (uint256[])',
            'function nameData(uint256) view returns ((string, uint256, bool))',
            'function tokenURI(uint256) view returns (string)',
        ],
        provider,
    );

    const nfts = await contract.getUserNfts(userAddress);

    const nftData = [] as UserNft[];
    for (let i = 0; i < nfts.length; i++) {
        const tokenId = nfts[i];
        const tokenDataRaw = (await contract.nameData(
            Typed.uint256(tokenId),
        )) as [unknown, unknown, unknown];
        const tokenUrl = (await contract.tokenURI(
            tokenId,
        )) as unknown as string;

        nftData.push({
            name: tokenDataRaw[0] as string,
            expiry: parseInt(tokenDataRaw[1] as string),
            frozen: tokenDataRaw[2] as boolean,
            id: tokenId,
            url: tokenUrl,
        });
    }

    return nftData;
}

async function getUserNftData(params: {
    config: EvmChainData;
    provider: Provider;
    registrarAddress: Address | undefined;
    domain: string;
}) {
    const { config, provider, registrarAddress, domain } = params;
    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const contract = new Contract(
        registrarAddress,
        [
            'function nameData(uint256) view returns ((string, uint256, bool))',
            'function tokenURI(uint256) view returns (string)',
        ],
        provider,
    );

    // Step 1 - convert full domain to only the name of the domain (e.g. domain.eth -> domain)
    const normalized = ensNormalize(domain);
    const label = normalized.split('.')[0];
    const labelHash = labelhashFromLabel(label);

    // Step 2 - convert node to tokenId
    const tokenId = Typed.uint256(labelHash);

    // Step 3 - get the token data
    const tokenDataRaw = (await contract.nameData(tokenId)) as [
        unknown,
        unknown,
        unknown,
    ];
    const tokenUrl = (await contract.tokenURI(tokenId)) as unknown as string;

    return {
        name: tokenDataRaw[0] as string,
        expiry: BigInt(tokenDataRaw[1] as string),
        frozen: tokenDataRaw[2] as boolean,
        id: tokenId,
        url: tokenUrl,
    };
}

export const registrarFetchers = {
    getNameData,
    getScData,
    getUsersNfts,
    getUserNftData,
};
