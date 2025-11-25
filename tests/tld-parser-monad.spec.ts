import { getAddress } from 'ethers';
import { NameRecord, TldParser } from '../src';
import {
    labelhashFromLabel,
    namehashFromDomain,
    NetworkWithRpc,
} from '../src/evm/utils';

const PUBLIC_KEY = getAddress('0x94Bfb92da83B27B39370550CA038Af96d182462f');
const RPC_URL = "";

describe('tldParser EVM tests', () => {
    it('should correctly parse a domain label', async () => {
        const label = labelhashFromLabel('.mon');
        expect(label).toEqual(
            '0x6e9db97d4be98844b20b5962d628f9e1f4b67c49bbfa2e4a2ffcef594a76ebd7',
        );
    });

    it('should correctly parse a domain namehash', async () => {
        const namehash = namehashFromDomain('ans.nad');
        expect(namehash).toEqual(
            '0x4a8791bf2b67a8f8920d3ad2b5a54f15fdfcf51bb355fac27533fcf0020a7b4f',
        );
    });

    it('should perform fetching of all user domains', async () => {
        const settings = new NetworkWithRpc('monad', 143, RPC_URL);
        const parser = new TldParser(settings, 'monad');

        const ownedDomainsReceived = await parser.getAllUserDomains(PUBLIC_KEY);
        expect(ownedDomainsReceived).toHaveLength(3);
    });

    it('should perform fetching of all user domains from a specific domain', async () => {
        const settings = new NetworkWithRpc('monad', 143, RPC_URL);
        const parser = new TldParser(settings, 'monad');

        const ownedDomainsReceived = await parser.getAllUserDomainsFromTld(
            PUBLIC_KEY,
            '.mon',
        );
        expect(ownedDomainsReceived).toHaveLength(2);
    });

    it('should perform fetching of owner from domain.tld', async () => {
        const settings = new NetworkWithRpc('monad', 143, RPC_URL);
        const parser = new TldParser(settings, 'monad');

        const ownedDomainsReceived = await parser.getOwnerFromDomainTld(
            'miester.mon',
        );
        expect(ownedDomainsReceived).toEqual(PUBLIC_KEY);
    });

    it('should perform fetching of name record from domain.tld', async () => {
        const settings = new NetworkWithRpc('monad', 143, RPC_URL);
        const parser = new TldParser(settings, 'monad');
        const domainName = 'miester.mon';
        const ownedDomainsReceived = await parser.getNameRecordFromDomainTld(
            domainName,
        );
        const expectedNameRecord = <NameRecord>{
            created_at: '1795616523',
            domain_name: 'miester',
            expires_at: '1795616823',
            main_domain_address: PUBLIC_KEY,
            tld: '.mon',
            transferrable: true,
        };
        expect(ownedDomainsReceived).toEqual(expectedNameRecord);
    });

    it('should perform fetching of main domain from useraccount', async () => {
        const settings = new NetworkWithRpc('monad', 143, RPC_URL);
        const parser = new TldParser(settings, 'monad');
        const domainName = PUBLIC_KEY;

        const ownedDomainsReceived = await parser.getMainDomain(domainName) ;
        const expectedNameRecord = <NameRecord>{
            created_at: '1795616523',
            domain_name: 'miester',
            expires_at: '1795616823',
            main_domain_address: PUBLIC_KEY,
            tld: '.mon',
            transferrable: true,
        };
        expect(ownedDomainsReceived).toEqual(expectedNameRecord);
    }); 
});
