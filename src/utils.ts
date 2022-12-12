import { Connection, PublicKey } from '@solana/web3.js';
import { createHash } from 'crypto';

import { ANS_PROGRAM_ID, MAIN_DOMAIN_PREFIX, ORIGIN_TLD, TLD_HOUSE_PROGRAM_ID } from './constants';
import { NameRecordHeader } from './state/name-record-header';

/**
 * retrieves raw name account
 *
 * @param hashedName hashed name of the name account
 * @param nameClass defaults to pubkey::default()
 * @param parentName defaults to pubkey::default()
 */
export function getNameAccountKeyWithBump(
  hashedName: Buffer,
  nameClass?: PublicKey,
  parentName?: PublicKey,
): [PublicKey, number] {
  const seeds = [
    hashedName,
    nameClass ? nameClass.toBuffer() : Buffer.alloc(32),
    parentName ? parentName.toBuffer() : Buffer.alloc(32),
  ];

  return PublicKey.findProgramAddressSync(seeds, ANS_PROGRAM_ID);
}

/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
export async function getNameOwner(
  connection: Connection,
  nameAccountKey: PublicKey,
): Promise<PublicKey | undefined> {
  return (await NameRecordHeader.fromAccountAddress(connection, nameAccountKey))
    ?.owner;
}

/**
 * computes hashed name
 *
 * @param name any string or domain name.
 */

export function getHashedName(name: string): Buffer {
  const input = NameRecordHeader.HASH_PREFIX + name;
  const buffer = createHash('sha256').update(input, 'utf8').digest();
  return buffer;
}

/**
 * A constant in tld house.
 *
 * get origin name account should always equal to 3mX9b4AZaQehNoQGfckVcmgmA6bkBoFcbLj9RMmMyNcU
 *
 * @param originTld
 */
export async function getOriginNameAccountKey(
  originTld: string = ORIGIN_TLD,
): Promise<PublicKey> {
  const hashed_name = getHashedName(originTld);
  const [nameAccountKey] = await getNameAccountKeyWithBump(
    hashed_name,
    undefined,
    undefined,
  );
  return nameAccountKey;
}

/**
 * finds list of all name accounts for a particular user.
 *
 * @param connection sol connection
 * @param userAccount user's public key
 * @param parentAccount nameAccount's parentName
 */
export async function findOwnedNameAccountsForUser(
  connection: Connection,
  userAccount: PublicKey,
  parentAccount: PublicKey | undefined,
): Promise<PublicKey[]> {
  const filters: any = [
    {
      memcmp: {
        offset: 40,
        bytes: userAccount.toBase58(),
      },
    },
  ];

  if (parentAccount) {
    filters.push({
      memcmp: {
        offset: 8,
        bytes: parentAccount.toBase58(),
      },
    });
  }

  const accounts = await connection.getProgramAccounts(ANS_PROGRAM_ID, {
    filters: filters,
  });
  return accounts.map((a: any) => a.pubkey);
}

export function findMainDomain(user: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(MAIN_DOMAIN_PREFIX), user.toBuffer()],
    TLD_HOUSE_PROGRAM_ID
  );
}

