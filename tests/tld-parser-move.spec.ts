import { APTOS_NODE_URL, TldParser } from '../src';
import { AptosSettings, Network } from '@aptos-labs/ts-sdk';

const owner =
    '0xcc6bf35bb2e91e5a23183c6de65b3d85dd551046c71bb9785c31eb6e0addf86e';

describe('tldParser MOVE tests', () => {
    it('should perform fetching of all user domains', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getAllUserDomains(owner);
        expect(ownedDomainsReceived).toHaveLength(6);
    });

    it('should perform fetching of all user domains from a specific domain', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getAllUserDomainsFromTld(
            owner,
            'TEST',
        );
        expect(ownedDomainsReceived).toHaveLength(4);
    });

    it('should perform fetching of owner from domain.tld', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getOwnerFromDomainTld(
            'okok.TEST',
        );
        expect(ownedDomainsReceived).toEqual([owner]);
    });

    it('should perform fetching of name record from domain.tld', async () => {
        const aptosSettings: AptosSettings = {
            network: Network.DEVNET,
        };
        const parser = new TldParser(aptosSettings, 'move');
        const ownedDomainsReceived = await parser.getNameRecordFromDomainTld(
            'okok.TEST',
        );
        const expectedNameRecord = {
            burn_ref: {
                inner: { vec: [] },
                self: {
                    vec: [
                        '0xc537c1768c1901f6ca4f50ea0e7ece2feddcd815e67cea11b70b647341c45a23',
                    ],
                },
            },
            created_at: '1724333701',
            domain_name: 'okok',
            expires_at: '1724333701',
            main_domain_address: { vec: [] },
            tld: 'TEST',
            transfer_ref: {
                self: '0xc537c1768c1901f6ca4f50ea0e7ece2feddcd815e67cea11b70b647341c45a23',
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
                        '0x352664b87128bbef379041a37ccfffcea95bb6b30a960c6a8798ecfa918671d3',
                    ],
                },
            },
            created_at: '1724333455',
            domain_name: 'okok',
            expires_at: '1755869455',
            main_domain_address: {
                vec: [
                    '0xcc6bf35bb2e91e5a23183c6de65b3d85dd551046c71bb9785c31eb6e0addf86e',
                ],
            },
            tld: 'BEAR',
            transfer_ref: {
                self: '0x352664b87128bbef379041a37ccfffcea95bb6b30a960c6a8798ecfa918671d3',
            },
            transferrable: false,
        };
        expect(ownedDomainsReceived).toEqual(expectedNameRecord);
    });
});
