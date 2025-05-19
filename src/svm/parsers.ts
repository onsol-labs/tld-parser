import { fetchMaybeMainDomain, MainDomain } from './state/main-domain';
import {
    fetchMaybeNameRecordHeader,
    getNameRecordHeaderDecoder,
    NameRecordHeader,
} from './state/name-record-header';
import {
    findMainDomain,
    findNameHouse,
    findOwnedNameAccountsForUser,
    findTldHouse,
    getAllTld,
    getHashedName,
    getNameAccountKeyWithBump,
    getNameOwner,
    getOriginNameAccountKey,
    getOwnedDomainsFromNfts,
    getOwnerNfts,
    getParsedAllDomainsNftAccountsByOwner,
    performReverseLookupBatched,
    utf8Codec,
} from './utils';
import { MULTIPLE_ACCOUNT_INFO_MAX } from './constants';
import { NameAccountAndDomain, getDomainKey } from './name-record-handler';
import pLimit from 'p-limit';
import { ITldParser } from '../parsers.interface';
import { Address, fetchEncodedAccount, Rpc, SolanaRpcApi } from '@solana/kit';

export class TldParserSvm implements ITldParser {
    connection: Rpc<SolanaRpcApi>;
    constructor(rpc: Rpc<SolanaRpcApi>) {
        this.connection = rpc;
    }

    /**
     * retrieves all nameAccounts for any user.
     *
     * @param userAccount user Address or string
     */
    async getAllUserDomains(userAccount: Address | string): Promise<Address[]> {
        const allDomains = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount as Address,
            undefined,
        );
        const allDomainsAddresses = allDomains.map(domain => domain.pubkey);
        return allDomainsAddresses;
    }

    /**
     * retrieves all nameaccounts for any user in a specific tld.
     *
     * @param userAccount user Address or string
     * @param tld tld to be retrieved from
     */
    async getAllUserDomainsFromTld(
        userAccount: Address | string,
        tld: string,
    ): Promise<Address[]> {
        const tldName = '.' + tld;

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [parentAccountKey] = await getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );
        const allDomains = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount as Address,
            parentAccountKey,
        );
        const allDomainsAddresses = allDomains.map(domain => domain.pubkey);
        return allDomainsAddresses;
    }

    /**
     * retrieves owner of a specific Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    async getOwnerFromDomainTld(
        domainTld: string,
    ): Promise<Address | undefined> {
        const domainTldSplit = domainTld.split('.');
        const domain = domainTldSplit[0];
        const tldName = '.' + domainTldSplit[1];

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [parentAccountKey] = await getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );

        const domainHashedName = await getHashedName(domain);
        const [domainAccountKey] = await getNameAccountKeyWithBump(
            domainHashedName,
            undefined,
            parentAccountKey,
        );

        const [tldHouse] = await findTldHouse(tldName);

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
        const [parentAccountKey] = await getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );

        const domainHashedName = await getHashedName(domain);
        const [domainAccountKey] = await getNameAccountKeyWithBump(
            domainHashedName,
            undefined,
            parentAccountKey,
        );
        const nameRecord = await fetchMaybeNameRecordHeader(
            this.connection,
            domainAccountKey,
        );
        return nameRecord.exists ? nameRecord.data : undefined;
    }

    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent Address or string
     */
    async getTldFromParentAccount(parentAccount: Address): Promise<string> {
        const parentNameAccount = await fetchMaybeNameRecordHeader(
            this.connection,
            parentAccount,
        );
        if (!parentNameAccount.exists) {
            throw new Error('Parent account does not exist');
        }
        const tldHouseData = await fetchEncodedAccount(
            this.connection,
            parentNameAccount.data.owner,
        );
        if (!tldHouseData.exists) {
            throw new Error('TldHouse account does not exist');
        }
        const tldStart = 8 + 32 + 32 + 32;
        const tldBuffer = tldHouseData.data?.slice(tldStart);

        const view = new DataView(tldBuffer.buffer);
        const nameLength = view.getUint32(0, true);

        return utf8Codec
            .decode(tldBuffer.subarray(4, 4 + nameLength))
            .replace(/^\0/, '\0');
    }

    /**
     * retrieves domain from name account via tldParent account.
     *
     * @param nameAccount name Address or string
     * @param parentAccountOwner parent Owner or string (TldHouse)
     */
    async reverseLookupNameAccount(
        nameAccount: Address,
        parentAccountOwner: Address,
    ): Promise<string> {
        const reverseLookupHashedName = await getHashedName(
            nameAccount.toString(),
        );
        const [reverseLookupAccount] = await getNameAccountKeyWithBump(
            reverseLookupHashedName,
            parentAccountOwner,
            undefined,
        );

        const reverseLookUpResult = await fetchMaybeNameRecordHeader(
            this.connection,
            reverseLookupAccount,
        );
        if (!reverseLookUpResult.exists) return undefined;
        const nameStart = 200;
        const data = reverseLookUpResult.data.data.slice(nameStart);

        return utf8Codec.decode(data).replace(/^\0/, '\0');
    }

    /**
     * retrieves main domain name account and its domain tld from user address.
     *
     * @param userAddress user Address or string
     */
    async getMainDomain(userAddress: Address | string): Promise<MainDomain> {
        const [mainDomainAddress] = await findMainDomain(
            userAddress as Address,
        );
        const mainDomain = await fetchMaybeMainDomain(
            this.connection,
            mainDomainAddress,
        );
        if (!mainDomain.exists) {
            throw new Error('Main domain does not exist');
        }
        return mainDomain.data;
    }

    /**
     * retrieves all parsed domains as strings with name accounts in an array for user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user Address or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsFromTldUnwrapped(
        userAccount: Address | string,
        tld: string,
        concurrency: number = 10,
    ): Promise<NameAccountAndDomain[]> {
        const limit = pLimit(concurrency);
        const tldName = '.' + tld;

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [tldHouse] = await findTldHouse(tldName);
        const [parentAccountKey] = await getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );
        const allDomains = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount as Address,
            parentAccountKey,
        );
        const allDomainsAddresses = allDomains.map(domain => domain.pubkey);
        let parsedNameAccountsAndDomains: NameAccountAndDomain[] = [];

        const batchResults = await Promise.all(
            Array.from(
                {
                    length: Math.ceil(
                        allDomainsAddresses.length / MULTIPLE_ACCOUNT_INFO_MAX,
                    ),
                },
                (_, idx) => {
                    const i = idx * MULTIPLE_ACCOUNT_INFO_MAX;
                    const end = Math.min(
                        i + MULTIPLE_ACCOUNT_INFO_MAX,
                        allDomainsAddresses.length,
                    );
                    const batch = allDomainsAddresses.slice(i, end);
                    return limit(async () => {
                        const batchReverseLookup =
                            await performReverseLookupBatched(
                                this.connection,
                                batch,
                                tldHouse,
                            );
                        const domainsWithTldsAndNameAccounts =
                            batchReverseLookup.map((domain, index) => {
                                return {
                                    nameAccount: batch[index],
                                    domain: domain + tldName,
                                };
                            });
                        if (domainsWithTldsAndNameAccounts.length > 0) {
                            domainsWithTldsAndNameAccounts.sort((a, b) =>
                                a.domain.localeCompare(b.domain, undefined, {
                                    numeric: true,
                                    sensitivity: 'base',
                                }),
                            );
                        }
                        return domainsWithTldsAndNameAccounts;
                    });
                },
            ),
        );
        parsedNameAccountsAndDomains.push(...batchResults.flat());
        return parsedNameAccountsAndDomains;
    }

    /**
     * retrieves all parsed domains and name accounts including NFTs in an array for any user in a specific TLD.
     * in alphabetical order
     *
     * @param userAccount user Address or string
     * @param tld tld to be retrieved from
     */
    async getParsedAllUserDomainsFromTld(
        userAccount: Address | string,
        tld: string,
        concurrency: number = 10,
    ): Promise<NameAccountAndDomain[]> {
        const limit = pLimit(concurrency);
        const tldName = '.' + tld;

        const nameOriginTldKey = await getOriginNameAccountKey();
        const parentHashedName = await getHashedName(tldName);
        const [tldHouse] = await findTldHouse(tldName);
        const [parentAccountKey] = await getNameAccountKeyWithBump(
            parentHashedName,
            undefined,
            nameOriginTldKey,
        );
        const allDomains = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount as Address,
            parentAccountKey,
        );
        const allDomainsAddresses = allDomains.map(domain => domain.pubkey);
        let parsedNameAccountsAndDomains: NameAccountAndDomain[] = [];
        const [nameHouse] = await findNameHouse(tldHouse);
        const allNFTDomains = await getParsedAllDomainsNftAccountsByOwner(
            userAccount as Address,
            this.connection,
            nameHouse,
        );
        const nftDomainsWithTlds = allNFTDomains.map(domain => {
            return domain + tldName;
        });
        const domainsWithTldsAndNameAccounts = await Promise.all(
            nftDomainsWithTlds.map(domain =>
                limit(async () => ({
                    nameAccount: (await getDomainKey(domain)).pubkey,
                    domain,
                })),
            ),
        );

        parsedNameAccountsAndDomains.push(...domainsWithTldsAndNameAccounts);

        const batchResults = await Promise.all(
            Array.from(
                {
                    length: Math.ceil(
                        allDomainsAddresses.length / MULTIPLE_ACCOUNT_INFO_MAX,
                    ),
                },
                (_, idx) => {
                    const i = idx * MULTIPLE_ACCOUNT_INFO_MAX;
                    const end = Math.min(
                        i + MULTIPLE_ACCOUNT_INFO_MAX,
                        allDomainsAddresses.length,
                    );
                    const batch = allDomainsAddresses.slice(i, end);
                    return limit(async () => {
                        const batchReverseLookup =
                            await performReverseLookupBatched(
                                this.connection,
                                batch,
                                tldHouse,
                            );
                        const domainsWithTldsAndNameAccounts =
                            batchReverseLookup.map((domain, index) => {
                                return {
                                    nameAccount: batch[index],
                                    domain: domain + tldName,
                                };
                            });
                        return domainsWithTldsAndNameAccounts;
                    });
                },
            ),
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
     * Retrieves all parsed domains and name accounts (including NFTs) for a user across all TLDs.
     * Results are returned in alphabetical order by domain name.
     *
     * Uses concurrency control for batch lookups to improve performance.
     *
     * @param userAccount - The user's address or string representation of the address.
     * @param concurrency - (Optional) The maximum number of concurrent requests (default: 10).
     * @returns A promise that resolves to an array of NameAccountAndDomain objects for all domains owned by the user.
     */
    async getParsedAllUserDomainsUnwrapped(
        userAccount: Address | string,
        concurrency: number = 10,
    ): Promise<NameAccountAndDomain[]> {
        const limit = pLimit(concurrency);
        const allTlds = await getAllTld(this.connection);
        let parsedNameAccountsAndDomains: NameAccountAndDomain[] = [];

        const allDomainsRaw = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount as Address,
            undefined,
        );
        const allDomainsWithData = allDomainsRaw.map(domain => {
            return {
                pubkey: domain.pubkey,
                data: getNameRecordHeaderDecoder().decode(
                    domain.account.data as any,
                ),
            };
        });
        const tldResults = await Promise.all(
            allTlds.map(({ parentAccount, tld }) =>
                limit(async () => {
                    let tldName = tld.toString();
                    const [tldHouse] = await findTldHouse(tldName);
                    let allDomains = allDomainsWithData.filter(
                        domain => domain.data.parentName === parentAccount,
                    );

                    let parsedNameAccountsAndDomainsEachTld: NameAccountAndDomain[] =
                        [];
                    const allDomainsAddresses = allDomains.map(
                        domain => domain.pubkey,
                    );
                    for (
                        let i = 0;
                        i < allDomainsAddresses.length;
                        i += MULTIPLE_ACCOUNT_INFO_MAX
                    ) {
                        // await delay(100);
                        const end = Math.min(
                            i + MULTIPLE_ACCOUNT_INFO_MAX,
                            allDomainsAddresses.length,
                        );
                        const batch = allDomainsAddresses.slice(i, end);
                        const batchReverseLookup =
                            await performReverseLookupBatched(
                                this.connection,
                                batch,
                                tldHouse,
                            );
                        const domainsWithTldsAndNameAccounts =
                            batchReverseLookup.map((domain, index) => {
                                return {
                                    nameAccount: batch[index],
                                    domain: domain + tldName,
                                };
                            });
                        parsedNameAccountsAndDomainsEachTld.push(
                            ...domainsWithTldsAndNameAccounts,
                        );
                    }
                    return parsedNameAccountsAndDomainsEachTld;
                }),
            ),
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
     * @param userAccount user Address or string
     * @param concurrency concurrency for parallel processing
     */
    async getParsedAllUserDomains(
        userAccount: Address | string,
        concurrency: number = 10,
    ): Promise<NameAccountAndDomain[]> {
        const limit = pLimit(concurrency);
        const allTlds = await getAllTld(this.connection);

        let parsedNameAccountsAndDomains: NameAccountAndDomain[] = [];

        const ownerNfts = await getOwnerNfts(
            userAccount as Address,
            this.connection,
        );
        const allDomainsRaw = await findOwnedNameAccountsForUser(
            this.connection,
            userAccount as Address,
            undefined,
        );

        const allDomainsWithData = allDomainsRaw.map(domain => {
            return {
                pubkey: domain.pubkey,
                data: getNameRecordHeaderDecoder().decode(
                    domain.account.data as any,
                ),
            };
        });

        const tldResults = await Promise.all(
            allTlds.map(({ parentAccount, tld }) =>
                limit(async () => {
                    let tldName = tld.toString();
                    let allDomains = allDomainsWithData.filter(
                        domain => domain.data.parentName === parentAccount,
                    );
                    let allDomainsAddresses = allDomains.map(
                        domain => domain.pubkey,
                    );

                    const [tldHouse] = await findTldHouse(tldName);
                    const [nameHouse] = await findNameHouse(tldHouse);
                    const allNFTDomains = await getOwnedDomainsFromNfts(
                        ownerNfts,
                        this.connection,
                        nameHouse,
                    );
                    const nftDomainsWithTlds = allNFTDomains.map(domain => {
                        return domain + tldName;
                    });
                    const domainsWithTldsAndNameAccounts = await Promise.all(
                        nftDomainsWithTlds.map(async domain => {
                            const key = (await getDomainKey(domain)).pubkey;
                            return {
                                nameAccount: key,
                                domain,
                            };
                        }),
                    );

                    let parsedNameAccountsAndDomains: NameAccountAndDomain[] =
                        [];
                    parsedNameAccountsAndDomains.push(
                        ...domainsWithTldsAndNameAccounts,
                    );

                    for (
                        let i = 0;
                        i < allDomainsAddresses.length;
                        i += MULTIPLE_ACCOUNT_INFO_MAX
                    ) {
                        const end = Math.min(
                            i + MULTIPLE_ACCOUNT_INFO_MAX,
                            allDomainsAddresses.length,
                        );
                        const batch = allDomainsAddresses.slice(i, end);
                        const batchReverseLookup =
                            await performReverseLookupBatched(
                                this.connection,
                                batch,
                                tldHouse,
                            );
                        const domainsWithTldsAndNameAccounts =
                            batchReverseLookup.map((domain, index) => {
                                return {
                                    nameAccount: batch[index],
                                    domain: domain + tldName,
                                };
                            });
                        parsedNameAccountsAndDomains.push(
                            ...domainsWithTldsAndNameAccounts,
                        );
                    }
                    return parsedNameAccountsAndDomains;
                }),
            ),
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
