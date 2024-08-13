import { BN } from 'bn.js';
import { ITldParser } from '../parsers.interface';
import { Aptos, AptosConfig, AptosSettings, Network } from '@aptos-labs/ts-sdk';
import { ALL_DOMAINS_CONTRACT_ADDRESS } from './constants';
import { Connection } from '@solana/web3.js';
import { NameRecord } from './types/NameRecordHeader';

export class TldParserMove implements ITldParser {
    private creatorAddress: string = '';
    private tlds: any[] = [];
    connection: Aptos;

    constructor(settings?: Connection | AptosSettings) {
        if (!(settings instanceof Connection)) {
            const aptosConfig = new AptosConfig(settings);
            this.connection = new Aptos(aptosConfig);
            this.initialize();
        }
        throw new Error('Method not implemented.');
    }

    // Initialize the necessary resources
    async initialize() {
        try {
            const createrAddr = await this.connection.getAccountResource({
                accountAddress: ALL_DOMAINS_CONTRACT_ADDRESS,
                resourceType: `${ALL_DOMAINS_CONTRACT_ADDRESS}::name_record::ResAddr`,
            });
            this.creatorAddress = createrAddr.res_addr;
        } catch (e) {
            console.error('Failed to initialize TldParser:', e);
        }
    }

    async updateTlds() {
        try {
            const tld_manager = await this.connection.getAccountResource({
                accountAddress: ALL_DOMAINS_CONTRACT_ADDRESS,
                resourceType: `${ALL_DOMAINS_CONTRACT_ADDRESS}::tld_manager::TldManager`,
            });
            const taskCounter = (tld_manager as any).house_counter;

            let tlds = [];
            let counter = 1;
            while (counter <= taskCounter) {
                // console.log(counter, this.creatorAddress, tld_manager.name_vec[counter - 1]);
                const collection =
                    await this.connection.getCollectionDataByCreatorAddressAndCollectionName(
                        {
                            creatorAddress: this.creatorAddress,
                            collectionName: tld_manager.name_vec[counter - 1],
                        },
                    );
                tlds.push({
                    address: collection.collection_id,
                    name: collection.collection_name,
                });
                counter++;
            }
            this.tlds = tlds;
        } catch (e) {
            console.error('Failed to update Tlds:', e);
        }
    }

    /**
     * retrieves all nameAccounts for any user.
     *
     * @param userAccount user account in string
     */
    async getAllUserDomains(userAccount: string): Promise<NameRecord[]> {
        await this.updateTlds();
        // Get the Domains
        const tokens = await this.connection.getAccountOwnedTokens({
            accountAddress: userAccount,
        });
        //filter to the tld collection addresses with collection id in current_token_data
        const data: NameRecord[] = await Promise.all(
            tokens
                .filter(
                    e =>
                        this.tlds.find(
                            tld =>
                                tld.address ==
                                e.current_token_data?.collection_id,
                        ) != undefined,
                )
                .map(async e => {
                    const token = await this.connection.getAccountResource({
                        accountAddress: e.token_data_id,
                        resourceType: `${ALL_DOMAINS_CONTRACT_ADDRESS}::name_record::NameRecord`,
                    });
                    return token;
                }),
        );
        return data;
    }

    /**
     * retrieves all nameaccounts for any user in a specific tld.
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getAllUserDomainsFromTld(
        userAccount: string,
        tld: string,
    ): Promise<NameRecord[]> {
        // Ensure the class is initialized
        if (!this.creatorAddress) {
            throw new Error(
                'TldParser not initialized. Call initialize() first.',
            );
        }
        await this.updateTlds();
        const collection = this.tlds.find(e => e.name == tld);
        // Get the Domains
        const tokens =
            await this.connection.getAccountOwnedTokensFromCollectionAddress({
                accountAddress: userAccount,
                collectionAddress: collection.address,
            });
        // Filter to the tld collection addresses with collection id in current_token_data
        const data: any = await Promise.all(
            tokens.map(async e => {
                const token = await this.connection.getAccountResource({
                    accountAddress: e.token_data_id,
                    resourceType: `${ALL_DOMAINS_CONTRACT_ADDRESS}::name_record::NameRecord`,
                });
                return token;
            }),
        );
        return data;
    }

    /**
     * retrieves owner of a specific Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.move"
     */
    async getOwnerFromDomainTld(
        domainTld: string,
    ): Promise<string | undefined> {
        const domainTldSplit = domainTld.split('.');
        const domain = domainTldSplit[0];
        const tld = '.' + domainTldSplit[1];
        const address: any = await this.connection.view({
            payload: {
                function: `${ALL_DOMAINS_CONTRACT_ADDRESS}::tld_manager::get_owner_from_domain`,
                functionArguments: [tld, domain],
            },
        });
        return address;
    }

    /**
     * retrieves domainTld data a domain from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.move"
     */
    async getNameRecordFromDomainTld(
        domainTld: string,
    ): Promise<NameRecord | undefined> {
        const domainTldSplit = domainTld.split('.');
        const domain = domainTldSplit[0];
        const tld = '.' + domainTldSplit[1];
        const owner = await this.getOwnerFromDomainTld(domainTld);
        const tokens = await this.getAllUserDomainsFromTld(owner[0], tld);
        const name_record: NameRecord = tokens.find(
            (token: { domain_name: string }) => token.domain_name == domain,
        );
        return name_record;
    }

    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent publickey or string
     */
    async getTldFromParentAccount(parentAccount: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves domain from name account via tldParent account.
     *
     * @param nameAccount name publickey or string
     * @param parentAccountOwner parent Owner or string (TldHouse)
     */
    async reverseLookupNameAccount(
        nameAccount: string,
        parentAccountOwner: string,
    ): Promise<string> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves main domain name account and its domain tld from user address.
     *
     * @param userAddress user publickey or string
     */
    async getMainDomain(userAddress: string): Promise<NameRecord> {
        const tokens = await this.getAllUserDomains(userAddress);
        const domain = tokens.find(
            (e: NameRecord) => e.main_domain_address.vec.length > 0,
        );
        return domain;
    }

    /**
     * retrieves all parsed domains as strings with name accounts in an array for user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: string,
        tld: string,
    ): Promise<any[]> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves all parsed domains and name accounts including NFTs in an array for any user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsFromTld(
        userAccount: string,
        tld: string,
    ): Promise<any[]> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves all parsed domains and name accounts for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsUnwrapped(
        userAccount: string,
    ): Promise<any[]> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves all parsed domains and name accounts including NFTs for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomains(userAccount: string): Promise<any[]> {
        throw new Error('Method not implemented.');
    }
}
