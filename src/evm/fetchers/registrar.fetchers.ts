'use strict';

import {
    Contract,
    ensNormalize,
    namehash as ensNamehash,
    Provider,
    Typed,
} from 'ethers';

import { Address } from '../types/Address';
import { EvmChainData } from '../types/EvmChainData';
import { labelhashFromLabel } from '../utils';

type NameData = {
    name: string;
    expiry: number;
    frozen: boolean;
};
export type UserNft = NameData & { id: bigint; url?: string };

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
    withTokenUrl?: boolean;
}): Promise<UserNft[]> {
    const { config, provider, registrarAddress, userAddress, withTokenUrl } =
        params;

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

    const nftData = await Promise.all(
        nfts.map(async tokenId => {
            const tokenDataRaw = (await contract.nameData(
                Typed.uint256(tokenId),
            )) as [unknown, unknown, unknown];

            const tokenUrl =
                withTokenUrl &&
                ((await contract.tokenURI(tokenId)) as unknown as string);
            return {
                name: tokenDataRaw[0] as string,
                expiry: parseInt(tokenDataRaw[1] as string),
                frozen: tokenDataRaw[2] as boolean,
                url: tokenUrl,
                id: tokenId,
            };
        }),
    );

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

async function getMainDomainRaw(params: {
    provider: Provider;
    address: Address;
    rootAddress: Address;
}): Promise<string | null> {
    const { provider, address, rootAddress } = params;

    if (!provider) throw Error('No provider');
    if (!address) throw Error('No address provided');
    if (!rootAddress) throw Error('No root address');

    try {
        const reverseNode = ensNamehash(
            address.substring(2).toLowerCase() + '.addr.reverse',
        );
        const resolverAddress = '0x741b2C8254495EbB84440A768bE0B5bACA62F6e8';

        const resolverContract = new Contract(
            resolverAddress,
            ['function name(bytes32) view returns (string)'],
            provider,
        );

        const mainDomain = await resolverContract.name(reverseNode);

        return mainDomain || null;
    } catch (error) {
        console.error('Error fetching primary ANS domain:', error);
        return null;
    }
}

export const registrarFetchers = {
    getNameData,
    getScData,
    getUsersNfts,
    getUserNftData,
    getMainDomainRaw,
};
