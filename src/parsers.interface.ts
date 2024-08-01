import { PublicKey, Connection } from '@solana/web3.js';
import { getDomainKey, NameAccountAndDomain } from './solana/name-record-handler';
import { SolanaTldParser } from './solana/parsers';
import { MainDomain } from './solana/state/main-domain';
import { NameRecordHeader } from './solana/state/name-record-header';

export interface ITldParser {
    connection: Connection;
    /**
     * retrieves all nameAccounts for any user.
     *
     * @param userAccount user publickey or string
     */
    getAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<PublicKey[]> 
    /**
     * retrieves all nameaccounts for any user in a specific tld.
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getAllUserDomainsFromTld(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<PublicKey[]> 

    /**
     * retrieves owner of a specific Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getOwnerFromDomainTld(
        domainTld: string,
    ): Promise<PublicKey | undefined> 

    /**
     * retrieves domainTld data a domain from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getNameRecordFromDomainTld(
        domainTld: string,
    ): Promise<NameRecordHeader | undefined> 

    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent publickey or string
     */
    getTldFromParentAccount(
        parentAccount: PublicKey | string,
    ): Promise<string> 
    
    /**
     * retrieves domain from name account via tldParent account.
     *
     * @param nameAccount name publickey or string
     * @param parentAccountOwner parent Owner or string (TldHouse)
     */
    reverseLookupNameAccount(
        nameAccount: PublicKey | string,
        parentAccountOwner: PublicKey | string,
    ): Promise<string>

    /**
     * retrieves main domain name account and its domain tld from user address.
     *
     * @param userAddress user publickey or string
     */
    getMainDomain(userAddress: PublicKey | string): Promise<MainDomain> 
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
    ): Promise<NameAccountAndDomain[]>

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
    ): Promise<NameAccountAndDomain[]> 

    /**
     * retrieves all parsed domains and name accounts for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomainsUnwrapped(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[]> 

    /**
     * retrieves all parsed domains and name accounts including NFTs for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getParsedAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[]> 
}
