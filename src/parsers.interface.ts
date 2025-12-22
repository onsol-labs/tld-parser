import { Connection, PublicKey } from '@solana/web3.js';
import { Provider } from 'ethers';
import { AddressAndDomain } from './evm/types/AddressAndDomain';
import { NameAccountAndDomain } from './svm/name-record-handler';
import { MainDomain } from './svm/state/main-domain';
import { NameRecordHeader } from './svm/state/name-record-header';
import { NameRecord } from 'evm/types/NameRecordHeader';
import { Record, RecordResult, AvatarOptions } from './types/records';

export interface ITldParser {
    connection: Connection | Provider;
    /**
     * retrieves all nameAccounts for any user.
     *
     * @param userAccount user publickey or string
     */
    getAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<PublicKey[] | NameRecord[]>;
    /**
     * retrieves all nameaccounts for any user in a specific tld.
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getAllUserDomainsFromTld(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<PublicKey[] | NameRecord[]>;

    /**
     * retrieves owner of a specific Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getOwnerFromDomainTld(
        domainTld: string,
    ): Promise<PublicKey | undefined | string>;

    /**
     * retrieves domainTld data a domain from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getNameRecordFromDomainTld(
        domainTld: string,
    ): Promise<NameRecordHeader | NameRecord | undefined>;

    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent publickey or string
     */
    getTldFromParentAccount(parentAccount: PublicKey | string): Promise<string>;

    /**
     * retrieves domain from name account via tldParent account.
     *
     * @param nameAccount name publickey or string
     * @param parentAccountOwner parent Owner or string (TldHouse)
     */
    reverseLookupNameAccount(
        nameAccount: PublicKey | string,
        parentAccountOwner: PublicKey | string,
    ): Promise<string>;

    /**
     * retrieves main domain name account and its domain tld from user address.
     *
     * @param userAddress user publickey or string
     */
    getMainDomain(
        userAddress: PublicKey | string,
    ): Promise<MainDomain | NameRecord>;
    /**
     * retrieves all parsed domains as strings with name accounts in an array for user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<NameAccountAndDomain[] | AddressAndDomain[]>;

    /**
     * retrieves all parsed domains and name accounts including NFTs in an array for any user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomainsFromTld(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<NameAccountAndDomain[] | AddressAndDomain[]>;

    /**
     * retrieves all parsed domains and name accounts for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomainsUnwrapped(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[] | AddressAndDomain[]>;

    /**
     * retrieves all parsed domains and name accounts including NFTs for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[] | AddressAndDomain[]>;

    /**
     * Get a single record for a domain.
     * SVM: Fetches from sub-account (e.g., Twitter.miester.poor)
     * EVM: Fetches from resolver contract text() method
     *
     * @param domainTld Full domain like "miester.mon" or "miester.poor"
     * @param record The record type to fetch
     * @returns Record value or null if not set
     */
    getRecord(domainTld: string, record: Record): Promise<string | null>;

    /**
     * Get multiple records for a domain (batched for efficiency).
     * SVM: Uses getMultipleAccountsInfo for batch fetching
     * EVM: Uses parallel contract calls
     *
     * @param domainTld Full domain like "miester.mon"
     * @param records Array of record types (default: all records)
     * @returns Object with record values
     */
    getRecords(domainTld: string, records?: Record[]): Promise<RecordResult>;

    /**
     * Get resolved avatar URL (IPFS/Arweave → HTTP gateway).
     * Automatically resolves ipfs://, ar://, arwv:// to HTTP URLs.
     *
     * @param domainTld Full domain like "miester.mon"
     * @param options Gateway URLs for IPFS/Arweave
     * @returns HTTP-accessible avatar URL or null
     */
    getAvatar(domainTld: string, options?: AvatarOptions): Promise<string | null>;

    /**
     * Get main domains for multiple addresses.
     * SVM: Uses getMultipleAccountsInfo for efficiency
     * EVM: Uses parallel contract calls
     *
     * @param addresses Array of wallet addresses
     * @returns Array of main domain names (null for addresses without main domain)
     */
    getMainDomains(addresses: string[]): Promise<(string | null)[]>;
}
