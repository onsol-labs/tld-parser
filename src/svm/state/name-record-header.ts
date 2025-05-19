import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { deserialize, Schema } from 'borsh';
import { ROOT_ANS_PUBLIC_KEY } from '../constants';

/**
 * Holds the data for the {@link NameRecordHeader} Account and provides de/serialization
 * functionality for that data
 */
export class NameRecordHeader {
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
        if (!parentNameRecord) {
            await instance.initializeParentNameRecordHeader(connection);
        } else {
            instance.updateGracePeriod(parentNameRecord);
        }
        return instance;
    }

    async initializeParentNameRecordHeader(
        connection: Connection,
    ): Promise<void> {
        if (this.parentName.toString() === PublicKey.default.toString()) {
            this.isValid = true;
            return;
        }
        const parentNameRecordHeader = await NameRecordHeader.fromAccountAddress(
            connection,
            this.parentName,
        );
        this.updateGracePeriod(parentNameRecordHeader);
    }

    updateGracePeriod(parentNameRecord: NameRecordHeader | undefined): void {
        const currentTime = Date.now();
        const defaultGracePeriod = 50 * 24 * 60 * 60 * 1000;
        const gracePeriod =
            parentNameRecord?.expiresAt.getTime() || defaultGracePeriod;

        this.isValid =
            this.expiresAt.getTime() === 0 ||
            this.expiresAt.getTime() + gracePeriod > currentTime;

        if (!this.isValid) {
            this.owner = undefined;
        }
    }

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

        // Convert expiresAt bytes to number using DataView
        const expiresAtArrayBuffer = new ArrayBuffer(obj.expiresAt.length);
        const expiresAtViewUint8Array = new Uint8Array(expiresAtArrayBuffer);
        expiresAtViewUint8Array.set(obj.expiresAt);
        const expiresAtView = new DataView(expiresAtArrayBuffer);
        const expiresAtTimestamp = Number(expiresAtView.getBigUint64(0, true));
        this.expiresAt = new Date(expiresAtTimestamp * 1000);

        // Convert createdAt bytes to number using DataView
        const createdAtArrayBuffer = new ArrayBuffer(obj.createdAt.length);
        const createdAtViewUint8Array = new Uint8Array(createdAtArrayBuffer);
        createdAtViewUint8Array.set(obj.createdAt);
        const createdAtView = new DataView(createdAtArrayBuffer);
        const createdAtTimestamp = Number(createdAtView.getBigUint64(0, true));
        this.createdAt = new Date(createdAtTimestamp * 1000);

        this.nonTransferable = obj.nonTransferable[0] === 1;

        // grace period = 45 days * 24 hours * 60 minutes * 60 seconds * 1000 millie seconds
        const gracePeriod = 45 * 24 * 60 * 60 * 1000;
        this.isValid =
            expiresAtTimestamp === 0
                ? true
                : this.expiresAt > new Date(Date.now() + gracePeriod);

        this.owner = this.isValid ? new PublicKey(obj.owner) : undefined;
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
    static schema: Schema = {
        struct: {
            discriminator: { array: { type: "u8", len: 8 } },
            parentName: { array: { type: "u8", len: 32 } },
            owner: { array: { type: "u8", len: 32 } },
            nclass: { array: { type: "u8", len: 32 } },
            expiresAt: { array: { type: "u8", len: 8 } },
            createdAt: { array: { type: "u8", len: 8 } },
            nonTransferable: { array: { type: "u8", len: 1 } },
            padding: { array: { type: "u8", len: 79 } },
        },
    };

    /**
     * Returns the minimum size of a {@link Buffer} holding the serialized data of
     * {@link NameRecordHeader}
     */
    static get byteSize() {
        return 8 + 32 + 32 + 32 + 8 + 8 + 1 + 79;
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

        const decodedData = deserialize(
            this.schema,
            Uint8Array.from(nameAccount.data),
        ) as {
            discriminator: number[];
            parentName: Uint8Array;
            owner: Uint8Array;
            nclass: Uint8Array;
            expiresAt: Uint8Array;
            createdAt: Uint8Array;
            nonTransferable: Uint8Array;
        };
        const res = new NameRecordHeader(decodedData);
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
        let nameRecordAccountInfos =
            await connection.getMultipleAccountsInfo(nameAccountKey);

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

        const decodedData = deserialize(
            this.schema,
            Uint8Array.from(nameAccountAccountInfo.data),
        ) as {
            discriminator: number[];
            parentName: Uint8Array;
            owner: Uint8Array;
            nclass: Uint8Array;
            expiresAt: Uint8Array;
            createdAt: Uint8Array;
            nonTransferable: Uint8Array;
        };

        const res = new NameRecordHeader(decodedData);
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
