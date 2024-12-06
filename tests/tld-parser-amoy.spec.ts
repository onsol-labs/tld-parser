import { getAddress } from 'ethers';
import { NameRecord, TldParser } from '../src';
import {
    labelhashFromLabel,
    namehashFromDomain,
    NetworkWithRpc,
} from '../src/evm/utils';

const PUBLIC_KEY = getAddress('0x087fafdb6edc2227cb102500ee646a7b766906b9');
const RPC_URL =
    'https://polygon-amoy.g.alchemy.com/v2/NcyrcRlO9XKhgEjbgp2nBaOLf4EeCVBi';

describe('tldParser EVM tests', () => {
    it('should correctly parse a domain label', async () => {
        const label = labelhashFromLabel('domain');
        expect(label).toEqual(
            '0xc5d3ba30d3ac69f3f095a61e99369d9450502ca0c2f4768b2c39ee277faa631d',
        );
    });

    it('should correctly parse a domain namehash', async () => {
        const namehash = namehashFromDomain('ens.eth');
        expect(namehash).toEqual(
            '0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df',
        );
    });

    it('should perform fetching of all user domains', async () => {
        const settings = new NetworkWithRpc('amoy', 137, RPC_URL);
        const parser = new TldParser(settings, 'amoy');

        const ownedDomainsReceived = await parser.getAllUserDomains(PUBLIC_KEY);
        expect(ownedDomainsReceived).toHaveLength(17);
    });

    it('should perform fetching of all user domains from a specific domain', async () => {
        const settings = new NetworkWithRpc('amoy', 137, RPC_URL);
        const parser = new TldParser(settings, 'amoy');

        const ownedDomainsReceived = await parser.getAllUserDomainsFromTld(
            PUBLIC_KEY,
            'test',
        );
        expect(ownedDomainsReceived).toHaveLength(12);

        const ownedDomainsReceived2 = await parser.getAllUserDomainsFromTld(
            PUBLIC_KEY,
            'domain',
        );
        expect(ownedDomainsReceived2).toHaveLength(5);
    });

    it('should perform fetching of owner from domain.tld', async () => {
        const settings = new NetworkWithRpc('amoy', 137, RPC_URL);
        const parser = new TldParser(settings, 'amoy');
        const ownedDomainsReceived = await parser.getOwnerFromDomainTld(
            'testdomains2.domain',
        );
        expect(ownedDomainsReceived).toEqual(PUBLIC_KEY);
    });

    it('should perform fetching of name record from domain.tld', async () => {
        const settings = new NetworkWithRpc('amoy', 137, RPC_URL);
        const parser = new TldParser(settings, 'amoy');
        const domainName = 'testdomains2.domain';
        const ownedDomainsReceived = await parser.getNameRecordFromDomainTld(
            domainName,
        );
        const expectedNameRecord = <NameRecord>{
            created_at: '1735734015',
            domain_name: 'testdomains2',
            expires_at: '1735734315',
            main_domain_address: PUBLIC_KEY,
            tld: '.domain',
            transferrable: true,
        };
        expect(ownedDomainsReceived).toEqual(expectedNameRecord);
    });

    it('should perform fetching of main domain from useraccount', async () => {
        const settings = new NetworkWithRpc('amoy', 137, RPC_URL);
        const parser = new TldParser(settings, 'amoy');
        const domainName = PUBLIC_KEY;

        const ownedDomainsReceived = await parser.getMainDomain(domainName);
        const expectedNameRecord = <NameRecord>{
            created_at: '1735734015',
            domain_name: 'testdomains2',
            expires_at: '1735734315',
            main_domain_address: PUBLIC_KEY,
            tld: '.domain',
            transferrable: true,
        };
        expect(ownedDomainsReceived).toEqual(expectedNameRecord);
    });
});
