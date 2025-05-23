import { Connection, PublicKey } from '@solana/web3.js';

import { MainDomain, MainDomainArgs, NameRecordHeader, Record, TldParser, getDomainKey, getMainDomainChecked, getMultipleMainDomainsChecked } from '../src';

const RPC_URL = '';
const connection = new Connection(RPC_URL);
const owner = new PublicKey(
    '2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67',
);
const parentAccount = new PublicKey('8err4ThuTiZo9LbozHAvMrzXUmyPWj9urnMo38vC6FdQ');
const nameAccount = new PublicKey('6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB');
const parentAccountOwner = new PublicKey('ANgPRMKQHgH5Snx2K3VHCvHqFmrABcjTZUrqZBzDCtfA');

describe('tldParser SVM tests', () => {
    it('should perform fetching of a pending expiry domain', async () => {
        const parser = new TldParser(connection, "solana");
        const domanTld = 'canwenot.abc';
        const ownerRecieved = await parser.getOwnerFromDomainTld(domanTld);
        expect(ownerRecieved).toStrictEqual(undefined);
    });

    it('should perform fetching of an owner an nft domain (expired)', async () => {
        const parser = new TldParser(connection);
        const domanTld = 'legendary.abc';
        const ownerRecieved = await parser.getOwnerFromDomainTld(domanTld);
        expect(ownerRecieved).toStrictEqual(undefined);
    });

    it('should perform fetching of an owner an nft domain', async () => {
        const parser = new TldParser(connection);
        const domanTld = 'miester.abc';
        const ownerRecieved = await parser.getOwnerFromDomainTld(domanTld);
        expect(ownerRecieved).toStrictEqual(owner);
    });

    it('should perform retrieval of all user domains', async () => {
        const parser = new TldParser(connection);
        const allDomainsReceived = await parser.getAllUserDomains(owner);
        expect(allDomainsReceived).toHaveLength(79);
    });

    it('should perform retrieval of all user domains for poor tld', async () => {
        const parser = new TldParser(connection);
        const tld = 'poor';
        const ownedDomainsReceived = await parser.getAllUserDomainsFromTld(owner, tld);
        expect(ownedDomainsReceived).toHaveLength(2);
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
            owner: new PublicKey("2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67").toBuffer(),
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
        const expectedNameAccount = new PublicKey('DNw14GYVbAFJVun3CeTb447SbmHHi5syMLyzXezQfd3u');
        const expectedMainDomainArgs: MainDomainArgs = {
            domain: 'miester',
            tld: '.bonk',
            nameAccount: expectedNameAccount
        };
        const expectedMainDomain = MainDomain.fromArgs(expectedMainDomainArgs);
        expect(mainDomain).toMatchObject(expectedMainDomain);
    });

    it('should perform retrieval parsed domains of all user domains (nfts included)', async () => {
        const parser = new TldParser(connection);
        const allDomainsReceived = await parser.getParsedAllUserDomains(owner, 100);
        expect(allDomainsReceived).toHaveLength(88);
    });

    it('should perform retrieval parsed domains of all user domains', async () => {
        const parser = new TldParser(connection);
        const allDomainsReceived = await parser.getParsedAllUserDomainsUnwrapped(owner);
        expect(allDomainsReceived).toHaveLength(71);
    });

    it('should perform retrieval parsed domains of all user domains in a particular tld', async () => {
        const parser = new TldParser(connection);
        const allDomainsReceived = await parser.getParsedAllUserDomainsFromTldUnwrapped(owner, 'abc');
        expect(allDomainsReceived).toHaveLength(5);
    });

    it('should perform retrieval parsed nft domains of all user domains in a particular tld', async () => {
        const parser = new TldParser(connection);
        const allDomainsReceived = await parser.getParsedAllUserDomainsFromTld(owner, 'abc');
        // console.log(allDomainsReceived)
        expect(allDomainsReceived).toHaveLength(15);
    });

    it('should perform retrieval of user main domain checked', async () => {
        const mainDomain = await getMainDomainChecked(
            connection,
            owner.toString()
        )
        expect(mainDomain).toBeDefined();
    })

    it('should perform retrieval of multiple user main domains checked', async () => {
        const mainDomain = await getMultipleMainDomainsChecked(
            connection,
            [
                owner.toString(),
                PublicKey.default.toString()
            ]
        )
        // console.log(mainDomain)
        expect(mainDomain).toBeDefined();
    })
});