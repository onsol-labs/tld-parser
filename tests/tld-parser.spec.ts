import { createDefaultRpcTransport, createSolanaRpcFromTransport, Address, fetchEncodedAccounts, address } from '@solana/kit';
import { MAIN_DOMAIN_DISCRIMINATOR, MainDomain, NAME_RECORD_HEADER_DISCRIMINATOR, NameRecordHeader, Record, TldParser, getDomainKey, getMainDomainEncoder, getMultipleMainDomainsChecked, getMainDomainChecked } from '../src';


const RPC_URL = '';
const transport = createDefaultRpcTransport({
    url: RPC_URL,
});

const connection = createSolanaRpcFromTransport(transport);
const owner =
    '2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67' as Address
    ;
const parentAccount = '8err4ThuTiZo9LbozHAvMrzXUmyPWj9urnMo38vC6FdQ' as Address;
const nameAccount = '6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB' as Address;
const parentAccountOwner = 'ANgPRMKQHgH5Snx2K3VHCvHqFmrABcjTZUrqZBzDCtfA' as Address;

describe('tldParser SVM tests', () => {
    it('should perform fetching of a pending expiry domain', async () => {
        const parser = new TldParser(connection, "solana");
        const domanTld = 'canwenot.abc';
        const ownerRecieved = await parser.getOwnerFromDomainTld(domanTld);
        expect(ownerRecieved).toStrictEqual(undefined);
    });

    it('should perform lookup of tld from parentAccount', async () => {
        const parser = new TldParser(connection);
        const tld = await parser.getTldFromParentAccount(parentAccount);
        // console.log(tld)
        expect(tld).toStrictEqual(expect.stringContaining('.poor'));
    });

    it('should perform reverse lookup of domain from nameAccount and parent name owner', async () => {
        const parser = new TldParser(connection);
        const domain = await parser.reverseLookupNameAccount(nameAccount, parentAccountOwner);
        expect(domain).toStrictEqual(expect.stringContaining('miester'));
    });

    it('should perform fetching of an owner an undefined owner', async () => {
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

        const nameRecord: NameRecordHeader = {
            discriminator: NAME_RECORD_HEADER_DISCRIMINATOR,
            expiresAt: new Date(0),
            createdAt: new Date(0),
            nonTransferable: false,
            nclass: "11111111111111111111111111111111" as Address,
            owner: "2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67" as Address,
            parentName: parentAccount
        };
        nameRecord.isValid = true;
        nameRecord.data = Buffer.from([68, 72, 88, 44, 15, 167, 103, 243, 113, 180, 168, 200, 131, 102, 203, 54, 48, 77, 56, 65, 154, 171, 37, 203, 56, 53, 255, 184, 2, 233, 174, 244, 75, 133, 18, 158, 145, 107, 191, 143, 18, 65, 130, 87, 198, 180, 195, 190, 141, 116, 81, 6, 155, 48, 13, 57, 205, 65, 196, 236, 175, 112, 72, 119, 136, 62, 13, 186, 146, 133, 177, 112, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,])
        expect(nameRecordRecieved).toStrictEqual(nameRecord);
    });

    it('should perform fetching of dns record of domain', async () => {
        let domain = 'miester.poor';
        let multiRecordPubkeys = [
            (await getDomainKey(Record.Url + '.' + domain, true)).pubkey,
            (await getDomainKey(Record.IPFS + '.' + domain, true)).pubkey,
            (await getDomainKey(Record.ARWV + '.' + domain, true)).pubkey,
            (await getDomainKey(Record.SHDW + '.' + domain, true)).pubkey,
        ];
        const nameRecords = await fetchEncodedAccounts(connection, multiRecordPubkeys);
        // console.log(nameRecords)
        expect(nameRecords).toHaveLength(4);
    });

    it('should perform fetching of main domain', async () => {
        const parser = new TldParser(connection);
        const mainDomain = await parser.getMainDomain(owner);
        const expectedNameAccount = address('DNw14GYVbAFJVun3CeTb447SbmHHi5syMLyzXezQfd3u');
        const expectedMainDomainArgs: MainDomain = {
            discriminator: MAIN_DOMAIN_DISCRIMINATOR,
            domain: 'miester',
            tld: '.bonk',
            nameAccount: expectedNameAccount
        };
        expect(mainDomain).toMatchObject(expectedMainDomainArgs);
    });

    it('should perform retrieval parsed domains of all user domains (nfts included)', async () => {
        const parser = new TldParser(connection);
        const allDomainsReceived = await parser.getParsedAllUserDomains(owner);
        // console.log(JSON.stringify(allDomainsReceived, null, 2))
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
        expect(allDomainsReceived).toHaveLength(15);
    });

    it('should perform retrieval of multiple main domains', async () => {
        const mainDomainsReceived = await getMultipleMainDomainsChecked(connection, [owner]);
        expect(mainDomainsReceived).toHaveLength(1);
    });

    it('should perform retrieval of one main domain', async () => {
        const mainDomainsReceived = await getMainDomainChecked(connection, owner);
        const expectedNameAccount = address('DNw14GYVbAFJVun3CeTb447SbmHHi5syMLyzXezQfd3u');

        const expectedMainDomainArgs = {
            pubkey: owner,
            mainDomain: 'miester.bonk',
            nameAccount: expectedNameAccount
        };
        expect(mainDomainsReceived).toMatchObject(expectedMainDomainArgs);
    });
});