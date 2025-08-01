import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { sha256 } from '@ethersproject/sha2';

import {
    ANS_PROGRAM_ID,
    MAIN_DOMAIN_PREFIX,
    NAME_HOUSE_PREFIX,
    NAME_HOUSE_PROGRAM_ID,
    NFT_RECORD_PREFIX,
    ORIGIN_TLD,
    SPL_TOKEN_PROGRAM_ID,
    TLD_HOUSE_PREFIX,
    TLD_HOUSE_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM_ID,
} from './constants';
import { NameRecordHeader } from './state/name-record-header';
import { Tag } from './types/tag';
import { NftRecord } from './state/nft-record';
import { MainDomain } from './state/main-domain';

/**
 * retrieves raw name account
 *
 * @param hashedName hashed name of the name account
 * @param nameClass defaults to pubkey::default()
 * @param parentName defaults to pubkey::default()
 */
export function getNameAccountKeyWithBump(
    hashedName: Buffer,
    nameClass?: PublicKey,
    parentName?: PublicKey,
): [PublicKey, number] {
    const seeds = [
        hashedName,
        nameClass ? nameClass.toBuffer() : Buffer.alloc(32),
        parentName ? parentName.toBuffer() : Buffer.alloc(32),
    ];

    return PublicKey.findProgramAddressSync(seeds, ANS_PROGRAM_ID);
}

/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
export async function getNameOwner(
    connection: Connection,
    nameAccountKey: PublicKey,
    tldHouse?: PublicKey,
): Promise<PublicKey | undefined> {
    const nameAccount = await NameRecordHeader.fromAccountAddress(
        connection,
        nameAccountKey,
    );
    const owner = nameAccount.owner;
    if (!nameAccount.isValid) return undefined;
    if (!tldHouse) return owner;
    const [nameHouse] = findNameHouse(tldHouse);
    const [nftRecord] = findNftRecord(nameAccountKey, nameHouse);
    if (owner?.toBase58() !== nftRecord.toBase58()) return owner;
    return await getMintOwner(connection, nftRecord);
}

/**
 * computes hashed name
 *
 * @param name any string or domain name.
 */
export async function getHashedName(name: string): Promise<Buffer> {
    const input = NameRecordHeader.HASH_PREFIX + name;
    const str = sha256(Buffer.from(input, 'utf8')).slice(2);
    return Buffer.from(str, 'hex');
}

/**
 * A constant in tld house.
 *
 * get origin name account should always equal to 3mX9b4AZaQehNoQGfckVcmgmA6bkBoFcbLj9RMmMyNcU
 *
 * @param originTld
 */
export async function getOriginNameAccountKey(
    originTld: string = ORIGIN_TLD,
): Promise<PublicKey> {
    const hashed_name = await getHashedName(originTld);
    const [nameAccountKey] = getNameAccountKeyWithBump(
        hashed_name,
        undefined,
        undefined,
    );
    return nameAccountKey;
}

/**
 * finds list of all name accounts for a particular user.
 *
 * @param connection sol connection
 * @param userAccount user's public key
 * @param parentAccount nameAccount's parentName
 */
export async function findOwnedNameAccountsForUser(
    connection: Connection,
    userAccount: PublicKey,
    parentAccount: PublicKey | undefined,
) {
    const filters: any = [
        {
            memcmp: {
                offset: 40,
                bytes: userAccount.toBase58(),
                encoding: 'base58',
            },
        },
    ];

    if (parentAccount) {
        filters.push({
            memcmp: {
                offset: 8,
                bytes: parentAccount.toBase58(),
                encoding: 'base58',
            },
        });
    }

    const accounts = await connection.getProgramAccounts(ANS_PROGRAM_ID, {
        filters: filters,
        dataSlice: { offset: 0, length: 200 }
    });

    return accounts.map(a => {
        return {
            pubkey: a.pubkey,
            data: NameRecordHeader.fromAccountInfo(a.account),
        };
    });
}

export function findMainDomain(user: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(MAIN_DOMAIN_PREFIX), user.toBuffer()],
        TLD_HOUSE_PROGRAM_ID,
    );
}

/**
 * finds list of all tld house accounts live.
 *
 * @param connection sol connection
 */
export async function getAllTld(connection: Connection): Promise<
    Array<{
        tld: String;
        parentAccount: PublicKey;
    }>
> {
    const filters: any = [
        {
            memcmp: {
                offset: 0,
                bytes: 'iQgos3SdaVE',
            },
        },
    ];

    const accounts = await connection.getProgramAccounts(TLD_HOUSE_PROGRAM_ID, {
        filters: filters,
    });

    const tldsAndParentAccounts: {
        tld: String;
        parentAccount: PublicKey;
    }[] = [];

    accounts.map(({ account }) => {
        const parentAccount = getParentAccountFromTldHouseAccountInfo(account);
        const tld = getTldFromTldHouseAccountInfo(account);
        tldsAndParentAccounts.push({ tld, parentAccount });
    });
    return tldsAndParentAccounts;
}

export function getTldFromTldHouseAccountInfo(
    tldHouseData: AccountInfo<Buffer>,
) {
    const tldStart = 8 + 32 + 32 + 32;
    const tldBuffer = tldHouseData?.data?.subarray(tldStart);
    const nameLength = new BN(tldBuffer?.subarray(0, 4), 'le').toNumber();
    return tldBuffer
        .subarray(4, 4 + nameLength)
        .toString()
        .replace(/\0.*$/g, '');
}

export function getParentAccountFromTldHouseAccountInfo(
    tldHouseData: AccountInfo<Buffer>,
) {
    const parentAccountStart = 8 + 32 + 32;
    const parentAccountBuffer = tldHouseData?.data?.subarray(
        parentAccountStart,
        parentAccountStart + 32,
    );

    return new PublicKey(parentAccountBuffer);
}

/**
 * finds list of all domains in parent account from tld.
 *
 * @param connection sol connection
 * @param parentAccount nameAccount's parentName
 */
export async function findAllDomainsForTld(
    connection: Connection,
    parentAccount: PublicKey,
): Promise<PublicKey[]> {
    const filters: any = [
        {
            memcmp: {
                offset: 8,
                bytes: parentAccount.toBase58(),
                encoding: 'base58',
            },
        },
    ];

    const accounts = await connection.getProgramAccounts(ANS_PROGRAM_ID, {
        filters: filters,
        dataSlice: { offset: 8, length: 40 },
    });
    return accounts.map((a: any) => a.pubkey);
}

export async function getMintOwner(
    connection: Connection,
    nftRecord: PublicKey,
) {
    try {
        const nftRecordData = await NftRecord.fromAccountAddress(
            connection,
            nftRecord,
        );
        if (nftRecordData.tag !== Tag.ActiveRecord) return;
        const largestAccounts = await connection.getTokenLargestAccounts(
            nftRecordData.nftMintAccount,
        );
        const largestAccountInfo = await connection.getParsedAccountInfo(
            largestAccounts.value[0].address,
        );
        if (!largestAccountInfo.value.data) return;
        // @ts-ignore
        return new PublicKey(largestAccountInfo.value.data.parsed.info.owner);
    } catch {
        return undefined;
    }
}

export function findNftRecord(
    nameAccount: PublicKey,
    nameHouseAccount: PublicKey,
) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from(NFT_RECORD_PREFIX),
            nameHouseAccount.toBuffer(),
            nameAccount.toBuffer(),
        ],
        NAME_HOUSE_PROGRAM_ID,
    );
}

export function findTldHouse(tldString: string) {
    tldString = tldString.toLowerCase();
    return PublicKey.findProgramAddressSync(
        [Buffer.from(TLD_HOUSE_PREFIX), Buffer.from(tldString)],
        TLD_HOUSE_PROGRAM_ID,
    );
}

export function findNameHouse(tldHouse: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(NAME_HOUSE_PREFIX), tldHouse.toBuffer()],
        NAME_HOUSE_PROGRAM_ID,
    );
}

export const findMetadataAddress = (mint: PublicKey): PublicKey => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID,
    )[0];
};

export async function performReverseLookupBatched(
    connection: Connection,
    nameAccounts: PublicKey[],
    tldHouse: PublicKey,
): Promise<(string | undefined)[]> {
    const promises = nameAccounts.map(async nameAccount => {
        const reverseLookupHashedName = await getHashedName(
            nameAccount.toBase58(),
        );
        const [reverseLookUpAccount] = getNameAccountKeyWithBump(
            reverseLookupHashedName,
            tldHouse,
            undefined,
        );
        return reverseLookUpAccount;
    });
    const reverseLookUpAccounts: PublicKey[] = await Promise.all(promises);
    const reverseLookupAccountInfos = await connection.getMultipleAccountsInfo(
        reverseLookUpAccounts,
    );

    return reverseLookupAccountInfos.map(reverseLookupAccountInfo => {
        const domain = reverseLookupAccountInfo?.data
            .subarray(
                NameRecordHeader.byteSize,
                reverseLookupAccountInfo?.data.length,
            )
            .toString();
        return domain;
    });
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getUserNfts(owner: PublicKey, connection: Connection) {
    const { value: splAccounts } =
        await connection.getParsedTokenAccountsByOwner(owner, {
            programId: SPL_TOKEN_PROGRAM_ID,
        });

    const nftAccounts = splAccounts
        .filter(t => {
            const amount = t.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
            const decimals =
                t.account?.data?.parsed?.info?.tokenAmount?.decimals;
            return decimals === 0 && amount === 1;
        })
        .map(t => {
            const address = t.account?.data?.parsed?.info?.mint;
            return address;
        });
    return nftAccounts;
}

export const getParsedAllDomainsNftAccountsByOwner = async (
    owner: PublicKey,
    connection: Connection,
    expectedCreator: PublicKey,
) => {
    const nftAccounts = await getUserNfts(owner, connection);
    const ownerDomains = await getOwnedDomains(
        nftAccounts,
        connection,
        expectedCreator,
    );

    return ownerDomains;
};

export const getOwnedDomains = async (
    nftAddresses: string[],
    connection: Connection,
    expectedCreator: PublicKey,
) => {
    const ownedDomains: string[] = [];
    const verifiedCreatorByteOffset = 326;
    const verifiedCreatorVerfiiedByteOffset = 326;

    if (nftAddresses.length > 100) {
        while (nftAddresses.length > 0) {
            let nftMetadataKeys = nftAddresses
                .splice(0, 100)
                .map((mint: string) =>
                    findMetadataAddress(new PublicKey(mint)),
                );
            const nftsMetadata =
                await connection.getMultipleAccountsInfo(nftMetadataKeys);
            for (const nftMetadata of nftsMetadata) {
                if (nftMetadata) {
                    const verifiedCreatorAddress = new PublicKey(
                        nftMetadata.data.subarray(
                            verifiedCreatorByteOffset,
                            verifiedCreatorByteOffset + 32,
                        ),
                    );
                    const isVerified = Boolean(
                        nftMetadata.data.subarray(
                            verifiedCreatorVerfiiedByteOffset,
                            verifiedCreatorVerfiiedByteOffset + 1,
                        ),
                    );
                    if (
                        isVerified &&
                        verifiedCreatorAddress.toString() ===
                            expectedCreator.toString()
                    ) {
                        const domainName = nftMetadata.data
                            .subarray(66, 101)
                            .toString()
                            .replace(/\u0000/g, '');
                        ownedDomains.push(domainName);
                    }
                }
            }
        }
    } else {
        let nftMetadataKeys = nftAddresses.map((mint: string) =>
            findMetadataAddress(new PublicKey(mint)),
        );
        const nftsMetadata =
            await connection.getMultipleAccountsInfo(nftMetadataKeys);
        for (const nftMetadata of nftsMetadata) {
            if (nftMetadata) {
                const verifiedCreatorAddress = new PublicKey(
                    nftMetadata.data.subarray(
                        verifiedCreatorByteOffset,
                        verifiedCreatorByteOffset + 32,
                    ),
                );
                const isVerified = Boolean(
                    nftMetadata.data.subarray(
                        verifiedCreatorVerfiiedByteOffset,
                        verifiedCreatorVerfiiedByteOffset + 1,
                    ),
                );
                if (
                    isVerified &&
                    verifiedCreatorAddress.toString() ===
                        expectedCreator.toString()
                ) {
                    const domainName = nftMetadata.data
                        .subarray(66, 101)
                        .toString()
                        .replace(/\u0000/g, '');
                    ownedDomains.push(domainName);
                }
            }
        }
    }

    return ownedDomains;
};

export function splitDomainTld(domain: string) {
    const parts = domain.split('.');
    let tld = '',
        domainName = '',
        subdomain = '';

    if (parts.length === 1) {
        domainName = parts[0];
    } else {
        tld = '.' + parts[parts.length - 1];
        domainName = parts[parts.length - 2];
        subdomain = parts.slice(0, parts.length - 2).join('.');
    }

    return [tld, domainName, subdomain];
}

export function findMintAddress(
    nameAccount: PublicKey,
    nameHouseAccount: PublicKey,
) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from(NAME_HOUSE_PREFIX),
            nameHouseAccount.toBuffer(),
            nameAccount.toBuffer(),
        ],
        NAME_HOUSE_PROGRAM_ID,
    );
}

export function findRenewableMintAddress(
    nameAccount: PublicKey,
    nameHouseAccount: PublicKey,
    expiresAtBuffer: Buffer,
) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from(NAME_HOUSE_PREFIX),
            nameHouseAccount.toBuffer(),
            nameAccount.toBuffer(),
            expiresAtBuffer,
        ],
        NAME_HOUSE_PROGRAM_ID,
    );
}

/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
export async function getDomainMintAccountKey(
    connection: Connection,
    nameAccountKey: PublicKey,
    tldHouse: PublicKey,
): Promise<PublicKey | undefined> {
    const nameAccount = await NameRecordHeader.fromAccountAddress(
        connection,
        nameAccountKey,
    );
    const expiryDate = nameAccount.expiresAt;
    const secondSinceEpoch = new Date(0);
    let mintAccount: PublicKey | undefined;
    const [nameHouse] = findNameHouse(tldHouse);
    if (expiryDate === secondSinceEpoch) {
        [mintAccount] = findMintAddress(nameAccountKey, nameHouse);
    } else {
        [mintAccount] = findRenewableMintAddress(
            nameAccountKey,
            nameHouse,
            dateToU64Buffer(expiryDate),
        );
    }
    return mintAccount;
}

export async function getMintAccountFromDomainTld(
    connection: Connection,
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
    return await getDomainMintAccountKey(
        connection,
        domainAccountKey,
        tldHouse,
    );
}

function dateToU64Buffer(expiryDate: Date): Buffer {
    const secondsSinceEpoch = Math.floor(expiryDate.getTime() / 1000);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(secondsSinceEpoch));
    return buffer;
}

export const getMultipleMainDomainsChecked = async (
    connection: Connection,
    pubkeys: string[],
): Promise<
    {
        pubkey: string;
        mainDomain: string | undefined;
        nameAccount: PublicKey | undefined;
    }[]
> => {
    const mainDomainKeys = pubkeys.map(
        pubkey => findMainDomain(new PublicKey(pubkey))[0],
    );

    // fetch main domain accounts
    const mainDomainAccounts =
        await connection.getMultipleAccountsInfo(mainDomainKeys);

    const mainDomainWithNameAccounts = pubkeys.map((pubkey, index) => {
        const mainDomainAccount = mainDomainAccounts[index];
        if (!!mainDomainAccount?.data) {
            const mainDomainData =
                MainDomain.fromAccountInfo(mainDomainAccount)[0];
            const nameAccount = mainDomainData.nameAccount;
            return {
                pubkey: pubkey.toString(),
                nameAccount,
                mainDomain: mainDomainData.domain + mainDomainData.tld,
            };
        }
        return {
            pubkey: pubkey.toString(),
            nameAccount: undefined,
            mainDomain: undefined,
        };
    });
    // fetch name accounts
    const nameAccounts = mainDomainWithNameAccounts.map(
        item => item.nameAccount,
    );
    const filteredNameAccountsWithIndex = nameAccounts
        .map((pk, idx) => (pk ? { pk, idx } : undefined))
        .filter((x): x is { pk: PublicKey; idx: number } => !!x);
    const filteredNameAccounts = filteredNameAccountsWithIndex.map(x => x.pk);
    const nameAccountsInfo =
        await connection.getMultipleAccountsInfo(filteredNameAccounts);

    // map infoByOriginalIdx
    const infoByOriginalIdx = new Array<AccountInfo<Buffer> | null>(
        nameAccounts.length,
    ).fill(null);
    filteredNameAccountsWithIndex.forEach((entry, i) => {
        infoByOriginalIdx[entry.idx] = nameAccountsInfo[i];
    });

    const result = await Promise.all(
        mainDomainWithNameAccounts.map(async (item, index) => {
            const nameAccount = item.nameAccount;
            const info = infoByOriginalIdx[index];
            if (!nameAccount || !info) {
                return { ...item };
            }
            const nameAccountData = NameRecordHeader.fromAccountInfo(info);
            const tld = item.mainDomain?.split('.')[1];
            const [tldHouseKey] = findTldHouse(tld);
            const [nameHouseKey] = findNameHouse(tldHouseKey);
            const [nftRecordKey] = findNftRecord(nameAccount, nameHouseKey);
            // check if the main domain owner is the nftrecord onchain
            const isNftRecordOwner =
                nameAccountData.owner?.toString() === nftRecordKey.toString();
            if (isNftRecordOwner) {
                // check if the nft owner is the main domain owner
                const mintOwner = await getMintOwner(connection, nftRecordKey);
                if (mintOwner?.toString() != pubkeys[index]) {
                    return {
                        pubkey: pubkeys[index].toString(),
                        nameAccount,
                        mainDomain: undefined,
                    };
                }
                return { ...item };
            }
            // check if the name record owner is the main domain owner
            if (nameAccountData.owner?.toString() != pubkeys[index]) {
                return {
                    pubkey: pubkeys[index].toString(),
                    nameAccount,
                    mainDomain: undefined,
                };
            }
            // check if the name record expires at is valid
            const expiresAtIsValid = nameAccountData.expiresAt.getTime() != 0;
            if (
                expiresAtIsValid &&
                nameAccountData.expiresAt.getTime() < Date.now()
            ) {
                return {
                    pubkey: pubkeys[index].toString(),
                    nameAccount,
                    mainDomain: undefined,
                };
            }
            return { ...item };
        }),
    );
    return result;
};

export const getMainDomainChecked = async (
    connection: Connection,
    pubkey: string,
): Promise<{
    pubkey: string;
    mainDomain: string | undefined;
    nameAccount: PublicKey | undefined;
}> => {
    const mainDomainKey = findMainDomain(new PublicKey(pubkey))[0];
    const mainDomainAccount = await connection.getAccountInfo(mainDomainKey);

    if (!mainDomainAccount?.data) {
        return { pubkey, nameAccount: undefined, mainDomain: undefined };
    }

    const mainDomainData = MainDomain.fromAccountInfo(mainDomainAccount)[0];
    const nameAccount = mainDomainData.nameAccount;

    const nameAccountInfo = await connection.getAccountInfo(nameAccount);
    if (!nameAccountInfo) {
        return { pubkey, nameAccount, mainDomain: undefined };
    }

    const nameAccountData = NameRecordHeader.fromAccountInfo(nameAccountInfo);
    const tld = mainDomainData.tld;
    const [tldHouseKey] = findTldHouse(tld);
    const [nameHouseKey] = findNameHouse(tldHouseKey);
    const [nftRecordKey] = findNftRecord(nameAccount, nameHouseKey);

    // NFT owner check
    if (nameAccountData.owner?.toString() === nftRecordKey.toString()) {
        const mintOwner = await getMintOwner(connection, nftRecordKey);
        if (mintOwner?.toString() !== pubkey) {
            return { pubkey, nameAccount, mainDomain: undefined };
        }
        return {
            pubkey,
            nameAccount,
            mainDomain: mainDomainData.domain + mainDomainData.tld,
        };
    }

    // Name record owner check
    if (nameAccountData.owner?.toString() !== pubkey) {
        return { pubkey, nameAccount, mainDomain: undefined };
    }

    // Expiry check
    const expiresAtIsValid = nameAccountData.expiresAt.getTime() !== 0;
    if (expiresAtIsValid && nameAccountData.expiresAt.getTime() < Date.now()) {
        return { pubkey, nameAccount, mainDomain: undefined };
    }

    return {
        pubkey,
        nameAccount,
        mainDomain: mainDomainData.domain + mainDomainData.tld,
    };
};
