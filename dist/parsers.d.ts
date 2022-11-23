import { PublicKey, Connection } from '@solana/web3.js';

import { NameRecordHeader } from './state';
/**
 * retrieves all nameaccounts for any user in a particular tld.
 *
 * @param connection sol connection
 * @param userAccount user publickey or string
 * @param tld tld to be retrieved from
 */
export declare function getAllUserDomainsFromTld(connection: Connection, userAccount: PublicKey | string, tld: string): Promise<PublicKey[]>;
/**
 * retrieves owner of a particular Name Account from domain.tld.
 *
 * @param connection sol connection
 * @param domainTld full string of domain and tld e.g. "miester.poor"
 */
export declare function getOwnerFromDomainTld(connection: Connection, domainTld: string): Promise<PublicKey | undefined>;
/**
 * retrieves domainTld data a domain from domain.tld.
 *
 * @param connection sol connection
 * @param domainTld full string of domain and tld e.g. "miester.poor"
 */
export declare function getNameRecordFromDomainTld(connection: Connection, domainTld: string): Promise<NameRecordHeader | undefined>;
