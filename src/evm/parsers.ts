import { AptosSettings } from '@aptos-labs/ts-sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { EnsPlugin, JsonRpcProvider, Network } from 'ethers';
import { NameRecord } from 'move';
import { MainDomain, NameAccountAndDomain, NameRecordHeader } from 'svm';
import { ITldParser } from '../parsers.interface';
import { registrarFetchers } from './fetchers/registrar.fetchers';
import { rootFetchers, TLD } from './fetchers/root.fetchers';
import { Address, AddressSchema } from './types/Address';
import { EvmChainData } from './types/EvmChainData';
import { configOfEvmChainId } from './utils';

export class TldParserEvm implements ITldParser {
    connection: JsonRpcProvider;
    private config: EvmChainData;

    constructor(settings?: Connection | AptosSettings | Network) {
        if (settings instanceof Network) {
            const chainId = parseInt(settings.chainId.toString());
            const config = configOfEvmChainId(chainId);
            this.config = config;

            settings.attachPlugin(
                new EnsPlugin(config.registryContractAddress, chainId),
            );
            this.connection = new JsonRpcProvider(config.rpcUrl, settings, {
                staticNetwork: true,
            });
        } else {
            throw new Error('Method not implemented.');
        }
    }

    async getAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<NameRecord[]> {
        const isValidAddress = await AddressSchema.safeParseAsync(
            userAccount as string,
        );
        if (!isValidAddress.success) {
            throw new Error(`Invalid address for EVM chain: ${userAccount}`);
        }
        /**
         * TODO
         * - get all the registrars for the registry (root contract)
         * - call `getUserNfts` for each registrar to get the owned nft id
         * - get the associated domain for each nft id
         */

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

    getAllUserDomainsFromTld(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<PublicKey[] | NameRecord[]> {
        /**
         * TODO
         * - call `getUserNfts` for the registrar of the tld
         * - get the associated domain for each nft id
         */
        throw new Error('Method not implemented.');
    }

    getOwnerFromDomainTld(
        domainTld: string,
    ): Promise<PublicKey | undefined | string> {
        /**
         * TODO
         * - call the registry to ask for the owner of the domain
         */
        throw new Error('Method not implemented.');
    }

    getNameRecordFromDomainTld(
        domainTld: string,
    ): Promise<NameRecordHeader | NameRecord | undefined> {
        /**
         * TODO
         * Two options:
         * - call the registry to get the record - not sure if this is currently public viewable data
         * - call the registrar to get the NftData - `nameData` function
         */
        throw new Error('Method not implemented.');
    }

    getTldFromParentAccount(
        parentAccount: PublicKey | string,
    ): Promise<string> {
        /**
         * ???
         */
        throw new Error('Method not implemented.');
    }

    reverseLookupNameAccount(
        nameAccount: PublicKey | string,
        parentAccountOwner: PublicKey | string,
    ): Promise<string> {
        /**
         * ???
         */
        throw new Error('Method not implemented.');
    }

    getMainDomain(
        userAddress: PublicKey | string,
    ): Promise<MainDomain | NameRecord> {
        /**
         * TODO
         * - reverse lookup the user address and retrieve additional data (see return types)
         */
        throw new Error('Method not implemented.');
    }

    getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<NameAccountAndDomain[]> {
        /**
         * TODO
         * ??? Unwrapped ???
         * - call `getUserNfts` for the registrar of the tld
         * - get the associated domain for each nft id
         * - parse all the data to the required return format
         */
        throw new Error('Method not implemented.');
    }

    getParsedAllUserDomainsFromTld(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<NameAccountAndDomain[]> {
        /**
         * TODO
         * - call `getUserNfts` for the registrar of the tld
         * - get the associated domain for each nft id
         * - parse all the data to the required return format
         */
        throw new Error('Method not implemented.');
    }

    getParsedAllUserDomainsUnwrapped(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[]> {
        /**
         * TODO
         * ??? Unwrapped ???
         * - get all the registrars for the registry (root contract)
         * - call `getUserNfts` for each registrar to get the owned nft id
         * - get the associated domain for each nft id
         * - parse all the data to the required return format
         */
        throw new Error('Method not implemented.');
    }

    getParsedAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[]> {
        /**
         * TODO
         * - get all the registrars for the registry (root contract)
         * - call `getUserNfts` for each registrar to get the owned nft id
         * - get the associated domain for each nft id
         * - parse all the data to the required return format
         */
        throw new Error('Method not implemented.');
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
}
