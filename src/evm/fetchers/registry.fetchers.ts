'use strict';

import { Contract, Provider } from 'ethers';

import { HexAddress } from '../types/Address';
import { EvmChainData } from '../types/EvmChainData';

type RecordData = {
    owner: HexAddress;
    resolver: HexAddress;
    ttl: bigint;
};

async function getDomainOwner(params: {
    node: string;
    config: EvmChainData;
    provider: Provider;
    registryAddress: HexAddress | undefined;
}): Promise<HexAddress> {
    const { node, config, provider, registryAddress } = params;
    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registryAddress) throw Error('No registrar address');

    const contract = new Contract(
        registryAddress,
        ['function owner(bytes32) view returns (address)'],
        provider,
    );
    const owner = await contract.owner(node);

    return owner;
}

async function getRecordData(params: {
    node: string;
    config: EvmChainData;
    provider: Provider;
    registryAddress: HexAddress | undefined;
}): Promise<RecordData> {
    const { node, config, provider, registryAddress } = params;
    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registryAddress) throw Error('No registrar address');

    const contract = new Contract(
        registryAddress,
        [
            'function owner(bytes32) view returns (address)',
            'function resolver(bytes32) view returns (address)',
            'function ttl(bytes32) view returns (uint256)',
        ],
        provider,
    );
    const owner = await contract.owner(node);
    const resolver = await contract.resolver(node);
    const ttl = await contract.ttl(node);

    return {
        owner,
        resolver,
        ttl: BigInt(ttl.toString()),
    };
}

export const registryFetchers = {
    getDomainOwner,
    getRecordData,
};
