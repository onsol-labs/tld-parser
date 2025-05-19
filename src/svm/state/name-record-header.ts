import {
    assertAccountExists,
    assertAccountsExist,
    decodeAccount,
    fetchEncodedAccount,
    fetchEncodedAccounts,
    fixDecoderSize,
    fixEncoderSize,
    getAddressDecoder,
    getAddressEncoder,
    getBooleanDecoder,
    getBooleanEncoder,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
    getU64Decoder,
    getU64Encoder,
    transformEncoder,
    transformDecoder,
    type Account,
    type Address,
    type Decoder,
    type EncodedAccount,
    type Encoder,
    type FetchAccountConfig,
    type FetchAccountsConfig,
    type MaybeAccount,
    type MaybeEncodedAccount,
    type ReadonlyUint8Array,
  } from '@solana/kit';
import { Buffer } from 'buffer';

  
  export const NAME_RECORD_HEADER_DISCRIMINATOR = new Uint8Array([
    68, 72, 88, 44, 15, 167, 103, 243,
  ]);
  
  export function getNameRecordHeaderDiscriminatorBytes() {
    return fixEncoderSize(getBytesEncoder(), 8).encode(
      NAME_RECORD_HEADER_DISCRIMINATOR
    );
  }
  
  export type NameRecordHeader = {
    discriminator: ReadonlyUint8Array;
    parentName: Address;
    /**
     * The owner of the record. If the record is invalid, this will be undefined.
     */
    owner: Address | undefined;
    nclass: Address;
    /**
     * Expiry date of the record.
     */
    expiresAt: Date;
    /**
     * Creation date of the record.
     */
    createdAt: Date;
    nonTransferable: boolean;
    /**
     * Whether the record is valid (not expired or otherwise invalidated).
     * This is a runtime-only property and is not serialized on-chain.
     */
    isValid?: boolean;
    /**
     * Optional data buffer associated with the record.
     * This is a runtime-only property and is not serialized on-chain.
     */
    data?: Buffer;
  };

  
  export type NameRecordHeaderArgs = {
    parentName: Address;
    owner: Address;
    nclass: Address;
    expiresAt: number | bigint | Date;
    createdAt: number | bigint | Date;
    nonTransferable: boolean;
    data?: Buffer;
    isValid?: boolean;
  };
  
  export type NameRecordHeaderRawArgs = {
    parentName: Address;
    owner: Address;
    nclass: Address;
    expiresAt: number | bigint;
    createdAt: number | bigint;
    nonTransferable: boolean;
  };
  
  export function getNameRecordHeaderEncoder(): Encoder<NameRecordHeaderRawArgs> {
    return transformEncoder(
      getStructEncoder([
        ['discriminator', fixEncoderSize(getBytesEncoder(), 8)],
        ['parentName', getAddressEncoder()],
        ['owner', getAddressEncoder()],
        ['nclass', getAddressEncoder()],
        ['expiresAt', getU64Encoder()],
        ['createdAt', getU64Encoder()],
        ['nonTransferable', getBooleanEncoder()],
      ]),
      (value) => ({ ...value, discriminator: NAME_RECORD_HEADER_DISCRIMINATOR })
    );
  }
  
  export function getNameRecordHeaderDecoder(): Decoder<NameRecordHeader> {
  // Grace period = 45 days * 24 hours * 60 minutes * 60 seconds * 1000 ms
  const GRACE_PERIOD_MS = 45 * 24 * 60 * 60 * 1000;
  return transformDecoder(
    getStructDecoder([
      ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
      ['parentName', getAddressDecoder()],
      ['owner', getAddressDecoder()],
      ['nclass', getAddressDecoder()],
      ['expiresAt', getU64Decoder()],
      ['createdAt', getU64Decoder()],
      ['nonTransferable', getBooleanDecoder()],
    ]),
    (decoded, bytes, offset) => {
      // Compute isValid like the old logic
      const expiresAtMs = decoded.expiresAt === 0n ? 0 : Number(decoded.expiresAt) * 1000;
      const nowMs = Date.now();
      const isValid = decoded.expiresAt === 0n
        ? true
        : expiresAtMs + GRACE_PERIOD_MS > nowMs;
      const expiresAt = new Date(expiresAtMs);
      const createdAtMs = decoded.createdAt === 0n ? 0 : Number(decoded.createdAt) * 1000;
      const createdAt = new Date(createdAtMs);
      // If there are trailing bytes, treat them as the data buffer
      const data = (bytes.length > offset) ? Buffer.from(bytes.slice(offset)) : undefined;
      const owner = isValid ? decoded.owner : undefined;
      return {
        ...decoded,
        expiresAt,
        createdAt,
        isValid,
        data,
        owner,
      };
    }
  );
}


// cannot be combined since data has to be manipulated.
//   export function getNameRecordHeaderCodec(): Codec<
//     NameRecordHeaderRawArgs,
//     NameRecordHeader
//   > {
//     return combineCodec(
//       getNameRecordHeaderEncoder(),
//       getNameRecordHeaderDecoder()
//     );
//   }
  
  export function decodeNameRecordHeader<TAddress extends string = string>(
    encodedAccount: EncodedAccount<TAddress>
  ): Account<NameRecordHeader, TAddress>;
  export function decodeNameRecordHeader<TAddress extends string = string>(
    encodedAccount: MaybeEncodedAccount<TAddress>
  ): MaybeAccount<NameRecordHeader, TAddress>;
  export function decodeNameRecordHeader<TAddress extends string = string>(
    encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
  ):
    | Account<NameRecordHeader, TAddress>
    | MaybeAccount<NameRecordHeader, TAddress> {
    return decodeAccount(
      encodedAccount as MaybeEncodedAccount<TAddress>,
      getNameRecordHeaderDecoder()
    );
  }
  
  export async function fetchNameRecordHeader<TAddress extends string = string>(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    address: Address<TAddress>,
    config?: FetchAccountConfig
  ): Promise<Account<NameRecordHeader, TAddress>> {
    const maybeAccount = await fetchMaybeNameRecordHeader(rpc, address, config);
    assertAccountExists(maybeAccount);
    return maybeAccount;
  }
  
  export async function fetchMaybeNameRecordHeader<
    TAddress extends string = string,
  >(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    address: Address<TAddress>,
    config?: FetchAccountConfig
  ): Promise<MaybeAccount<NameRecordHeader, TAddress>> {
    const maybeAccount = await fetchEncodedAccount(rpc, address, config);
    return decodeNameRecordHeader(maybeAccount);
  }
  
  export async function fetchAllNameRecordHeader(
    rpc: Parameters<typeof fetchEncodedAccounts>[0],
    addresses: Array<Address>,
    config?: FetchAccountsConfig
  ): Promise<Account<NameRecordHeader>[]> {
    const maybeAccounts = await fetchAllMaybeNameRecordHeader(
      rpc,
      addresses,
      config
    );
    assertAccountsExist(maybeAccounts);
    return maybeAccounts;
  }
  
  export async function fetchAllMaybeNameRecordHeader(
    rpc: Parameters<typeof fetchEncodedAccounts>[0],
    addresses: Array<Address>,
    config?: FetchAccountsConfig
  ): Promise<MaybeAccount<NameRecordHeader>[]> {
    const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
    return maybeAccounts.map((maybeAccount) =>
      decodeNameRecordHeader(maybeAccount)
    );
  }
  
  export function getNameRecordHeaderSize(): number {
    return 200;
  }
  