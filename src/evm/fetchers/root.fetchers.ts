'use strict';

import {
    BrowserProvider,
    Contract,
    Eip1193Provider,
    Provider,
    parseUnits,
} from 'ethers';
import { z } from 'zod';
import { ROOT_ABI } from '../abis/root.abi';
import { Address, AddressSchema } from '../types/Address';
import { EvmChainData } from '../types/EvmChainData';

const TLDSchema = z.object({
    controller: AddressSchema,
    registrar: AddressSchema,
    tld: z.string(),
    name: z.string(),
    symbol: z.string(),
    locked: z.boolean(),
    node: z.string(),
    label: z.string(),
});
export type TLD = z.infer<typeof TLDSchema>;

export const PriceSchemaSchema = z.object({
    for1: z.coerce.number().min(0),
    for2: z.coerce.number().min(0),
    for3: z.coerce.number().min(0),
    for4: z.coerce.number().min(0),
    for5plus: z.coerce.number().min(0),
});
export type PriceSchema = z.infer<typeof PriceSchemaSchema>;

export const SplitSchemaSchema = z.object({
    percentage: z.coerce.number(),
    recipient: AddressSchema,
});
export type SplitSchema = z.infer<typeof SplitSchemaSchema>;

async function getRegistryAddress(params: {
    config: EvmChainData;
    provider: Provider;
}): Promise<Address> {
    const { provider, config } = params;

    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');

    const contract = new Contract(
        config.rootContractAddress,
        ROOT_ABI,
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
        ROOT_ABI,
        provider,
    );

    const tldDataRaw = await contract.getTld(tldLabel);

    const [controller, registrar, tld, name, symbol, locked, node, label] =
        tldDataRaw;

    return TLDSchema.parse({
        controller: controller as Address,
        registrar: registrar as Address,
        tld: tld as string,
        name: name as string,
        symbol: symbol as string,
        locked: (locked as string) === 'true',
        node: node as string,
        label: label as string,
    });
}

async function getAdminList(params: {
    config: EvmChainData;
    provider: Provider;
}): Promise<Address[]> {
    const { provider, config } = params;

    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');

    const contract = new Contract(
        config.rootContractAddress,
        ROOT_ABI,
        provider,
    );

    const admins = await contract.getAdmins();

    return admins;
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
        ROOT_ABI,
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

    return TLDSchema.array().parse(tlds);
}

async function addAdmin(params: {
    address: Address;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
}): Promise<string> {
    const { walletProvider, config, address } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(config.rootContractAddress, ROOT_ABI, signer);
    const tx = await contract.addAdmin(address);
    await tx.wait();

    return tx.hash;
}

async function removeAdmin(params: {
    address: Address;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
}): Promise<string> {
    const { walletProvider, config, address } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(config.rootContractAddress, ROOT_ABI, signer);
    const tx = await contract.removeAdmin(address);
    await tx.wait();

    return tx.hash;
}

async function createTld(params: {
    tldName: string;
    nftName: string;
    nftSymbol: string;
    baseUrl: string;
    priceSchema: PriceSchema;
    splits: SplitSchema[];
    tldFrozen: boolean;
    isRenewable: boolean;
    isDifferentRenewalPrice: boolean;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
}) {
    const {
        walletProvider,
        config,
        tldName,
        nftName,
        nftSymbol,
        priceSchema,
        tldFrozen,
        splits,
        isRenewable,
        isDifferentRenewalPrice,
        baseUrl,
    } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(config.rootContractAddress, ROOT_ABI, signer);

    const USD_DECIMALS = 8;
    const parsedPriceSchema = {
        for1: parseUnits(
            priceSchema.for1.toFixed(USD_DECIMALS + 1),
            USD_DECIMALS,
        ),
        for2: parseUnits(
            priceSchema.for2.toFixed(USD_DECIMALS + 1),
            USD_DECIMALS,
        ),
        for3: parseUnits(
            priceSchema.for3.toFixed(USD_DECIMALS + 1),
            USD_DECIMALS,
        ),
        for4: parseUnits(
            priceSchema.for4.toFixed(USD_DECIMALS + 1),
            USD_DECIMALS,
        ),
        for5plus: parseUnits(
            priceSchema.for5plus.toFixed(USD_DECIMALS + 1),
            USD_DECIMALS,
        ),
    };

    const tx = await contract.createTld(
        tldName,
        nftName,
        nftSymbol,
        baseUrl,
        parsedPriceSchema,
        splits,
        tldFrozen,
        isRenewable,
        isDifferentRenewalPrice,
    );
    await tx.wait();

    return tx.hash;
}

export const rootFetchers = {
    getRegistryAddress,
    getAdminList,
    getTlds,
    getTldData,
    addAdmin,
    removeAdmin,
    createTld,
};
