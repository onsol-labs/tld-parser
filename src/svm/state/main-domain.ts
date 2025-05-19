import {
    addDecoderSizePrefix,
    addEncoderSizePrefix,
    assertAccountExists,
    assertAccountsExist,
    combineCodec,
    decodeAccount,
    fetchEncodedAccount,
    fetchEncodedAccounts,
    fixDecoderSize,
    fixEncoderSize,
    getAddressDecoder,
    getAddressEncoder,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
    getU32Decoder,
    getU32Encoder,
    getUtf8Decoder,
    getUtf8Encoder,
    transformEncoder,
    type Account,
    type Address,
    type Codec,
    type Decoder,
    type EncodedAccount,
    type Encoder,
    type FetchAccountConfig,
    type FetchAccountsConfig,
    type MaybeAccount,
    type MaybeEncodedAccount,
    type ReadonlyUint8Array,
  } from '@solana/kit';
  
  export const MAIN_DOMAIN_DISCRIMINATOR = new Uint8Array([
    109, 239, 227, 199, 98, 226, 66, 175,
  ]);
  
  export function getMainDomainDiscriminatorBytes() {
    return fixEncoderSize(getBytesEncoder(), 8).encode(MAIN_DOMAIN_DISCRIMINATOR);
  }
  
  export type MainDomain = {
    discriminator: ReadonlyUint8Array;
    nameAccount: Address;
    tld: string;
    domain: string;
  };
  
  export type MainDomainArgs = {
    nameAccount: Address;
    tld: string;
    domain: string;
  };
  
  export function getMainDomainEncoder(): Encoder<MainDomainArgs> {
    return transformEncoder(
      getStructEncoder([
        ['discriminator', fixEncoderSize(getBytesEncoder(), 8)],
        ['nameAccount', getAddressEncoder()],
        ['tld', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
        ['domain', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
      ]),
      (value) => ({ ...value, discriminator: MAIN_DOMAIN_DISCRIMINATOR })
    );
  }
  
  export function getMainDomainDecoder(): Decoder<MainDomain> {
    return getStructDecoder([
      ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
      ['nameAccount', getAddressDecoder()],
      ['tld', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
      ['domain', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ]);
  }
  
  export function getMainDomainCodec(): Codec<MainDomainArgs, MainDomain> {
    return combineCodec(getMainDomainEncoder(), getMainDomainDecoder());
  }
  
  export function decodeMainDomain<TAddress extends string = string>(
    encodedAccount: EncodedAccount<TAddress>
  ): Account<MainDomain, TAddress>;
  export function decodeMainDomain<TAddress extends string = string>(
    encodedAccount: MaybeEncodedAccount<TAddress>
  ): MaybeAccount<MainDomain, TAddress>;
  export function decodeMainDomain<TAddress extends string = string>(
    encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
  ): Account<MainDomain, TAddress> | MaybeAccount<MainDomain, TAddress> {
    return decodeAccount(
      encodedAccount as MaybeEncodedAccount<TAddress>,
      getMainDomainDecoder()
    );
  }
  
  export async function fetchMainDomain<TAddress extends string = string>(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    address: Address<TAddress>,
    config?: FetchAccountConfig
  ): Promise<Account<MainDomain, TAddress>> {
    const maybeAccount = await fetchMaybeMainDomain(rpc, address, config);
    assertAccountExists(maybeAccount);
    return maybeAccount;
  }
  
  export async function fetchMaybeMainDomain<TAddress extends string = string>(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    address: Address<TAddress>,
    config?: FetchAccountConfig
  ): Promise<MaybeAccount<MainDomain, TAddress>> {
    const maybeAccount = await fetchEncodedAccount(rpc, address, config);
    return decodeMainDomain(maybeAccount);
  }
  
  export async function fetchAllMainDomain(
    rpc: Parameters<typeof fetchEncodedAccounts>[0],
    addresses: Array<Address>,
    config?: FetchAccountsConfig
  ): Promise<Account<MainDomain>[]> {
    const maybeAccounts = await fetchAllMaybeMainDomain(rpc, addresses, config);
    assertAccountsExist(maybeAccounts);
    return maybeAccounts;
  }
  
  export async function fetchAllMaybeMainDomain(
    rpc: Parameters<typeof fetchEncodedAccounts>[0],
    addresses: Array<Address>,
    config?: FetchAccountsConfig
  ): Promise<MaybeAccount<MainDomain>[]> {
    const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
    return maybeAccounts.map((maybeAccount) => decodeMainDomain(maybeAccount));
  }
  