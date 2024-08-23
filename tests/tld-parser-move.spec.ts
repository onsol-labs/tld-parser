import { APTOS_NODE_URL, TldParser } from '../src';
import { AptosSettings, Network } from '@aptos-labs/ts-sdk';

const owner =
    '0x3110e9c436fb710919109355b190321e3d4eccbe2c626ec61bb25fffa6e806b2';

describe('tldParser MOVE tests', () => {
    it('should perform fetching of all user domains', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getAllUserDomains(owner);
        expect(ownedDomainsReceived).toHaveLength(2);
    });

    it('should perform fetching of all user domains from a specific domain', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getAllUserDomainsFromTld(
            owner,
            '.test',
        );
        expect(ownedDomainsReceived).toHaveLength(2);
    });

    it('should perform fetching of owner from domain.tld', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getOwnerFromDomainTld(
            'supermiester.test',
        );
        expect(ownedDomainsReceived).toEqual([owner]);
    });

    it('should perform fetching of name record from domain.tld', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getNameRecordFromDomainTld(
            'supermiester.test',
        );
        const expectedNameRecord = {
            burn_ref: {
                inner: { vec: [] },
                self: {
                    vec: [
                        '0xaee5769354d29d9b042dc83948ed9acb6cfd297295b8e571ddca7a286a549174',
                    ],
                },
            },
            created_at: '1724414262',
            domain_name: 'supermiester',
            expires_at: '1755950262',
            main_domain_address: { vec: [] },
            tld: '.test',
            transfer_ref: {
                self: '0xaee5769354d29d9b042dc83948ed9acb6cfd297295b8e571ddca7a286a549174',
            },
            transferrable: false,
        };
        expect(ownedDomainsReceived).toEqual(expectedNameRecord);
    });

    it('should perform fetching of main domain from useraccount', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getMainDomain(owner);
        const expectedNameRecord = {
            burn_ref: {
                inner: { vec: [] },
                self: {
                    vec: [
                        '0xce69c4a6e3c6d302e6c6ef4a66aa2f7fa68e617df44cce7bdf549df18141b138',
                    ],
                },
            },
            created_at: '1724414328',
            domain_name: 'testing',
            expires_at: '1755950328',
            main_domain_address: {
                vec: [
                    '0x3110e9c436fb710919109355b190321e3d4eccbe2c626ec61bb25fffa6e806b2',
                ],
            },
            tld: '.test',
            transfer_ref: {
                self: '0xce69c4a6e3c6d302e6c6ef4a66aa2f7fa68e617df44cce7bdf549df18141b138',
            },
            transferrable: false,
        };
        expect(ownedDomainsReceived).toEqual(expectedNameRecord);
    });
});
