/// <reference types="node" />
import { Connection, PublicKey } from '@solana/web3.js';
/**
 * retrieves raw name account
 *
 * @param hashedName hashed name of the name account
 * @param nameClass defaults to pubkey::default()
 * @param parentName defaults to pubkey::default()
 */
export declare function getNameAccountKeyWithBump(hashedName: Buffer, nameClass?: PublicKey, parentName?: PublicKey): Promise<[PublicKey, number]>;
/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
export declare function getNameOwner(connection: Connection, nameAccountKey: PublicKey): Promise<PublicKey | undefined>;
/**
 * computes hashed name
 *
 * @param name any string or domain name.
 */
export declare function getHashedName(name: string): Buffer;
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
