import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { BinaryReader, deserializeUnchecked, Schema } from 'borsh';
import { ROOT_ANS_PUBLIC_KEY } from '../constants';

/**
 * Holds the data for the {@link NameRecordHeader} Account and provides de/serialization
 * functionality for that data
 */
export class NameRecordHeader {
    constructor(obj: {
        parentName: Uint8Array;
        owner: Uint8Array;
        nclass: Uint8Array;
        expiresAt: Uint8Array;
        createdAt: Uint8Array;
        nonTransferable: Uint8Array;
    }) {
        this.parentName = new PublicKey(obj.parentName);
        this.nclass = new PublicKey(obj.nclass);
        this.expiresAt = new Date(
            new BinaryReader(Buffer.from(obj.expiresAt)).readU64().toNumber() *
                1000,
        );
        this.createdAt = new Date(
            new BinaryReader(Buffer.from(obj.createdAt)).readU64().toNumber() *
                1000,
        );
        this.nonTransferable = obj.nonTransferable[0] !== 0;

        this.isValid = false; // We'll set this later
        this.owner = new PublicKey(obj.owner); // We'll update this later if needed
    }

    parentName: PublicKey;
    owner: PublicKey | undefined;
    nclass: PublicKey;
    expiresAt: Date;
    createdAt: Date;
    nonTransferable: boolean;
    isValid: boolean;
    data: Buffer | undefined;

    static DISCRIMINATOR = [68, 72, 88, 44, 15, 167, 103, 243];
    static HASH_PREFIX = 'ALT Name Service';

    /**
     * NameRecordHeader Schema across all alt name service accounts
     */
    static schema: Schema = new Map([
        [
            NameRecordHeader,
            {
                kind: 'struct',
                fields: [
                    ['discriminator', [8]],
                    ['parentName', [32]],
                    ['owner', [32]],
                    ['nclass', [32]],
                    ['expiresAt', [8]],
                    ['createdAt', [8]],
                    ['nonTransferable', [1]],
                    ['padding', [79]],
                ],
            },
        ],
    ]);

    /**
     * Returns the minimum size of a {@link Buffer} holding the serialized data of
     * {@link NameRecordHeader}
     */
    static get byteSize() {
        return 8 + 32 + 32 + 32 + 8 + 8 + 1 + 79;
    }

    // only for normal domains, tld name record might not be working.
    static async create(
        obj: {
            parentName: Uint8Array;
            owner: Uint8Array;
            nclass: Uint8Array;
            expiresAt: Uint8Array;
            createdAt: Uint8Array;
            nonTransferable: Uint8Array;
        },
        connection: Connection,
        parentNameRecord?: NameRecordHeader,
    ): Promise<NameRecordHeader> {
        const instance = new NameRecordHeader(obj);
        if (!parentNameRecord)
            await instance.initializeParentNameRecordHeader(connection);
        else {
            instance.updateGracePeriod(parentNameRecord);
        }
        return instance;
    }

    updateGracePeriod(parentNameRecord: NameRecordHeader): void {
        const currentTime = Date.now();
        const defaultGracePeriod = 50 * 24 * 60 * 60 * 1000; // 50 days in milliseconds
        const gracePeriod = parentNameRecord.expiresAt.getTime() || defaultGracePeriod;
    
        this.isValid = this.expiresAt.getTime() === 0 || 
                       this.expiresAt.getTime() + gracePeriod > currentTime;
    
        if (!this.isValid) {
            this.owner = undefined;
        }
    }

    async initializeParentNameRecordHeader(
        connection: Connection,
    ): Promise<void> {
        if (this.parentName.toString() === PublicKey.default.toString()) {
            this.isValid = true;
            return;
        }
        const parentNameRecordHeader =
            await NameRecordHeader.fromAccountAddress(
                connection,
                this.parentName,
            );
        this.updateGracePeriod(parentNameRecordHeader);
    }

    /**
     * Retrieves the account info from the provided address and deserializes
     * the {@link NameRecordHeader} from its data.
     */
    public static async fromAccountAddress(
        connection: Connection,
        nameAccountKey: PublicKey,
    ): Promise<NameRecordHeader | undefined> {
        const nameAccount = await connection.getAccountInfo(
            nameAccountKey,
            'confirmed',
        );
        if (!nameAccount) {
            return undefined;
        }

        const res: NameRecordHeader = deserializeUnchecked(
            this.schema,
            NameRecordHeader,
            nameAccount.data,
        );

        res.data = nameAccount.data?.subarray(this.byteSize);
        if (res.parentName.toString() !== ROOT_ANS_PUBLIC_KEY.toString()) {
            await res.initializeParentNameRecordHeader(connection);
        } else {
            res.isValid = true;
        }            

        return res;
    }

    /**
     * Retrieves the account infos from the multiple name accounts
     * the {@link NameRecordHeader} from its data.
     */
    public static async fromMultipileAccountAddresses(
        connection: Connection,
        nameAccountKey: PublicKey[],
    ): Promise<NameRecordHeader[] | []> {
        let nameRecordAccountInfos = await connection.getMultipleAccountsInfo(
            nameAccountKey,
        );

        let nameRecords: NameRecordHeader[] = [];

        nameRecordAccountInfos.forEach(value => {
            if (!value) {
                nameRecords.push(undefined);
                return;
            }
            let nameRecordData = this.fromAccountInfo(value);
            if (!nameRecordData) {
                nameRecords.push(undefined);
                return;
            }
            nameRecords.push(nameRecordData);
        });

        return nameRecords;
    }

    /**
     * Retrieves the account info from the provided data and deserializes
     * the {@link NameRecordHeader} from its data.
     */
    public static fromAccountInfo(
        nameAccountAccountInfo: AccountInfo<Buffer>,
    ): NameRecordHeader {
        const res: NameRecordHeader = deserializeUnchecked(
            this.schema,
            NameRecordHeader,
            nameAccountAccountInfo.data,
        );
        res.data = nameAccountAccountInfo.data?.subarray(this.byteSize);
        return res;
    }

    /**
     * Returns a readable version of {@link NameRecordHeader} properties
     * and can be used to convert to JSON and/or logging
     */
    pretty() {
        const indexOf0 = this.data.indexOf(0x00);
        return {
            parentName: this.parentName.toBase58(),
            owner: this.owner?.toBase58(),
            nclass: this.nclass.toBase58(),
            expiresAt: this.expiresAt,
            createdAt: this.createdAt,
            nonTransferable: this.nonTransferable,
            isValid: this.isValid,
            data: this.isValid
                ? this.data.subarray(0, indexOf0).toString()
                : undefined,
        };
    }
}
