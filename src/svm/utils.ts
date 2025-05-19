
import { Address, EncodedAccount, fetchEncodedAccount, fetchEncodedAccounts, GetAccountInfoApi, GetMultipleAccountsApi, GetProgramAccountsApi, GetTokenAccountsByOwnerApi, GetTokenLargestAccountsApi, MaybeEncodedAccount, Rpc } from '@solana/kit';
import {
    ANS_PROGRAM_ID,
    HASH_PREFIX,
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
import { Tag } from './types';
import { address, getAddressCodec, getProgramDerivedAddress } from "@solana/addresses";
import {
    getBase58Codec,
    getBase64Codec,
    getUtf8Codec,
} from "@solana/codecs-strings";
import { decodeNameRecordHeader, fetchMaybeNameRecordHeader, fetchNameRecordHeader, getNameRecordHeaderSize } from './state/name-record-header';
import { fetchMaybeNftRecord } from './state/nft-record';
import { decodeMint, decodeToken, getTokenCodec, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { dataSlice } from 'ethers';
import { decodeMainDomain } from './state/main-domain';

export const addressCodec = getAddressCodec();

export const base58Codec = getBase58Codec();

export const base64Codec = getBase64Codec();

export const utf8Codec = getUtf8Codec();

export const tokenCodec = getTokenCodec();
export type ProgramAccountsLoaderValue = ReturnType<GetProgramAccountsApi['getProgramAccounts']>;


/**
 * retrieves raw name account
 *
 * @param hashedName hashed name of the name account
 * @param nameClass defaults to pubkey::default()
 * @param parentName defaults to pubkey::default()
 */
export async function getNameAccountKeyWithBump(
    hashedName: Uint8Array,
    nameClass?: Address,
    parentName?: Address,
): Promise<[Address, number]> {
    const seeds = [
        hashedName,
        nameClass ? addressCodec.encode(nameClass) : new Uint8Array(32),
        parentName ? addressCodec.encode(parentName) : new Uint8Array(32),
    ];

    const [address, bump] = await getProgramDerivedAddress({
        programAddress: ANS_PROGRAM_ID,
        seeds,
    });

    return [address, bump];
}

/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
export async function getNameOwner(
    rpc: Rpc<GetAccountInfoApi & GetTokenLargestAccountsApi>,
    nameAccountKey: Address,
    tldHouse?: Address,
): Promise<Address | undefined> {
    const nameAccount = await fetchMaybeNameRecordHeader(
        rpc, nameAccountKey
    )
    if (!nameAccount.exists) return undefined;
    const owner = nameAccount.data.owner;
    if (!nameAccount.data.isValid) return undefined;
    if (!tldHouse) return owner;
    const [nameHouse] = await findNameHouse(tldHouse);
    const [nftRecord] = await findNftRecord(nameAccountKey, nameHouse);
    if (owner !== nftRecord) return owner;
    return await getMintOwner(rpc, nftRecord);
}

/**
 * computes hashed name
 *
 * @param name any string or domain name.
 */
export async function getHashedName(name: string): Promise<Buffer> {
    // const input = NameRecordHeader.HASH_PREFIX + name;
    // const str = sha256(Buffer.from(input, 'utf8')).slice(2);
    // return Buffer.from(str, 'hex');
    const data = utf8Codec.encode(HASH_PREFIX + name);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Buffer.from(hashBuffer);
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
): Promise<Address> {
    const hashed_name = await getHashedName(originTld);
    const [nameAccountKey] = await getNameAccountKeyWithBump(
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
    rpc: Rpc<GetProgramAccountsApi>,
    userAccount: Address,
    parentAccount: Address | undefined,
): Promise<ProgramAccountsLoaderValue> {
    const filters: any = [
        {
            memcmp: {
                offset: 40,
                bytes: userAccount,
                encoding: 'base58',
            },
        },
    ];

    if (parentAccount) {
        filters.push({
            memcmp: {
                offset: 8,
                bytes: parentAccount,
                encoding: 'base58',
            },
        });
    }

    const accounts = await rpc.getProgramAccounts(ANS_PROGRAM_ID, {
        encoding: 'base64',
        filters: filters,
        dataSlice: { offset: 0, length: 200 },
    }).send();

    return accounts
        .map((account: any) => {
            return {
                ...account,
                account: {
                    ...account.account,
                    data: base64Codec.encode(account.account.data[0]),
                },
            };
        });;
}

export function findMainDomain(user: Address) {
    return getProgramDerivedAddress({
        programAddress: TLD_HOUSE_PROGRAM_ID,
        seeds: [
            utf8Codec.encode(MAIN_DOMAIN_PREFIX),
            addressCodec.encode(user),
        ],
    });
}

/**
 * finds list of all tld house accounts live.
 *
 * @param connection sol connection
 */
export async function getAllTld(rpc: Rpc<GetProgramAccountsApi>): Promise<
    Array<{
        tld: String;
        parentAccount: Address;
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

    const accounts = await rpc.getProgramAccounts(TLD_HOUSE_PROGRAM_ID, {
        filters: filters,
        encoding: 'base64',
    }).send();

    const tldsAndParentAccounts: {
        tld: String;
        parentAccount: Address;
    }[] = [];

    accounts.map((account: any) => {
        const parentAccount = getParentAccountFromTldHouseAccountInfo(account);
        const tld = getTldFromTldHouseAccountInfo(account);
        tldsAndParentAccounts.push({ tld, parentAccount });
    });
    return tldsAndParentAccounts;
}
export function getTldFromTldHouseAccountInfo(
    tldHouseData: ProgramAccountsLoaderValue[number],
) {
    const tldStart = 8 + 32 + 32 + 32;
    const data = base64Codec.encode(tldHouseData.account.data[0]);
    const tldBuffer = data.slice(tldStart);
    const view = new DataView(tldBuffer.buffer);
    const nameLength = view.getUint32(0, true);

    return utf8Codec
        .decode(tldBuffer.subarray(4, 4 + nameLength))
        .replace(/^\0/, "\0");
}

export function getParentAccountFromTldHouseAccountInfo(
    tldHouseData: ProgramAccountsLoaderValue[number],
) {
    const parentAccountStart = 8 + 32 + 32;
    const data = base64Codec.encode(tldHouseData.account.data[0]);
    const parentAccountBuffer = data.slice(parentAccountStart, parentAccountStart + 32);

    return addressCodec.decode(parentAccountBuffer);
}

/**
 * finds list of all domains in parent account from tld.
 *
 * @param connection sol connection
 * @param parentAccount nameAccount's parentName
 */
export async function findAllDomainsForTld(
    rpc: Rpc<GetProgramAccountsApi>,
    parentAccount: Address,
): Promise<Address[]> {
    const filters: any = [
        {
            memcmp: {
                offset: 8n,
                bytes: parentAccount,
                encoding: 'base58',
            },
        },
    ];

    const accounts = await rpc.getProgramAccounts(ANS_PROGRAM_ID, {
        filters: filters,
        dataSlice: { offset: 40, length: 40 },
    }).send();
    return accounts.map((a: any) => a.pubkey);
}

export async function getMintOwner(
    rpc: Rpc<GetAccountInfoApi & GetTokenLargestAccountsApi>,
    nftRecord: Address,
) {
    try {
        const nftRecordData = await fetchMaybeNftRecord(rpc, nftRecord);
        if (!nftRecordData.exists) return;
        if (nftRecordData.data.tag !== Tag.ActiveRecord) return;

        const largestAccounts = await rpc.getTokenLargestAccounts(nftRecordData.data.nftMintAccount).send();

        if (largestAccounts.value.length === 0) {
            return null;
        }

        const largestAccountInfo = await fetchEncodedAccount(
            rpc,
            largestAccounts.value[0].address
        );

        if (!largestAccountInfo.exists) {
            return null;
        }

        const decoded = tokenCodec.decode(largestAccountInfo.data);
        if (decoded.amount.toString() === "1") {
            return decoded.owner;
        }

        return null;
    } catch {
        return undefined;
    }
}

// Returns PDA and bump for the NFT record
export async function findNftRecord(
    nameAccount: Address,
    nameHouseAccount: Address,
): Promise<readonly [Address, number]> {
    return await getProgramDerivedAddress({
        programAddress: NAME_HOUSE_PROGRAM_ID,
        seeds: [
            utf8Codec.encode(NFT_RECORD_PREFIX),
            addressCodec.encode(nameHouseAccount),
            addressCodec.encode(nameAccount),
        ],
    });
}

// Returns PDA and bump for the TLD house
export async function findTldHouse(tldString: string): Promise<readonly [Address, number]> {
    tldString = tldString.toLowerCase();
    return await getProgramDerivedAddress({
        programAddress: TLD_HOUSE_PROGRAM_ID,
        seeds: [
            utf8Codec.encode(TLD_HOUSE_PREFIX),
            utf8Codec.encode(tldString),
        ],
    });
}

// Returns PDA and bump for the Name House
export async function findNameHouse(tldHouse: Address): Promise<readonly [Address, number]> {
    return await getProgramDerivedAddress({
        programAddress: NAME_HOUSE_PROGRAM_ID,
        seeds: [
            utf8Codec.encode(NAME_HOUSE_PREFIX),
            addressCodec.encode(tldHouse),
        ],
    });
}

// Returns PDA for the metadata account
export async function findMetadataAddress(mint: Address): Promise<Address> {
    const [address] = await getProgramDerivedAddress({
        programAddress: TOKEN_METADATA_PROGRAM_ID,
        seeds: [
            utf8Codec.encode('metadata'),
            addressCodec.encode(TOKEN_METADATA_PROGRAM_ID),
            addressCodec.encode(mint),
        ],
    });
    return address;
}

export async function performReverseLookupBatched(
    rpc: Rpc<GetMultipleAccountsApi>,
    nameAccounts: Address[],
    tldHouse: Address,
): Promise<(string | undefined)[]> {
    const promises = nameAccounts.map(async nameAccount => {
        const reverseLookupHashedName = await getHashedName(
            nameAccount,
        );
        const [reverseLookUpAccount] = await getNameAccountKeyWithBump(
            reverseLookupHashedName,
            tldHouse,
            undefined,
        );
        return reverseLookUpAccount;
    });
    const reverseLookUpAccounts: Address[] = await Promise.all(promises);
    const reverseLookupAccountInfos = await fetchEncodedAccounts(
        rpc,
        reverseLookUpAccounts,
    );
    const reverseLookupAccountsDecoded = reverseLookupAccountInfos.map((accountInfo) => decodeNameRecordHeader(accountInfo))

    return reverseLookupAccountsDecoded.map(reverseLookupAccountInfo => {
        if (!reverseLookupAccountInfo.exists) return;
        const domain = reverseLookupAccountInfo.data.data?.subarray(
            getNameRecordHeaderSize(),
            Number(reverseLookupAccountInfo?.space),
        )
            .toString();
        return domain;
    });
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export const getOwnerNfts = async (
    owner: Address,
    rpc: Rpc<GetTokenAccountsByOwnerApi & GetMultipleAccountsApi>,
) => {

    const { value: splAccounts } = await rpc.getTokenAccountsByOwner(owner, { programId: SPL_TOKEN_PROGRAM_ID }, { encoding: 'jsonParsed' }).send();
    // console.log(results)
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
};

export const getParsedAllDomainsNftAccountsByOwner = async (
    owner: Address,
    rpc: Rpc<GetTokenAccountsByOwnerApi & GetMultipleAccountsApi>,
    expectedCreator: Address,
) => {
    const nftAccounts = await getOwnerNfts(owner, rpc);
    const ownerDomains = await getOwnedDomainsFromNfts(
        nftAccounts,
        rpc,
        expectedCreator,
    );

    return ownerDomains;
};

export const getOwnedDomainsFromNfts = async (
    nftAddresses: string[],
    rpc: Rpc<GetMultipleAccountsApi>,
    expectedCreator: Address,
) => {
    const ownedDomains: string[] = [];
    const verifiedCreatorByteOffset = 326;
    const verifiedCreatorVerfiiedByteOffset = 326;
    const BATCH_SIZE = 100;

    const processBatch = async (batch: string[]) => {
        const nftMetadataKeys = await Promise.all(
            batch.map((mint) => findMetadataAddress(mint as Address))
        );
        const nftsMetadata = await fetchEncodedAccounts(rpc, nftMetadataKeys);
        for (const nftMetadata of nftsMetadata) {
            if (nftMetadata.exists) {
                const verifiedCreatorAddress = addressCodec.decode(
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
                    verifiedCreatorAddress === expectedCreator
                ) {
                    const domainName = utf8Codec
                        .decode(nftMetadata.data
                            .subarray(66, 101))
                        .replace(/\u0000/g, '');
                    ownedDomains.push(domainName);
                }
            }
        }
    };

    for (let i = 0; i < nftAddresses.length; i += BATCH_SIZE) {
        const batch = nftAddresses.slice(i, i + BATCH_SIZE);
        await processBatch(batch);
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

// Returns PDA and bump for the Mint address
export async function findMintAddress(
    nameAccount: Address,
    nameHouseAccount: Address,
): Promise<readonly [Address, number]> {
    return await getProgramDerivedAddress({
        programAddress: NAME_HOUSE_PROGRAM_ID,
        seeds: [
            Buffer.from(NAME_HOUSE_PREFIX),
            addressCodec.encode(nameHouseAccount),
            addressCodec.encode(nameAccount),
        ],
    });
}

// Returns PDA and bump for the Renewable Mint address
export async function findRenewableMintAddress(
    nameAccount: Address,
    nameHouseAccount: Address,
    expiresAtBuffer: Buffer,
): Promise<readonly [Address, number]> {
    return await getProgramDerivedAddress({
        programAddress: NAME_HOUSE_PROGRAM_ID,
        seeds: [
            Buffer.from(NAME_HOUSE_PREFIX),
            addressCodec.encode(nameHouseAccount),
            addressCodec.encode(nameAccount),
            expiresAtBuffer,
        ],
    });
}


/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
export async function getDomainMintAccountKey(
    rpc: Rpc<GetAccountInfoApi>,
    nameAccountKey: Address,
    tldHouse: Address,
): Promise<Address | undefined> {
    const nameAccount = await fetchMaybeNameRecordHeader(
        rpc,
        nameAccountKey,
    );
    if (!nameAccount.exists) return;
    const expiryDate = nameAccount.data.expiresAt;
    const secondSinceEpoch = new Date(0);
    let mintAccount: Address | undefined;
    const [nameHouse] = await findNameHouse(tldHouse);
    if (expiryDate === secondSinceEpoch) {
        [mintAccount] = await findMintAddress(nameAccountKey, nameHouse);
    } else {
        [mintAccount] = await findRenewableMintAddress(
            nameAccountKey,
            nameHouse,
            dateToU64Buffer(expiryDate),
        );
    }
    return mintAccount;
}

export async function getMintAccountFromDomainTld(
    rpc: Rpc<GetAccountInfoApi>,
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
    return await getDomainMintAccountKey(
        rpc,
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
    rpc: Rpc<GetAccountInfoApi & GetTokenLargestAccountsApi & GetMultipleAccountsApi>,
    pubkeys: string[],
  ): Promise<
    {
      pubkey: string;
      mainDomain: string | undefined;
      nameAccount: Address | undefined;
    }[]
  > => {
    const mainDomainKeys = await Promise.all(pubkeys.map(
      async (pubkey) => await findMainDomain(pubkey as Address)
    ));

  
    // fetch main domain accounts
    const mainDomainAccounts = await fetchEncodedAccounts(rpc, mainDomainKeys.map((key) => key[0]));
  
    const mainDomainWithNameAccounts = pubkeys.map((pubkey, index) => {
      const mainDomainAccount = mainDomainAccounts[index];
      if (mainDomainAccount.exists) {
        const mainDomainData = decodeMainDomain(mainDomainAccount);
        const nameAccount = mainDomainData.data.nameAccount;
        return {
          pubkey: pubkey.toString(),
          nameAccount,
          mainDomain: mainDomainData.data.domain + mainDomainData.data.tld,
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
      (item) => item.nameAccount,
    );
    const filteredNameAccountsWithIndex = nameAccounts
      .map((pk, idx) => (pk ? { pk, idx } : undefined))
      .filter((x): x is { pk: Address; idx: number } => !!x);
    const filteredNameAccounts = filteredNameAccountsWithIndex.map((x) => x.pk);
    const nameAccountsInfo = await fetchEncodedAccounts(rpc, filteredNameAccounts);
  
    // map infoByOriginalIdx
    const infoByOriginalIdx = new Array<MaybeEncodedAccount<string> | null>(
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
          return { 
            pubkey: item.pubkey,
            nameAccount: undefined,
            mainDomain: undefined, 
        };
        }
        const nameAccountData = decodeNameRecordHeader(info);
        if (!nameAccountData.exists) {
            return { 
              pubkey: item.pubkey,
              nameAccount: undefined,
              mainDomain: undefined, 
          };
        }
        const tld = item.mainDomain?.split(".")[1];
        const [tldHouseKey] =await findTldHouse(tld);
        const [nameHouseKey] = await findNameHouse(tldHouseKey);
        const [nftRecordKey] = await findNftRecord(nameAccount, nameHouseKey);
        // check if the main domain owner is the nftrecord onchain
        const isNftRecordOwner =
          nameAccountData.data.owner === nftRecordKey;
        if (isNftRecordOwner) {
          // check if the nft owner is the main domain owner
          const mintOwner = await getMintOwner(rpc, nftRecordKey);
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
        if (nameAccountData.data.owner != pubkeys[index]) {
          return {
            pubkey: pubkeys[index].toString(),
            nameAccount,
            mainDomain: undefined,
          };
        }
        // check if the name record expires at is valid
        const expiresAtIsValid = nameAccountData.data.expiresAt.getTime() != 0;
        if (
          expiresAtIsValid &&
          nameAccountData.data.expiresAt.getTime() < Date.now()
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
    rpc: Rpc<GetAccountInfoApi & GetTokenLargestAccountsApi & GetMultipleAccountsApi>,
    pubkey: string,
  ): Promise<{
    pubkey: string;
    mainDomain: string | undefined;
    nameAccount: Address | undefined;
  }> => {
    const [mainDomainKey] = await findMainDomain(pubkey as Address);
    const mainDomainAccount = await fetchEncodedAccount(rpc, mainDomainKey);
  
    if (!mainDomainAccount.exists) {
      return { pubkey, nameAccount: undefined, mainDomain: undefined };
    }
  
    const mainDomainData = decodeMainDomain(mainDomainAccount);
    const nameAccount = mainDomainData.data.nameAccount;
  
    const nameAccountInfo = await fetchEncodedAccount(rpc, nameAccount);
    if (!nameAccountInfo.exists) {
      return { pubkey, nameAccount, mainDomain: undefined };
    }
  
    const nameAccountData = decodeNameRecordHeader(nameAccountInfo);
    const tld = mainDomainData.data.tld;
    const [tldHouseKey] = await findTldHouse(tld);
    const [nameHouseKey] = await findNameHouse(tldHouseKey);
    const [nftRecordKey] = await findNftRecord(nameAccount, nameHouseKey);
  
    // NFT owner check
    if (nameAccountData.data.owner === nftRecordKey) {
      const mintOwner = await getMintOwner(rpc, nftRecordKey);
      if (mintOwner !== pubkey) {
        return { pubkey, nameAccount, mainDomain: undefined };
      }
      return {
        pubkey,
        nameAccount,
        mainDomain: mainDomainData.data.domain + mainDomainData.data.tld,
      };
    }
  
    // Name record owner check
    if (nameAccountData.data.owner !== pubkey) {
      return { pubkey, nameAccount, mainDomain: undefined };
    }
  
    // Expiry check
    const expiresAtIsValid = nameAccountData.data.expiresAt.getTime() !== 0;
    if (expiresAtIsValid && nameAccountData.data.expiresAt.getTime() < Date.now()) {
      return { pubkey, nameAccount, mainDomain: undefined };
    }
  
    return {
      pubkey,
      nameAccount,
      mainDomain: mainDomainData.data.domain + mainDomainData.data.tld,
    };
  };
  