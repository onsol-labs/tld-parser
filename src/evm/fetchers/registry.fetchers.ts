'use strict';

import { Contract, Provider } from 'ethers';

import { REGISTRY_ABI } from '../abis/registry.abi';
import { Address } from '../types/Address';
import { EvmChainData } from '../types/EvmChainData';

type RecordData = {
    owner: Address;
    resolver: Address;
    ttl: bigint;
};

async function getDomainOwner(params: {
    node: string;
    config: EvmChainData;
    provider: Provider;
    registryAddress: Address | undefined;
}): Promise<Address> {
    const { node, config, provider, registryAddress } = params;
    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registryAddress) throw Error('No registrar address');

    const contract = new Contract(registryAddress, REGISTRY_ABI, provider);
    const owner = await contract.owner(node);

    return owner;
}

async function getRecordData(params: {
    node: string;
    config: EvmChainData;
    provider: Provider;
    registryAddress: Address | undefined;
}): Promise<RecordData> {
    const { node, config, provider, registryAddress } = params;
    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registryAddress) throw Error('No registrar address');

    const contract = new Contract(registryAddress, REGISTRY_ABI, provider);
    const owner = await contract.owner(node);
    const resolver = await contract.resolver(node);
    const ttl = await contract.ttl(node);

    return {
        owner,
        resolver,
        ttl: BigInt(ttl.toString()),
    };
}

// async function burnNft(params: {
//     tokenId: bigint;
//     config: EvmChainData;
//     walletProvider: Eip1193Provider;
//     registrarAddress: Address | undefined;
// }): Promise<string> {
//     const { walletProvider, config, registrarAddress, tokenId } = params;

//     if (!walletProvider) throw Error('User disconnected');
//     if (!config) throw Error('Not connected to SmartContract');
//     if (!registrarAddress) throw Error('No registrar address');

//     const ethersProvider = new BrowserProvider(walletProvider);
//     const signer = await ethersProvider.getSigner();

//     const contract = new Contract(registrarAddress, REGISTRAR_ABI, signer);
//     const tx = await contract.burn(tokenId);
//     await tx.wait();

//     return tx.hash;
// }

export const registryFetchers = {
    getDomainOwner,
    getRecordData,
};
