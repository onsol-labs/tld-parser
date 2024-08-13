import { PublicKey, Connection } from '@solana/web3.js';
import { NameAccountAndDomain } from './svm/name-record-handler';
import { TldParserSvm } from './svm/parsers';
import { MainDomain } from './svm/state/main-domain';
import { NameRecordHeader } from './svm/state/name-record-header';
import { ITldParser } from './parsers.interface';
import { Aptos, AptosSettings } from '@aptos-labs/ts-sdk';
import { TldParserMove } from './move/parsers';
import { NameRecord } from './move';

/**
 * TldParser class
 *
 * This class has been improved to maintain compatibility with previous versions.
 * The methods present in this class are provided for backwards compatibility
 * and to facilitate easy migration to v1 in future builds.
 *
 * The TldParser for multiple chains will be implemented, and Solana integration will remain unchanged without any breaking modifications.
 */
export class TldParser implements ITldParser {
    connection: Connection | Aptos;

    constructor(connection: Connection | AptosSettings, chain?: string) {
        if (new.target === TldParser) {
            return TldParser.createParser(connection, chain);
        }
    }

    private static createParser(
        connection: Connection | AptosSettings,
        chain?: string,
    ): ITldParser {
        switch (chain?.toLowerCase()) {
            case 'yona':
            case 'eclipse':
            case 'termina':
            case 'solana':
            case undefined:
                return new TldParserSvm(connection);
            case 'move':
                return new TldParserMove(connection);
            default:
                throw new Error(`Unsupported TldParser chain: ${chain}`);
        }
    }

    /**
     * retrieves all nameAccounts for any user.
     *
     * @param userAccount user publickey or string
     */
    async getAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<PublicKey[] | NameRecord[]> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves all nameaccounts for any user in a specific tld.
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getAllUserDomainsFromTld(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<PublicKey[] | NameRecord[]> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves owner of a specific Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    async getOwnerFromDomainTld(
        domainTld: string,
    ): Promise<PublicKey | undefined | string> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves domainTld data a domain from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    async getNameRecordFromDomainTld(
        domainTld: string,
    ): Promise<NameRecordHeader | NameRecord | undefined> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent publickey or string
     */
    async getTldFromParentAccount(
        parentAccount: PublicKey | string,
    ): Promise<string> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves domain from name account via tldParent account.
     *
     * @param nameAccount name publickey or string
     * @param parentAccountOwner parent Owner or string (TldHouse)
     */
    async reverseLookupNameAccount(
        nameAccount: PublicKey | string,
        parentAccountOwner: PublicKey | string,
    ): Promise<string> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves main domain name account and its domain tld from user address.
     *
     * @param userAddress user publickey or string
     */
    async getMainDomain(
        userAddress: PublicKey | string,
    ): Promise<MainDomain | NameRecord> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves all parsed domains as strings with name accounts in an array for user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<NameAccountAndDomain[]> {
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
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<NameAccountAndDomain[]> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves all parsed domains and name accounts for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     */
    async getParsedAllUserDomainsUnwrapped(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[]> {
        throw new Error('Method not implemented.');
    }

    /**
     * retrieves all parsed domains and name accounts including NFTs for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     */
    async getParsedAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<NameAccountAndDomain[]> {
        throw new Error('Method not implemented.');
    }
}
