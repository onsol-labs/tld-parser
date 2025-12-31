import { NameAccountAndDomain } from './name-record-handler';
import { MainDomain } from './state/main-domain';
import { NameRecordHeader } from './state/name-record-header';
import { Address, Rpc, SolanaRpcApi } from '@solana/kit';

export interface ITldParser {
    connection: Rpc<SolanaRpcApi>;
    /**
     * retrieves all nameAccounts for any user.
     *
     * @param userAccount user Address or string
     */
    getAllUserDomains(userAccount: Address | string): Promise<Address[]>;
    /**
     * retrieves all nameaccounts for any user in a specific tld.
     *
     * @param userAccount user Address or string
     * @param tld tld to be retrieved from
     */
    getAllUserDomainsFromTld(
        userAccount: Address | string,
        tld: string,
    ): Promise<Address[]>;

    /**
     * retrieves owner of a specific Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getOwnerFromDomainTld(domainTld: string): Promise<Address | undefined>;

    /**
     * retrieves domainTld data a domain from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getNameRecordFromDomainTld(
        domainTld: string,
    ): Promise<NameRecordHeader | undefined>;

    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent Address or string
     */
    getTldFromParentAccount(parentAccount: Address | string): Promise<string>;

    /**
     * retrieves domain from name account via tldParent account.
     *
     * @param nameAccount name Address or string
     * @param parentAccountOwner parent Owner or string (TldHouse)
     */
    reverseLookupNameAccount(
        nameAccount: Address | string,
        parentAccountOwner: Address | string,
    ): Promise<string>;

    /**
     * retrieves main domain name account and its domain tld from user address.
     *
     * @param userAddress user Address or string
     */
    getMainDomain(userAddress: Address | string): Promise<MainDomain>;
    /**
     * retrieves all parsed domains as strings with name accounts in an array for user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user Address or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: Address | string,
        tld: string,
    ): Promise<NameAccountAndDomain[]>;

    /**
     * retrieves all parsed domains and name accounts including NFTs in an array for any user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user Address or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomainsFromTld(
        userAccount: Address | string,
        tld: string,
    ): Promise<NameAccountAndDomain[]>;

    /**
     * retrieves all parsed domains and name accounts for user.
     * in alphabetical order
     *
     * @param userAccount user Address or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomainsUnwrapped(
        userAccount: Address | string,
    ): Promise<NameAccountAndDomain[]>;

    /**
     * retrieves all parsed domains and name accounts including NFTs for user.
     * in alphabetical order
     *
     * @param userAccount user Address or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomains(
        userAccount: Address | string,
    ): Promise<NameAccountAndDomain[]>;
}
