'use strict';

import {
    BrowserProvider,
    Contract,
    Eip1193Provider,
    Provider,
    Typed,
} from 'ethers';
import { z } from 'zod';
import { REGISTRAR_ABI } from '../abis/registrar.abi';
import { Address, AddressSchema } from '../types/Address';
import { EvmChainData } from '../types/EvmChainData';

const NameDataSchema = z.object({
    name: z.string(),
    expiry: z.number(),
    frozen: z.boolean(),
});
type NameData = z.infer<typeof NameDataSchema>;
export type UserNft = NameData & { id: bigint; url: string };

const ScDataSchema = z.object({
    name: z.string(),
    owner: AddressSchema,
    tldNode: z.string(),
    symbol: z.string(),
    baseUrl: z.string(),
    gracePeriod: z.number(),
    tldFrozen: z.boolean(),
    defaultTTL: z.number(),
});
type ScData = z.infer<typeof ScDataSchema>;

async function getAdminList(params: {
    config: EvmChainData;
    provider: Provider;
    registrarAddress: Address | undefined;
}): Promise<Address[]> {
    const { provider, config, registrarAddress } = params;

    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, provider);

    const admins = await contract.getAdmins();

    return admins;
}

async function getSignerList(params: {
    config: EvmChainData;
    provider: Provider;
    registrarAddress: Address | undefined;
}): Promise<Address[]> {
    const { provider, config, registrarAddress } = params;

    if (!provider) throw Error('No provider');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, provider);

    const signers = await contract.getSigners();

    return signers;
}

async function addAdmin(params: {
    address: Address;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
    registrarAddress: Address | undefined;
}): Promise<string> {
    const { walletProvider, config, registrarAddress, address } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, signer);
    const tx = await contract.addAdmin(address);
    await tx.wait();

    return tx.hash;
}

async function removeAdmin(params: {
    address: Address;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
    registrarAddress: Address | undefined;
}): Promise<string> {
    const { walletProvider, config, address, registrarAddress } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, signer);
    const tx = await contract.removeAdmin(address);
    await tx.wait();

    return tx.hash;
}

async function addSigner(params: {
    address: Address;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
    registrarAddress: Address | undefined;
}): Promise<string> {
    const { walletProvider, config, registrarAddress, address } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, signer);
    const tx = await contract.addSigner(address);
    await tx.wait();

    return tx.hash;
}

async function removeSigner(params: {
    address: Address;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
    registrarAddress: Address | undefined;
}): Promise<string> {
    const { walletProvider, config, address, registrarAddress } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, signer);
    const tx = await contract.removeSigner(address);
    await tx.wait();

    return tx.hash;
}

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

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, provider);
    const nameData = await contract.nameData(name);

    return NameDataSchema.parse(nameData);
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

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, provider);

    const name = (await contract.name()) as unknown as string;
    const owner = (await contract.owner()) as unknown as string;
    const tldNode = (await contract.tldNode()) as unknown as string;
    const symbol = (await contract.symbol()) as unknown as string;
    const baseUrl = (await contract.baseUri()) as unknown as string;
    const gracePeriod = (await contract.gracePeriod()) as unknown as bigint;
    const tldFrozen = (await contract.allFrozen()) as unknown as boolean;
    const defaultTTL = (await contract.defaultTTL()) as unknown as bigint;

    return ScDataSchema.parse({
        name,
        owner,
        tldNode,
        symbol,
        baseUrl,
        gracePeriod: parseInt(gracePeriod.toString()),
        tldFrozen,
        defaultTTL: parseInt(defaultTTL.toString()),
    });
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

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, provider);

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

async function transferNft(params: {
    to: Address;
    tokenId: bigint;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
    registrarAddress: Address | undefined;
}): Promise<string> {
    const { walletProvider, config, registrarAddress, to, tokenId } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();
    const from = await signer.getAddress();

    console.log({
        from,
        to,
        tokenId,
    });
    const contract = new Contract(registrarAddress, REGISTRAR_ABI, signer);
    const tx = await contract.transferFrom(from, to, tokenId);
    await tx.wait();

    return tx.hash;
}

async function burnNft(params: {
    tokenId: bigint;
    config: EvmChainData;
    walletProvider: Eip1193Provider;
    registrarAddress: Address | undefined;
}): Promise<string> {
    const { walletProvider, config, registrarAddress, tokenId } = params;

    if (!walletProvider) throw Error('User disconnected');
    if (!config) throw Error('Not connected to SmartContract');
    if (!registrarAddress) throw Error('No registrar address');

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(registrarAddress, REGISTRAR_ABI, signer);
    const tx = await contract.burn(tokenId);
    await tx.wait();

    return tx.hash;
}

export const registrarFetchers = {
    getAdminList,
    getSignerList,
    addAdmin,
    removeAdmin,
    addSigner,
    removeSigner,
    getNameData,
    getScData,
    getUsersNfts,
    transferNft,
    burnNft,
};
