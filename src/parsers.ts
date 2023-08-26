import { PublicKey, Connection } from '@solana/web3.js';
import { BN } from 'bn.js';

import { MainDomain } from './state/main-domain';
import { NameRecordHeader } from './state/name-record-header';
import {
    delay,
    findMainDomain,
    findNameHouse,
    findOwnedNameAccountsForUser,
    findTldHouse,
    getAllTld,
    getHashedName,
    getNameAccountKeyWithBump,
    getNameOwner,
    getOriginNameAccountKey,
    getParsedAllDomainsNftAccountsByOwner,
    performReverseLookupBatched,
} from './utils';
import { MULTIPLE_ACCOUNT_INFO_MAX } from './constants';

export class TldParser {
    constructor(private readonly connection: Connection) {}

    /**
     * retrieves all nameAccounts for any user.
     *
     * @param userAccount user publickey or string
     */
    async getAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<PublicKey[]> {
        if (typeof userAccount == 'string') {
            userAccount = new PublicKey(userAccount);
        }
        const allDomains = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount,
            undefined,
        );
        return allDomains;
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
    ): Promise<PublicKey[]> {
        const tldName = '.' + tld;

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [parentAccountKey] = getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );
        if (typeof userAccount == 'string') {
            userAccount = new PublicKey(userAccount);
        }
        const allDomains = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount,
            parentAccountKey,
        );
        return allDomains;
    }

    /**
     * retrieves owner of a specific Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    async getOwnerFromDomainTld(
        domainTld: string,
    ): Promise<PublicKey | undefined> {
        const domainTldSplit = domainTld.split('.');
        const domain = domainTldSplit[0];
        const tldName = '.' + domainTldSplit[1];

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [parentAccountKey] = getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );

        const domainHashedName = await getHashedName(domain);
        const [domainAccountKey] = getNameAccountKeyWithBump(
            domainHashedName,
            undefined,
            parentAccountKey,
        );

        const [tldHouse] = findTldHouse(tldName);

        const nameOwner = await getNameOwner(
            this.connection,
            domainAccountKey,
            tldHouse,
        );
        return nameOwner;
    }

    /**
     * retrieves domainTld data a domain from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    async getNameRecordFromDomainTld(
        domainTld: string,
    ): Promise<NameRecordHeader | undefined> {
        const domainTldSplit = domainTld.split('.');
        const domain = domainTldSplit[0];
        const tldName = '.' + domainTldSplit[1];

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [parentAccountKey] = getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );

        const domainHashedName = await getHashedName(domain);
        const [domainAccountKey] = getNameAccountKeyWithBump(
            domainHashedName,
            undefined,
            parentAccountKey,
        );
        const nameRecord = await NameRecordHeader.fromAccountAddress(
            this.connection,
            domainAccountKey,
        );
        return nameRecord;
    }

    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent publickey or string
     */
    async getTldFromParentAccount(
        parentAccount: PublicKey | string,
    ): Promise<string> {
        if (typeof parentAccount == 'string') {
            parentAccount = new PublicKey(parentAccount);
        }
        const parentNameAccount = await NameRecordHeader.fromAccountAddress(
            this.connection,
            parentAccount,
        );

        const tldHouseData = await this.connection.getAccountInfo(
            parentNameAccount?.owner!,
        );
        const tldStart = 8 + 32 + 32 + 32;
        const tldBuffer = tldHouseData?.data?.subarray(tldStart);
        const nameLength = new BN(tldBuffer?.subarray(0, 4), 'le').toNumber();
        const tld = tldBuffer
            .subarray(4, 4 + nameLength)
            .toString()
            .replace(/\0.*$/g, '');
        return tld;
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
        if (typeof nameAccount == 'string') {
            nameAccount = new PublicKey(nameAccount);
        }
        if (typeof parentAccountOwner == 'string') {
            parentAccountOwner = new PublicKey(parentAccountOwner);
        }

        const reverseLookupHashedName = await getHashedName(
            nameAccount.toString(),
        );
        const [reverseLookupAccount] = getNameAccountKeyWithBump(
            reverseLookupHashedName,
            parentAccountOwner,
            undefined,
        );

        const reverseLookUpResult = await NameRecordHeader.fromAccountAddress(
            this.connection,
            reverseLookupAccount,
        );
        const domain = reverseLookUpResult?.data?.toString();
        return domain;
    }
    /**
     * retrieves main domain name account and its domain tld from user address.
     *
     * @param userAddress user publickey or string
     */
    async getMainDomain(userAddress: PublicKey | string): Promise<MainDomain> {
        if (typeof userAddress == 'string') {
            userAddress = new PublicKey(userAddress);
        }

        const [mainDomainAddress] = findMainDomain(userAddress);
        const mainDomain = await MainDomain.fromAccountAddress(
            this.connection,
            mainDomainAddress,
        );
        return mainDomain;
    }
    /**
     * retrieves all parsed domains as strings in an array for user in a specific TLD.
     * in alphabetical order
     * i.e. ['miester.all']
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<string[]> {
        const tldName = '.' + tld;

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [tldHouse] = findTldHouse(tldName);
        const [parentAccountKey] = getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );
        if (typeof userAccount == 'string') {
            userAccount = new PublicKey(userAccount);
        }
        const allDomains = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount,
            parentAccountKey,
        );
        let parsedDomains: string[] = [];

        for (let i = 0; i < allDomains.length; i += MULTIPLE_ACCOUNT_INFO_MAX) {
            await delay(100);
            const end = Math.min(
                i + MULTIPLE_ACCOUNT_INFO_MAX,
                allDomains.length,
            );
            const batch = allDomains.slice(i, end);
            const batchReverseLookup = await performReverseLookupBatched(
                this.connection,
                batch,
                tldHouse,
            );
            const domainsWithTlds = batchReverseLookup.map(domain => {
                return domain + tldName;
            });
            if (domainsWithTlds.length > 0) {
                domainsWithTlds.sort((a, b) =>
                    a.localeCompare(b, undefined, {
                        numeric: true,
                        sensitivity: 'base',
                    }),
                );
            }
            parsedDomains.push(...domainsWithTlds);
        }
        return parsedDomains;
    }
    /**
     * retrieves all parsed domains (strings) including NFTs in an array for any user in a specific TLD.
     * in alphabetical order
     * i.e. ['miester.all']
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsFromTld(
        userAccount: PublicKey | string,
        tld: string,
    ): Promise<string[]> {
        const tldName = '.' + tld;

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [tldHouse] = findTldHouse(tldName);
        const [parentAccountKey] = getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );
        if (typeof userAccount == 'string') {
            userAccount = new PublicKey(userAccount);
        }
        const allDomains = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount,
            parentAccountKey,
        );
        let parsedDomains: string[] = [];
        const allNFTDomains = await getParsedAllDomainsNftAccountsByOwner(
            userAccount,
            this.connection,
            findNameHouse(tldHouse)[0],
        );
        const nftDomainsWithTlds = allNFTDomains.map(domain => {
            return domain + tldName;
        });
        parsedDomains.push(...nftDomainsWithTlds);

        for (let i = 0; i < allDomains.length; i += MULTIPLE_ACCOUNT_INFO_MAX) {
            await delay(100);
            const end = Math.min(
                i + MULTIPLE_ACCOUNT_INFO_MAX,
                allDomains.length,
            );
            const batch = allDomains.slice(i, end);
            const batchReverseLookup = await performReverseLookupBatched(
                this.connection,
                batch,
                tldHouse,
            );
            const domainsWithTlds = batchReverseLookup.map(domain => {
                return domain + tldName;
            });
            parsedDomains.push(...domainsWithTlds);
        }
        if (parsedDomains.length > 0) {
            parsedDomains.sort((a, b) =>
                a.localeCompare(b, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                }),
            );
        }
        return parsedDomains;
    }
    /**
     * retrieves all parsed domains (strings) for user.
     * in alphabetical order
     * i.e. ['miester.all']
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsUnwrapped(
        userAccount: PublicKey | string,
    ): Promise<string[]> {
        const allTlds = await getAllTld(this.connection);
        let parsedDomains: string[] = [];
        if (typeof userAccount == 'string') {
            userAccount = new PublicKey(userAccount);
        }
        for (let { parentAccount, tld } of allTlds) {
            let tldName = tld.toString();
            const [tldHouse] = findTldHouse(tldName);
            const allDomains = await findOwnedNameAccountsForUser(
                this.connection,
                userAccount,
                parentAccount,
            );

            for (
                let i = 0;
                i < allDomains.length;
                i += MULTIPLE_ACCOUNT_INFO_MAX
            ) {
                await delay(100);
                const end = Math.min(
                    i + MULTIPLE_ACCOUNT_INFO_MAX,
                    allDomains.length,
                );
                const batch = allDomains.slice(i, end);
                const batchReverseLookup = await performReverseLookupBatched(
                    this.connection,
                    batch,
                    tldHouse,
                );
                const domainsWithTlds = batchReverseLookup.map(domain => {
                    return domain + tldName;
                });
                parsedDomains.push(...domainsWithTlds);
            }
        }
        if (parsedDomains.length > 0) {
            parsedDomains.sort((a, b) =>
                a.localeCompare(b, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                }),
            );
        }
        return parsedDomains;
    }
    /**
     * retrieves all parsed domains (strings) including NFTs for user.
     * in alphabetical order
     * i.e. ['miester.all']
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomains(
        userAccount: PublicKey | string,
    ): Promise<string[]> {
        const allTlds = await getAllTld(this.connection);
        let parsedDomains: string[] = [];
        if (typeof userAccount == 'string') {
            userAccount = new PublicKey(userAccount);
        }
        for (let { parentAccount, tld } of allTlds) {
            let tldName = tld.toString();
            const [tldHouse] = findTldHouse(tldName);
            const allDomains = await findOwnedNameAccountsForUser(
                this.connection,
                userAccount,
                parentAccount,
            );
            const allNFTDomains = await getParsedAllDomainsNftAccountsByOwner(
                userAccount,
                this.connection,
                findNameHouse(tldHouse)[0],
            );
            const nftDomainsWithTlds = allNFTDomains.map(domain => {
                return domain + tldName;
            });
            parsedDomains.push(...nftDomainsWithTlds);

            for (
                let i = 0;
                i < allDomains.length;
                i += MULTIPLE_ACCOUNT_INFO_MAX
            ) {
                await delay(100);
                const end = Math.min(
                    i + MULTIPLE_ACCOUNT_INFO_MAX,
                    allDomains.length,
                );
                const batch = allDomains.slice(i, end);
                const batchReverseLookup = await performReverseLookupBatched(
                    this.connection,
                    batch,
                    tldHouse,
                );
                const domainsWithTlds = batchReverseLookup.map(domain => {
                    return domain + tldName;
                });
                parsedDomains.push(...domainsWithTlds);
            }
        }
        if (parsedDomains.length > 0) {
            parsedDomains.sort((a, b) =>
                a.localeCompare(b, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                }),
            );
        }
        return parsedDomains;
    }
}
