/// <reference types="node" />
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { Schema } from 'borsh';
/**
 * Holds the data for the {@link NameRecordHeader} Account and provides de/serialization
 * functionality for that data
 */
export declare class NameRecordHeader {
    constructor(obj: {
        parentName: Uint8Array;
        owner: Uint8Array;
        nclass: Uint8Array;
        expiresAt: Uint8Array;
    });
    parentName: PublicKey;
    owner: PublicKey | undefined;
    nclass: PublicKey;
    expiresAt: Date;
    isValid: boolean;
    data: Buffer | undefined;
    static DISCRIMINATOR: number[];
    static HASH_PREFIX: string;
    /**
     * NameRecordHeader Schema across all alt name service accounts
     */
    static schema: Schema;
    /**
     * Returns the minimum size of a {@link Buffer} holding the serialized data of
     * {@link NameRecordHeader}
     */
    static get byteSize(): number;
    /**
     * Retrieves the account info from the provided address and deserializes
     * the {@link NameRecordHeader} from its data.
     */
    static fromAccountAddress(connection: Connection, nameAccountKey: PublicKey): Promise<NameRecordHeader | undefined>;
    /**
     * Retrieves the account infos from the multiple name accounts
     * the {@link NameRecordHeader} from its data.
     */
    static fromMultipileAccountAddresses(connection: Connection, nameAccountKey: PublicKey[]): Promise<NameRecordHeader[] | []>;
    /**
     * Retrieves the account info from the provided data and deserializes
     * the {@link NameRecordHeader} from its data.
     */
    static fromAccountInfo(nameAccountAccountInfo: AccountInfo<Buffer>): NameRecordHeader;
    /**
     * Returns a readable version of {@link NameRecordHeader} properties
     * and can be used to convert to JSON and/or logging
     */
    pretty(): {
        parentName: string;
        owner: string;
        nclass: string;
        expiresAt: Date;
        isValid: boolean;
        data: string;
    };
}
//# sourceMappingURL=state.d.ts.map