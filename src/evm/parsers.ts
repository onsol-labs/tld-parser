import { Connection, PublicKey } from '@solana/web3.js';
import { ensNormalize, EnsPlugin, JsonRpcProvider, Provider } from 'ethers';

import { ITldParser } from '../parsers.interface';
import { MainDomain, NameAccountAndDomain, NameRecordHeader } from '../svm';
import { registrarFetchers } from './fetchers/registrar.fetchers';
import { registryFetchers } from './fetchers/registry.fetchers';
import { rootFetchers, TLD } from './fetchers/root.fetchers';
import { resolverFetchers } from './fetchers/resolver.fetchers';
import { Address, isValidAddress } from './types/Address';
import { AddressAndDomain } from './types/AddressAndDomain';
import { EvmChainData } from './types/EvmChainData';
import {
    configOfEvmChainId,
    labelhashFromLabel,
    ansNamehash,
    NetworkWithRpc,
    getReverseNode,
} from './utils';
import { NameRecord } from './types/NameRecordHeader';
import {
    Record,
    RecordResult,
    AvatarOptions,
    EVM_RECORD_KEYS,
    ALL_RECORDS,
} from '../types/records';
import { resolveAvatarUrl } from '../utils/avatar';

export class TldParserEvm implements ITldParser {
    connection: Provider;
    private config: EvmChainData;

    constructor(settings?: Connection | NetworkWithRpc) {
        if (settings instanceof NetworkWithRpc) {
            const chainId = parseInt(settings.chainId.toString());
            const config = configOfEvmChainId(chainId);
            this.config = config;

            settings.attachPlugin(
                new EnsPlugin(config.registryContractAddress, chainId),
            );
            if (settings.provider) {
                this.connection = settings.provider;
            } else {
                this.connection = new JsonRpcProvider(
                    settings.rpcUrl,
                    settings,
                    {
                        staticNetwork: true,
                    },
                );
            }
        } else {
            throw new Error('Method not implemented.');
        }
    }

    async getAllUserDomains(userAccount: string): Promise<NameRecord[]> {
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
                transferrable: !domain.nft.frozen,
                owner: domain.nft.owner,
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
                transferrable: !domain.nft.frozen,
                owner: domain.nft.owner,
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
            tld: `${tldData.tld}`,
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

        const mainDomain = await registrarFetchers.getMainDomainRaw({
            provider: this.connection,
            address: userAddress as Address,
            rootAddress: this.config.rootContractAddress as Address,
        });

        if (!mainDomain) {
            throw new Error(`No main domain found for: ${userAddress}`);
        }
        return (await this.getNameRecordFromDomainTld(
            mainDomain,
        )) as NameRecord;
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

    /**
     * Get a single record for a domain using the resolver contract.
     *
     * @param domainTld Full domain like "miester.mon"
     * @param record The record type to fetch
     * @returns Record value or null if not set
     */
    async getRecord(domainTld: string, record: Record): Promise<string | null> {
        if (!this.config.resolverAddress) {
            return null;
        }

        const namehash = ansNamehash(domainTld);
        const evmKey = EVM_RECORD_KEYS[record];

        return resolverFetchers.getTextRecord(
            this.connection,
            this.config.resolverAddress as Address,
            namehash,
            evmKey,
        );
    }

    /**
     * Get multiple records for a domain (parallel fetches).
     *
     * @param domainTld Full domain like "miester.mon"
     * @param records Array of record types (default: all records)
     * @returns Object with record values
     */
    async getRecords(
        domainTld: string,
        records?: Record[],
    ): Promise<RecordResult> {
        if (!this.config.resolverAddress) {
            return {};
        }

        const recordTypes = records ?? ALL_RECORDS;
        const namehash = ansNamehash(domainTld);

        const results = await Promise.all(
            recordTypes.map(async record => {
                const evmKey = EVM_RECORD_KEYS[record];
                const value = await resolverFetchers.getTextRecord(
                    this.connection,
                    this.config.resolverAddress as Address,
                    namehash,
                    evmKey,
                );
                return { record, value };
            }),
        );

        const result: RecordResult = {};
        results.forEach(({ record, value }) => {
            result[record] = value;
        });

        return result;
    }

    /**
     * Get avatar with gateway resolution.
     * Fetches the avatar record and resolves IPFS/Arweave URLs to HTTP.
     *
     * @param domainTld Full domain like "miester.mon"
     * @param options Gateway URLs for IPFS/Arweave
     * @returns HTTP-accessible avatar URL or null
     */
    async getAvatar(
        domainTld: string,
        options?: AvatarOptions,
    ): Promise<string | null> {
        const avatarRecord = await this.getRecord(domainTld, Record.Pic);
        if (!avatarRecord) return null;

        return resolveAvatarUrl(avatarRecord, options);
    }

    /**
     * Get main domains for multiple addresses.
     * Uses parallel contract calls.
     *
     * @param addresses Array of wallet addresses (0x addresses)
     * @returns Array of main domain names (null for addresses without main domain)
     */
    async getMainDomains(addresses: string[]): Promise<(string | null)[]> {
        if (!this.config.resolverAddress) {
            return addresses.map(() => null);
        }

        const results = await Promise.all(
            addresses.map(async address => {
                const isValidAddr = isValidAddress(address);
                if (!isValidAddr) {
                    return null;
                }

                // Compute reverse node: addr.addr.reverse
                const reverseNode = getReverseNode(address);

                return resolverFetchers.getReverseName(
                    this.connection,
                    this.config.resolverAddress as Address,
                    reverseNode,
                );
            }),
        );

        return results;
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
