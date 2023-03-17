/// <reference types="node" />
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { NameRecordHeader } from './state/name-record-header';
/**
 * retrieves raw name account
 *
 * @param hashedName hashed name of the name account
 * @param nameClass defaults to pubkey::default()
 * @param parentName defaults to pubkey::default()
 */
export declare function getNameAccountKeyWithBump(hashedName: Buffer, nameClass?: PublicKey, parentName?: PublicKey): [PublicKey, number];
/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
export declare function getNameOwner(connection: Connection, nameAccountKey: PublicKey, tldHouse?: PublicKey): Promise<PublicKey | undefined>;
/**
 * computes hashed name
 *
 * @param name any string or domain name.
 */
export declare function getHashedName(name: string): Promise<Buffer>;
/**
 * A constant in tld house.
 *
 * get origin name account should always equal to 3mX9b4AZaQehNoQGfckVcmgmA6bkBoFcbLj9RMmMyNcU
 *
 * @param originTld
 */
export declare function getOriginNameAccountKey(originTld?: string): Promise<PublicKey>;
/**
 * finds list of all name accounts for a particular user.
 *
 * @param connection sol connection
 * @param userAccount user's public key
 * @param parentAccount nameAccount's parentName
 */
export declare function findOwnedNameAccountsForUser(connection: Connection, userAccount: PublicKey, parentAccount: PublicKey | undefined): Promise<PublicKey[]>;
export declare function findMainDomain(user: PublicKey): [PublicKey, number];
/**
 * finds list of all tld house accounts live.
 *
 * @param connection sol connection
 */
export declare function getAllTld(connection: Connection): Promise<Array<{
    tld: String;
    parentAccount: PublicKey;
}>>;
export declare function getTldFromTldHouseAccountInfo(tldHouseData: AccountInfo<Buffer>): string;
export declare function getParentAccountFromTldHouseAccountInfo(tldHouseData: AccountInfo<Buffer>): PublicKey;
/**
 * finds list of all domains in parent account from tld.
 *
 * @param connection sol connection
 * @param parentAccount nameAccount's parentName
 */
export declare function findAllDomainsForTld(connection: Connection, parentAccount: PublicKey): Promise<NameRecordHeader[]>;
export declare function getMintOwner(connection: Connection, nftRecord: PublicKey): Promise<PublicKey>;
export declare function findNftRecord(nameAccount: PublicKey, nameHouseAccount: PublicKey): [PublicKey, number];
export declare function findTldHouse(tldString: string): [PublicKey, number];
export declare function findNameHouse(tldHouse: PublicKey): [PublicKey, number];
//# sourceMappingURL=utils.d.ts.map