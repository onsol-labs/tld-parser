import { PublicKey, Connection } from '@solana/web3.js';
import { NameRecordHeader } from './state';
export declare class TldParser {
    private readonly connection;
    constructor(connection: Connection);
    /**
     * retrieves all nameaccounts for any user.
     *
     * @param userAccount user publickey or string
     */
    getAllUserDomains(userAccount: PublicKey | string): Promise<PublicKey[]>;
    /**
     * retrieves all nameaccounts for any user in a particular tld.
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getAllUserDomainsFromTld(userAccount: PublicKey | string, tld: string): Promise<PublicKey[]>;
    /**
     * retrieves owner of a particular Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getOwnerFromDomainTld(domainTld: string): Promise<PublicKey | undefined>;
    /**
     * retrieves domainTld data a domain from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getNameRecordFromDomainTld(domainTld: string): Promise<NameRecordHeader | undefined>;
    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent publickey or string
     */
    getTldFromParentAccount(parentAccount: PublicKey | string): Promise<string>;
    /**
     * retrieves domain from name account via tldParent account.
     *
     * @param nameAccount name publickey or string
     * @param parentAccountOwner parent Owner or string (TldHouse)
     */
    reverseLookupNameAccount(nameAccount: PublicKey | string, parentAccountOwner: PublicKey | string): Promise<string>;
}
//# sourceMappingURL=parsers.d.ts.map