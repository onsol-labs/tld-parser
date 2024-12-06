'use strict';

import { Contract, Provider } from 'ethers';

import { Address } from '../types/Address';
import { EvmChainData } from '../types/EvmChainData';

export type TLD = {
    controller: Address;
    registrar: Address;
    tld: string;
    name: string;
    symbol: string;
    locked: boolean;
    node: string;
    label: string;
};

export type PriceSchema = {
    for1: number;
    for2: number;
    for3: number;
    for4: number;
    for5plus: number;
};

export type SplitSchema = {
    percentage: number;
    recipient: Address;
};

async function getRegistryAddress(params: {
    config: EvmChainData;
    provider: Provider;
}): Promise<Address> {
    const { provider, config } = params;

    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');

    const contract = new Contract(
        config.rootContractAddress,
        ['function registry() view returns (address)'],
        provider,
    );

    const address = await contract.registry();

    return address;
}

async function getTldData(params: {
    config: EvmChainData;
    provider: Provider;
    tldLabel: string;
}): Promise<TLD> {
    const { config, tldLabel, provider } = params;

    if (!config) throw Error('Not connected to SmartContract');
    if (!provider) throw Error('No provider');

    const contract = new Contract(
        config.rootContractAddress,
        [
            'function getTld(bytes32) view returns ((address, address, string, string, string, bool, bytes32, bytes32))',
        ],
        provider,
    );

    const tldDataRaw = await contract.getTld(tldLabel);

    const [controller, registrar, tld, name, symbol, locked, node, label] =
        tldDataRaw;

    return {
        controller: controller as Address,
        registrar: registrar as Address,
        tld: tld as string,
        name: name as string,
        symbol: symbol as string,
        locked: (locked as string) === 'true',
        node: node as string,
        label: label as string,
    };
}

async function getTlds(params: {
    config: EvmChainData;
    provider: Provider;
}): Promise<TLD[]> {
    const { provider, config } = params;

    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');

    const contract = new Contract(
        config.rootContractAddress,
        [
            'function listTlds() view returns ((address, address, string, string, string, bool, bytes32, bytes32)[])',
        ],
        provider,
    );

    const tldsRaw = (await contract.listTlds()) as [
        unknown, // controller
        unknown, // registrar
        unknown, // tld
        unknown, // name
        unknown, // symbol
        unknown, // locked
        unknown, // node
        unknown, // label
    ][];

    const tlds = tldsRaw.map((tldRaw): TLD => {
        const [controller, registrar, tld, name, symbol, locked, node, label] =
            tldRaw;

        return {
            controller: controller as Address,
            registrar: registrar as Address,
            tld: tld as string,
            name: name as string,
            symbol: symbol as string,
            locked: (locked as string) === 'true',
            node: node as string,
            label: label as string,
        };
    });

    return tlds;
}

export const rootFetchers = {
    getRegistryAddress,
    getTlds,
    getTldData,
};
