/// <reference types="node" />
import * as web3 from '@solana/web3.js';
import * as beetSolana from '@metaplex-foundation/beet-solana';
import * as beet from '@metaplex-foundation/beet';
/**
 * Arguments used to create {@link MainDomain}
 * @category Accounts
 * @category generated
 */
export type MainDomainArgs = {
    nameAccount: web3.PublicKey;
    tld: string;
    domain: string;
};
export declare const mainDomainDiscriminator: number[];
/**
 * Holds the data for the {@link MainDomain} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export declare class MainDomain implements MainDomainArgs {
    readonly nameAccount: web3.PublicKey;
    readonly tld: string;
    readonly domain: string;
    private constructor();
    /**
     * Creates a {@link MainDomain} instance from the provided args.
     */
    static fromArgs(args: MainDomainArgs): MainDomain;
    /**
     * Deserializes the {@link MainDomain} from the data of the provided {@link web3.AccountInfo}.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    static fromAccountInfo(accountInfo: web3.AccountInfo<Buffer>, offset?: number): [MainDomain, number];
    /**
     * Retrieves the account info from the provided address and deserializes
     * the {@link MainDomain} from its data.
     *
     * @throws Error if no account info is found at the address or if deserialization fails
     */
    static fromAccountAddress(connection: web3.Connection, address: web3.PublicKey, commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig): Promise<MainDomain>;
    /**
     * Provides a {@link web3.Connection.getProgramAccounts} config builder,
     * to fetch accounts matching filters that can be specified via that builder.
     *
     * @param programId - the program that owns the accounts we are filtering
     */
    static gpaBuilder(programId?: web3.PublicKey): beetSolana.GpaBuilder<MainDomainArgs & {
        accountDiscriminator: number[];
    }>;
    /**
     * Deserializes the {@link MainDomain} from the provided data Buffer.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    static deserialize(buf: Buffer, offset?: number): [MainDomain, number];
    /**
     * Serializes the {@link MainDomain} into a Buffer.
     * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
     */
    serialize(): [Buffer, number];
    /**
     * Returns the byteSize of a {@link Buffer} holding the serialized data of
     * {@link MainDomain} for the provided args.
     *
     * @param args need to be provided since the byte size for this account
     * depends on them
     */
    static byteSize(args: MainDomainArgs): number;
    /**
     * Fetches the minimum balance needed to exempt an account holding
     * {@link MainDomain} data from rent
     *
     * @param args need to be provided since the byte size for this account
     * depends on them
     * @param connection used to retrieve the rent exemption information
     */
    static getMinimumBalanceForRentExemption(args: MainDomainArgs, connection: web3.Connection, commitment?: web3.Commitment): Promise<number>;
    /**
     * Returns a readable version of {@link MainDomain} properties
     * and can be used to convert to JSON and/or logging
     */
    pretty(): {
        nameAccount: string;
        tld: string;
        domain: string;
    };
}
/**
 * @category Accounts
 * @category generated
 */
export declare const mainDomainBeet: beet.FixableBeetStruct<MainDomain, MainDomainArgs & {
    accountDiscriminator: number[];
}>;
//# sourceMappingURL=main-domain.d.ts.map