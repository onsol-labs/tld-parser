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
    getOwnedDomains,
    getParsedAllDomainsNftAccountsByOwner,
    getUserNfts,
    performReverseLookupBatched,
} from './utils';
import { MULTIPLE_ACCOUNT_INFO_MAX } from './constants';
import { NameAccountAndDomain, getDomainKey } from './name-record-handler';
import { ITldParser } from '../parsers.interface';
import async from 'async';

export class TldParserSvm implements ITldParser {
    connection: Connection;

    constructor(connection: Connection) {
        if (connection instanceof Connection) {
            this.connection = connection;
        } else {
            throw new Error('Method not implemented.');
        }
    }

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
        return allDomains.map((a: any) => a.pubkey);
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
        return allDomains.map((a: any) => a.pubkey);
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
     * retrieves all parsed domains as strings with name accounts in an array for user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: PublicKey | string,
        tld: string,
        concurrency: number = 10,
    ): Promise<NameAccountAndDomain[]> {
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
        const allDomainsPubkeys = allDomains.map((a: any) => a.pubkey);
        const batches: PublicKey[][] = [];
        for (
            let i = 0;
            i < allDomainsPubkeys.length;
            i += MULTIPLE_ACCOUNT_INFO_MAX
        ) {
            const end = Math.min(
                i + MULTIPLE_ACCOUNT_INFO_MAX,
                allDomainsPubkeys.length,
            );
            batches.push(allDomainsPubkeys.slice(i, end));
        }

        const results = await async.mapLimit(
            batches,
            concurrency,
            async (batch: PublicKey[]) => {
                const batchReverseLookup = await performReverseLookupBatched(
                    this.connection,
                    batch,
                    tldHouse,
                );
                const domainsWithTldsAndNameAccounts = batchReverseLookup.map(
                    (domain, index) => ({
                        nameAccount: batch[index],
                        domain: domain + tldName,
                    }),
                );
                if (domainsWithTldsAndNameAccounts.length > 0) {
                    domainsWithTldsAndNameAccounts.sort((a, b) =>
                        a.domain.localeCompare(b.domain, undefined, {
                            numeric: true,
                            sensitivity: 'base',
                        }),
                    );
                }
                return domainsWithTldsAndNameAccounts;
            },
        );

        const parsedNameAccountsAndDomains = results.flat();
        return parsedNameAccountsAndDomains;
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
        concurrency: number = 5,
    ): Promise<NameAccountAndDomain[]> {
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
        const allDomainsPubkeys = allDomains.map((a: any) => a.pubkey);
        let parsedNameAccountsAndDomains: NameAccountAndDomain[] = [];

        const allNFTDomains = await getParsedAllDomainsNftAccountsByOwner(
            userAccount,
            this.connection,
            findNameHouse(tldHouse)[0],
        );
        const nftDomainsWithTlds = allNFTDomains.map(domain => {
            return domain + tldName;
        });
        const domainsWithTldsAndNameAccounts = await Promise.all(
            nftDomainsWithTlds.map(async domain => {
                return {
                    nameAccount: (await getDomainKey(domain)).pubkey,
                    domain,
                };
            }),
        );

        parsedNameAccountsAndDomains.push(...domainsWithTldsAndNameAccounts);

        const batches: PublicKey[][] = [];
        for (
            let i = 0;
            i < allDomainsPubkeys.length;
            i += MULTIPLE_ACCOUNT_INFO_MAX
        ) {
            const end = Math.min(
                i + MULTIPLE_ACCOUNT_INFO_MAX,
                allDomainsPubkeys.length,
            );
            batches.push(allDomainsPubkeys.slice(i, end));
        }
        const batchResults = await async.mapLimit(
            batches,
            concurrency,
            async (batch: PublicKey[]) => {
                const batchReverseLookup = await performReverseLookupBatched(
                    this.connection,
                    batch,
                    tldHouse,
                );
                return batchReverseLookup.map((domain, index) => ({
                    nameAccount: batch[index],
                    domain: domain + tldName,
                }));
            },
        );
        parsedNameAccountsAndDomains.push(...batchResults.flat());
        if (parsedNameAccountsAndDomains.length > 0) {
            parsedNameAccountsAndDomains.sort((a, b) =>
                a.domain.localeCompare(b.domain, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                }),
            );
        }
        return parsedNameAccountsAndDomains;
    }

    /**
     * retrieves all parsed domains and name accounts for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsUnwrapped(
        userAccount: PublicKey | string,
        concurrency: number = 10,
    ): Promise<NameAccountAndDomain[]> {
        const allTlds = await getAllTld(this.connection);
        let parsedNameAccountsAndDomains: NameAccountAndDomain[] = [];

        if (typeof userAccount == 'string') {
            userAccount = new PublicKey(userAccount);
        }
        const allDomainsRaw = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount,
            undefined,
        );
        const tldResults = await async.mapLimit(
            allTlds,
            concurrency,
            async ({ parentAccount, tld }) => {
                let tldName = tld.toString();
                const [tldHouse] = findTldHouse(tldName);
                const allDomains = allDomainsRaw.filter(
                    a =>
                        a.data.parentName.toString() ===
                        parentAccount.toString(),
                );
                const allDomainsPubkeys = allDomains.map((a: any) => a.pubkey);

                const batches: PublicKey[][] = [];
                for (
                    let i = 0;
                    i < allDomainsPubkeys.length;
                    i += MULTIPLE_ACCOUNT_INFO_MAX
                ) {
                    const end = Math.min(
                        i + MULTIPLE_ACCOUNT_INFO_MAX,
                        allDomainsPubkeys.length,
                    );
                    batches.push(allDomainsPubkeys.slice(i, end));
                }
                // Sequentially process batches for each TLD
                let tldDomains: NameAccountAndDomain[] = [];
                for (const batch of batches) {
                    const batchReverseLookup =
                        await performReverseLookupBatched(
                            this.connection,
                            batch,
                            tldHouse,
                        );
                    const domainsWithTldsAndNameAccounts =
                        batchReverseLookup.map((domain, index) => ({
                            nameAccount: batch[index],
                            domain: domain + tldName,
                        }));
                    tldDomains.push(...domainsWithTldsAndNameAccounts);
                }
                return tldDomains;
            },
        );
        parsedNameAccountsAndDomains = tldResults.flat();
        if (parsedNameAccountsAndDomains.length > 0) {
            parsedNameAccountsAndDomains.sort((a, b) =>
                a.domain.localeCompare(b.domain, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                }),
            );
        }
        return parsedNameAccountsAndDomains;
    }

    /**
     * retrieves all parsed domains and name accounts including NFTs for user.
     * in alphabetical order
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomains(
        userAccount: PublicKey | string,
        concurrency: number = 10,
    ): Promise<NameAccountAndDomain[]> {
        const allTlds = await getAllTld(this.connection);
        let parsedNameAccountsAndDomains: NameAccountAndDomain[] = [];

        if (typeof userAccount == 'string') {
            userAccount = new PublicKey(userAccount);
        }
        const allDomainsRaw = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount,
            undefined,
        );
        const userNfts = await getUserNfts(userAccount, this.connection);
        const tldResults = await async.mapLimit(
            allTlds,
            concurrency,
            async ({ parentAccount, tld }) => {
                let tldName = tld.toString();
                const [tldHouse] = findTldHouse(tldName);
                const allDomains = allDomainsRaw.filter(
                    a =>
                        a.data.parentName.toString() ===
                        parentAccount.toString(),
                );
                const allDomainsPubkeys = allDomains.map((a: any) => a.pubkey);
                const allNFTDomains = await getOwnedDomains(
                    userNfts,
                    this.connection,
                    findNameHouse(tldHouse)[0],
                );

                const nftDomainsWithTlds = allNFTDomains.map(
                    domain => domain + tldName,
                );
                const domainsWithTldsAndNameAccounts = await Promise.all(
                    nftDomainsWithTlds.map(async domain => {
                        return {
                            nameAccount: (await getDomainKey(domain)).pubkey,
                            domain,
                        };
                    }),
                );

                let tldDomains: NameAccountAndDomain[] = [];
                tldDomains.push(...domainsWithTldsAndNameAccounts);

                const batches: PublicKey[][] = [];
                for (
                    let i = 0;
                    i < allDomainsPubkeys.length;
                    i += MULTIPLE_ACCOUNT_INFO_MAX
                ) {
                    const end = Math.min(
                        i + MULTIPLE_ACCOUNT_INFO_MAX,
                        allDomainsPubkeys.length,
                    );
                    batches.push(allDomainsPubkeys.slice(i, end));
                }
                // Sequentially process batches for each TLD
                for (const batch of batches) {
                    const batchReverseLookup =
                        await performReverseLookupBatched(
                            this.connection,
                            batch,
                            tldHouse,
                        );
                    const domainsWithTldsAndNameAccounts =
                        batchReverseLookup.map((domain, index) => ({
                            nameAccount: batch[index],
                            domain: domain + tldName,
                        }));
                    tldDomains.push(...domainsWithTldsAndNameAccounts);
                }
                return tldDomains;
            },
        );
        parsedNameAccountsAndDomains = tldResults.flat();
        if (parsedNameAccountsAndDomains.length > 0) {
            parsedNameAccountsAndDomains.sort((a, b) =>
                a.domain.localeCompare(b.domain, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                }),
            );
        }
        return parsedNameAccountsAndDomains;
    }
}
