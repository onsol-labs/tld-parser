import { Connection, PublicKey } from '@solana/web3.js';
import { ensNormalize, EnsPlugin, JsonRpcProvider } from 'ethers';

import { ITldParser } from '../parsers.interface';
import { MainDomain, NameAccountAndDomain, NameRecordHeader } from '../svm';
import { registrarFetchers } from './fetchers/registrar.fetchers';
import { registryFetchers } from './fetchers/registry.fetchers';
import { rootFetchers, TLD } from './fetchers/root.fetchers';
import { Address, isValidAddress } from './types/Address';
import { AddressAndDomain } from './types/AddressAndDomain';
import { EvmChainData } from './types/EvmChainData';
import {
    configOfEvmChainId,
    labelhashFromLabel,
    ansNamehash,
    NetworkWithRpc,
} from './utils';
import { NameRecord } from './types/NameRecordHeader';

export class TldParserEvm implements ITldParser {
    connection: JsonRpcProvider;
    private config: EvmChainData;

    constructor(settings?: Connection | NetworkWithRpc) {
        if (settings instanceof NetworkWithRpc) {
            const chainId = parseInt(settings.chainId.toString());
            const config = configOfEvmChainId(chainId);
            this.config = config;

            settings.attachPlugin(
                new EnsPlugin(config.registryContractAddress, chainId),
            );
            this.connection = new JsonRpcProvider(settings.rpcUrl, settings, {
                staticNetwork: true,
            });
        } else {
            throw new Error('Method not implemented.');
        }
    }

    async getAllUserDomains(
        userAccount: string,
    ): Promise<NameRecord[]> {
        const isValidAddr = isValidAddress(userAccount as string);
        if (!isValidAddr) {
            throw new Error(`Invalid address for EVM chain: ${userAccount}`);
        }

        const tlds = await rootFetchers.getTlds({
            config: this.config,
            provider: this.connection,
        });

        const domains = (
            await Promise.all(
                tlds.map(tld => {
                    return this.getUserNftFromTld({
                        userAccount: userAccount as string,
                        tld,
                    });
                }),
            )
        ).flat();

        return domains.map(domain => {
            return <NameRecord>{
                created_at: '0',
                domain_name: domain.nft.name,
                expires_at: domain.nft.expiry.toString(),
                main_domain_address: '',
                tld: domain.tld.tld,
                transferrable: domain.nft.frozen,
            };
        });
    }

    async getAllUserDomainsFromTld(
        userAccount: string,
        tld: string,
    ): Promise<PublicKey[] | NameRecord[]> {
        const isValidAddr = isValidAddress(userAccount as string);
        if (!isValidAddr) {
            throw new Error(`Invalid address for EVM chain: ${userAccount}`);
        }

        const tldLabel = labelhashFromLabel(tld);

        const tldData = await rootFetchers.getTldData({
            config: this.config,
            provider: this.connection,
            tldLabel,
        });

        const domains = await this.getUserNftFromTld({
            userAccount: userAccount as string,
            tld: tldData,
        });

        return domains.map(domain => {
            return <NameRecord>{
                created_at: '0',
                domain_name: domain.nft.name,
                expires_at: domain.nft.expiry.toString(),
                main_domain_address: '',
                tld: domain.tld.tld,
                transferrable: domain.nft.frozen,
            };
        });
    }

    async getOwnerFromDomainTld(
        domainTld: string,
    ): Promise<PublicKey | undefined | string> {
        const node = ansNamehash(domainTld);
        const owner = await registryFetchers.getDomainOwner({
            config: this.config,
            provider: this.connection,
            registryAddress: this.config.registryContractAddress as Address,
            node,
        });

        return owner;
    }

    async getNameRecordFromDomainTld(
        domainTld: string,
    ): Promise<NameRecordHeader | NameRecord | undefined> {
        const normalized = ensNormalize(domainTld);
        const node = ansNamehash(normalized);
        const recordData = await registryFetchers.getRecordData({
            config: this.config,
            provider: this.connection,
            registryAddress: this.config.registryContractAddress as Address,
            node,
        });

        const tld = await this.getTldFromFullDomain(domainTld);
        const tldData = await rootFetchers.getTldData({
            config: this.config,
            provider: this.connection,
            tldLabel: labelhashFromLabel(tld),
        });

        const nftData = await registrarFetchers.getUserNftData({
            config: this.config,
            provider: this.connection,
            registrarAddress: tldData.registrar as Address,
            domain: domainTld,
        });

        return <NameRecord>{
            created_at: (nftData.expiry - recordData.ttl).toString(),
            domain_name: nftData.name,
            expires_at: nftData.expiry.toString(),
            main_domain_address: recordData.owner,
            tld: `${tldData.name}`,
            transferrable: !nftData.frozen,
        };
    }

    getTldFromParentAccount(
        parentAccount: PublicKey | string,
    ): Promise<string> {
        throw new Error('Method not implemented.');
    }

    reverseLookupNameAccount(
        nameAccount: PublicKey | string,
        parentAccountOwner: PublicKey | string,
    ): Promise<string> {
        throw new Error('Method not implemented.');
    }

    async getMainDomain(
        userAddress: PublicKey | string,
    ): Promise<MainDomain | NameRecord> {
        const isValidAddr = isValidAddress(userAddress as string);
        if (!isValidAddr) {
            throw new Error(`Invalid address for EVM chain: ${userAddress}`);
        }

        const domain = await this.connection.lookupAddress(
            userAddress as string,
        );
        if (!domain) {
            throw new Error(`No domain found for address: ${userAddress}`);
        }

        const forwardResolver = await this.connection.getResolver(domain);

        if (!forwardResolver) {
            throw new Error(`No resolver found for domain: ${domain}`);
        }

        const verifiedAddress = await forwardResolver.getAddress();

        if (!verifiedAddress) {
            throw new Error(`No verified address found for domain: ${domain}`);
        }

        return (await this.getNameRecordFromDomainTld(domain)) as NameRecord;
    }

    getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<NameAccountAndDomain[]> {
        throw new Error('Method not implemented.');
    }

    async getParsedAllUserDomainsFromTld(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<NameAccountAndDomain[] | AddressAndDomain[]> {
        const isValidAddr = isValidAddress(userAccount as string);
        if (!isValidAddr) {
            throw new Error(`Invalid address for EVM chain: ${userAccount}`);
        }

        const tldLabel = labelhashFromLabel(tld);

        const tldData = await rootFetchers.getTldData({
            config: this.config,
            provider: this.connection,
            tldLabel,
        });

        const domains = await this.getUserNftFromTld({
            userAccount: userAccount as string,
            tld: tldData,
        });

        return domains.map(domain => {
            return <AddressAndDomain>{
                address: domain.nft.name,
                domain: domain.tld.tld,
            };
        });
    }

    getParsedAllUserDomainsUnwrapped(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[] | AddressAndDomain[]> {
        throw new Error('Method not implemented.');
    }

    async getParsedAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[] | AddressAndDomain[]> {
        const isValidAddr = isValidAddress(userAccount as string);
        if (!isValidAddr) {
            throw new Error(`Invalid address for EVM chain: ${userAccount}`);
        }

        const tlds = await rootFetchers.getTlds({
            config: this.config,
            provider: this.connection,
        });

        const domains = (
            await Promise.all(
                tlds.map(tld => {
                    return this.getUserNftFromTld({
                        userAccount: userAccount as string,
                        tld,
                    });
                }),
            )
        ).flat();

        return domains.map(domain => {
            return <AddressAndDomain>{
                address: domain.nft.name,
                domain: domain.tld.tld,
            };
        });
    }

    private async getUserNftFromTld(data: { userAccount: string; tld: TLD }) {
        const { tld, userAccount } = data;
        const registrar = tld.registrar;
        const nftData = await registrarFetchers.getUsersNfts({
            config: this.config,
            provider: this.connection,
            registrarAddress: registrar as Address,
            userAddress: userAccount as Address,
        });

        return nftData.map(nft => {
            return {
                nft,
                tld,
            };
        });
    }

    private async getBaseRegistry(chainId: number): Promise<string> {
        const config = configOfEvmChainId(chainId);

        const data = await rootFetchers.getRegistryAddress({
            config,
            provider: this.connection,
        });

        return data;
    }

    private async getTldFromFullDomain(domain: string) {
        // Considering there can be unlimited subdomains, the last part after a dot is the tld
        const parts = domain.split('.');
        const tld = parts[parts.length - 1];
        return '.' + tld;
    }
}
