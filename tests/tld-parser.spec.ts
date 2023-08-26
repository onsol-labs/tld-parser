import { Connection, PublicKey } from '@solana/web3.js';

import { MainDomain, MainDomainArgs } from '../src/state/main-domain';
import { Record } from '../src/types/records';
import { NameRecordHeader, TldParser, getDomainKey } from '../src';

const RPC_URL = 'https://newest-intensive-choice.solana-mainnet.discover.quiknode.pro/b14717fce4a4f1e59e7287e5ac9bdf40fdada346/';
const connection = new Connection(RPC_URL);
const owner = new PublicKey(
  '2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67',
);
const parentAccount = new PublicKey('8err4ThuTiZo9LbozHAvMrzXUmyPWj9urnMo38vC6FdQ');
const nameAccount = new PublicKey('6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB');
const parentAccountOwner = new PublicKey('ANgPRMKQHgH5Snx2K3VHCvHqFmrABcjTZUrqZBzDCtfA');

describe('tldParser tests', () => {
  it('should perform retrieval of all user domains', async () => {
    const parser = new TldParser(connection);
    const allDomainsReceived = await parser.getAllUserDomains(owner);
    expect(allDomainsReceived).toHaveLength(11);
  });

  it('should perform retrieval of all user domains for poor tld', async () => {
    const parser = new TldParser(connection);
    const tld = 'poor';
    const ownedDomainsReceived = await parser.getAllUserDomainsFromTld(owner, tld);
    expect(ownedDomainsReceived).toHaveLength(3);
  });

  it('should perform lookup of owner of the domainTld', async () => {
    const parser = new TldParser(connection);
    const domanTld = 'miester.poor';
    const ownerRecieved = await parser.getOwnerFromDomainTld(domanTld);
    expect(ownerRecieved).toStrictEqual(owner);
  });

  it('should perform lookup of nameRecord of the domainTld', async () => {
    const parser = new TldParser(connection);
    const domanTld = 'miester.poor';
    const nameRecordRecieved = await parser.getNameRecordFromDomainTld(domanTld);
    const emptyBuffer = Buffer.alloc(0, 0);
    const zeroU64 = Buffer.alloc(8, 0);
    const nameRecord = new NameRecordHeader({
      expiresAt: Uint8Array.from(zeroU64),
      createdAt: Uint8Array.from(zeroU64),
      nonTransferable: Uint8Array.from([0]),
      nclass: PublicKey.default.toBuffer(),
      owner: owner.toBuffer(),
      parentName: parentAccount.toBuffer()
    });
    nameRecord.isValid = true;
    nameRecord.data = emptyBuffer;

    expect(nameRecordRecieved).toStrictEqual(nameRecord);
  });

  it('should perform lookup of tld from parentAccount', async () => {
    const parser = new TldParser(connection);
    const tld = await parser.getTldFromParentAccount(parentAccount);
    expect(tld).toStrictEqual(expect.stringContaining('poor'));
  });

  it('should perform reverse lookup of domain from nameAccount and parent name owner', async () => {
    const parser = new TldParser(connection);
    const domain = await parser.reverseLookupNameAccount(nameAccount, parentAccountOwner);
    expect(domain).toStrictEqual(expect.stringContaining('miester'));
  });

  it('should perform fetching of dns record of domain', async () => {
    let domain = 'miester.poor';
    let multiRecordPubkeys = [
      (await getDomainKey(Record.Url + '.' + domain, true)).pubkey,
      (await getDomainKey(Record.IPFS + '.' + domain, true)).pubkey,
      (await getDomainKey(Record.ARWV + '.' + domain, true)).pubkey,
      (await getDomainKey(Record.SHDW + '.' + domain, true)).pubkey,
    ];
    const nameRecords = await NameRecordHeader.fromMultipileAccountAddresses(connection, multiRecordPubkeys);
    expect(nameRecords).toHaveLength(4);
  });

  it('should perform fetching of main domain', async () => {
    const parser = new TldParser(connection);
    const mainDomain = await parser.getMainDomain(owner);
    const expectedNameAccount = new PublicKey('9YzfCEHb62bQ47snUyjkxhC9Eb6y7CSodK3m8CKWstjV');
    const expectedMainDomainArgs: MainDomainArgs = {
      domain: 'miester',
      tld: '.abc',
      nameAccount: expectedNameAccount
    };
    const expectedMainDomain = MainDomain.fromArgs(expectedMainDomainArgs);
    expect(mainDomain).toMatchObject(expectedMainDomain);
  });

  it('should perform fetching of an owner an nft domain', async () => {
    const parser = new TldParser(connection);
    const domanTld = 'legendary.abc';
    const ownerRecieved = await parser.getOwnerFromDomainTld(domanTld);
    expect(ownerRecieved).toStrictEqual(owner);
  });

  it('should perform retrieval parsed domains of all user domains (nfts included)', async () => {
    const parser = new TldParser(connection);
    const allDomainsReceived = await parser.getParsedAllUserDomains(owner);
    expect(allDomainsReceived).toHaveLength(21);
  });
  it('should perform retrieval parsed domains of all user domains', async () => {
    const parser = new TldParser(connection);
    const allDomainsReceived = await parser.getParsedAllUserDomainsUnwrapped(owner);
    expect(allDomainsReceived).toHaveLength(8);
  });


  it('should perform retrieval parsed domains of all user domains in a particular tld', async () => {
    const parser = new TldParser(connection);
    const allDomainsReceived = await parser.getParsedAllUserDomainsFromTldUnwrapped(owner, 'abc');
    expect(allDomainsReceived).toHaveLength(3);
  });
  it('should perform retrieval parsed nft domains of all user domains in a particular tld', async () => {
    const parser = new TldParser(connection);
    const allDomainsReceived = await parser.getParsedAllUserDomainsFromTld(owner, 'abc');
    expect(allDomainsReceived).toHaveLength(15);
  });
});