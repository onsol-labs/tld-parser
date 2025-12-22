# TLD Parser
A library to parse top-level domain (TLD) names on the Solana blockchain via the Alternative Name Service (ANS) and on EVM-compatible chains (e.g., Monad). This library provides tools to interact with domain names, retrieve ownership details, and manage domain records across supported blockchains.



## Overview
The TLD Parser supports two primary implementations:
* Solana (SVM): Parses domains on the Solana Virtual Machine using the ANS system.
* EVM: Parses domains on Ethereum Virtual Machine-compatible chains (currently Monad).
* The library operates on mainnet for both chains, with devnet values available in the constants.ts file for Solana.

## Supported Chains
* Solana (SVM)
* Eclipse (SVM)
* Monad (EVM)

## Installation
Add @onsol/tldparser to package.json or `yarn add @onsol/tldparser` or `npm install @onsol/tldparser`

## Usage Examples
Below are examples demonstrating key functions for both Solana and EVM implementations. These mirror the test cases provided.
### Solana (SVM) Examples
```javascript

import { Connection, PublicKey } from '@solana/web3.js';
import { TldParser, getDomainKey, Record, NameRecordHeader } from '@onsol/tldparser';

// Constants
const RPC_URL = 'https://mainnet.rpcpool.com/';
const OWNER = new PublicKey('2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67');
const TLD = 'poor';
const DOMAIN = 'miester.poor';

// Initialize
const connection = new Connection(RPC_URL);
const parser = new TldParser(connection);

// Get all domains owned by a user
const ownerDomains = await parser.getAllUserDomains(OWNER);
// => [PublicKey("6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB")]

// Get domains for a specific TLD
const tldDomains = await parser.getAllUserDomainsFromTld(OWNER, TLD);
// => [PublicKey("6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB")]

// Get domain owner
const domainOwner = await parser.getOwnerFromDomainTld(DOMAIN);
// => PublicKey("2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67")

// Get NameRecordHeader for a domain
const nameRecord = await parser.getNameRecordFromDomainTld(DOMAIN);
// => NameRecordHeader { parentName, owner, nclass, expiresAt, isValid, data }

// Get TLD from parent account
const parentAccount = new PublicKey('8err4ThuTiZo9LbozHAvMrzXUmyPWj9urnMo38vC6FdQ');
const tld = await parser.getTldFromParentAccount(parentAccount);
// => ".poor"

// Reverse lookup domain from name account
const nameAccount = new PublicKey('6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB');
const parentOwner = new PublicKey('ANgPRMKQHgH5Snx2K3VHCvHqFmrABcjTZUrqZBzDCtfA');
const domainName = await parser.reverseLookupNameAccount(nameAccount, parentOwner);
// => "miester"

// Get DNS record (e.g., IPFS)
const recordPubkey = (await getDomainKey(Record.IPFS + '.' + DOMAIN, true)).pubkey;
const dnsRecord = await NameRecordHeader.fromAccountAddress(connection, recordPubkey);
// => ipfs://...

// Get all TLDs
const allTlds = await getAllTld(connection);
// => [{ tld: '.bonk', parentAccount: "2j6gC6MMrnw4JJpAKR5FyyUFdxxvdZdG2sg4FrqfyWi5" }, ...]

// Get a single record (NEW)
const twitter = await parser.getRecord(DOMAIN, Record.Twitter);
// => "@miester"

// Get multiple records at once (batched)
const records = await parser.getRecords(DOMAIN, [Record.Twitter, Record.Discord, Record.Pic]);
// => { Twitter: "@miester", Discord: "miester#1234", Pic: "ipfs://Qm..." }

// Get avatar with automatic gateway resolution
const avatar = await parser.getAvatar(DOMAIN);
// => "https://ipfs.io/ipfs/Qm..." (resolved from ipfs://)

// Get main domain for an address
const mainDomain = await parser.getMainDomain(OWNER);
// => MainDomain { nameAccount, domain: "miester.poor" }

// Get main domains for multiple addresses (batched)
const mainDomains = await parser.getMainDomains([OWNER.toString(), '...']);
// => ["miester.poor", null]
```
### EVM (Monad) Examples
```javascript

import { TldParser, NetworkWithRpc, Record } from '@onsol/tldparser';
import { getAddress } from 'ethers';

// Constants
const RPC_URL = 'https://rpc.monad.xyz';
const PUBLIC_KEY = getAddress('0x94Bfb92da83B27B39370550CA038Af96d182462f');
const settings = new NetworkWithRpc('monad', 143, RPC_URL);

// Initialize
const parser = new TldParser(settings, 'monad');

// Get all user domains
const allDomains = await parser.getAllUserDomains(PUBLIC_KEY);
// => [NameRecord { domain_name: "miester", tld: ".mon", ... }]

// Get domains for a specific TLD
const tldDomains = await parser.getAllUserDomainsFromTld(PUBLIC_KEY, '.mon');
// => [NameRecord { domain_name: "miester", tld: ".mon", ... }]

// Get domain owner
const owner = await parser.getOwnerFromDomainTld('miester.mon');
// => "0x94Bfb92da83B27B39370550CA038Af96d182462f"

// Get name record
const nameRecord = await parser.getNameRecordFromDomainTld('miester.mon');
// => NameRecord { created_at, domain_name, expires_at, main_domain_address, tld, transferrable }

// Get a single record (NEW)
const twitter = await parser.getRecord('miester.mon', Record.Twitter);
// => "@miester"

// Get multiple records at once (parallel fetches)
const records = await parser.getRecords('miester.mon', [Record.Twitter, Record.Discord, Record.Pic]);
// => { Twitter: "@miester", Discord: "miester#1234", Pic: "ipfs://Qm..." }

// Get avatar with automatic gateway resolution
const avatar = await parser.getAvatar('miester.mon');
// => "https://ipfs.io/ipfs/Qm..." (resolved from ipfs://)

// Get main domain for an address
const mainDomain = await parser.getMainDomain(PUBLIC_KEY);
// => NameRecord { domain_name: "miester", tld: ".mon", ... }

// Get main domains for multiple addresses (batched)
const mainDomains = await parser.getMainDomains([PUBLIC_KEY, '0x...']);
// => ["miester.mon", null]
```

## API Reference
### Core Methods (Available on Both Chains)
* `getAllUserDomains(userAccount)`: Retrieves all domains owned by a user.

* `getAllUserDomainsFromTld(userAccount, tld)`: Retrieves domains for a specific TLD.

* `getOwnerFromDomainTld(domainTld)`: Retrieves the owner of a domain.

* `getNameRecordFromDomainTld(domainTld)`: Retrieves detailed record data for a domain.

* `getMainDomain(userAddress)`: Retrieves the user's main domain.

### Records API (Available on Both Chains)
* `getRecord(domainTld, record)`: Get a single record (e.g., Twitter, Discord, Pic) for a domain.

* `getRecords(domainTld, records?)`: Get multiple records at once. Uses batched fetching (SVM) or parallel calls (EVM). Pass an array of `Record` types or omit to fetch all.

* `getAvatar(domainTld, options?)`: Get the avatar URL with automatic gateway resolution. Converts `ipfs://`, `ar://`, `arwv://` to HTTP URLs.

* `getMainDomains(addresses)`: Get main domains for multiple addresses. Uses batched fetching (SVM) or parallel calls (EVM). Returns `null` for addresses without a main domain.

### Available Record Types
```typescript
import { Record } from '@onsol/tldparser';

// Social
Record.Twitter    // Twitter/X handle
Record.Discord    // Discord username
Record.Github     // GitHub username
Record.Telegram   // Telegram handle
Record.Reddit     // Reddit username

// Profile
Record.Pic        // Avatar/profile picture
Record.Email      // Email address
Record.Url        // Website URL

// Crypto Addresses
Record.SOL        // Solana address
Record.ETH        // Ethereum address
Record.BTC        // Bitcoin address
// ... and more (APTOS, NEAR, BASE, SUI, etc.)

// Storage
Record.IPFS       // IPFS content hash
Record.ARWV       // Arweave transaction ID
```

### Avatar Resolution
The `getAvatar()` method automatically resolves various URL schemes to HTTP:
```typescript
// Input → Output
"ipfs://QmXxx"     → "https://ipfs.io/ipfs/QmXxx"
"ar://txId"        → "https://arweave.net/txId"
"arwv://txId"      → "https://arweave.net/txId"
"https://..."      → "https://..." (unchanged)

// NFT avatars (Solana)
"mpl:<mint>"       → "https://alldomains.id/api/nft/mpl/<mint>"
"core:<asset>"     → "https://alldomains.id/api/nft/core/<asset>"

// NFT avatars (EVM)
"eip155:1/erc721:0x.../123" → "https://alldomains.id/api/nft/evm/..."

// Custom gateways
const avatar = await parser.getAvatar('miester.poor', {
    ipfsGateway: 'https://cloudflare-ipfs.com',
    arweaveGateway: 'https://arweave.net',
    nftGateway: 'https://alldomains.id'
});
```

### Solana-Specific Methods
* `getTldFromParentAccount(parentAccount)`: Retrieves the TLD from a parent account key.

* `reverseLookupNameAccount(nameAccount, parentAccountOwner)`: Performs a reverse lookup to get the domain name.

* `getParsedAllUserDomains(userAccount)`: Retrieves all domains (including NFTs) with parsed names.

* `getParsedAllUserDomainsFromTld(userAccount, tld)`: Retrieves parsed domains for a specific TLD.

## States
### Solana: NameRecordHeader
Represents the state of an ANS account on Solana:
* `parentName: PublicKey`: Parent name account key.
* `owner: PublicKey | undefined`: Owner of the name account (undefined if expired).
* `nclass: PublicKey`: Class of the name account (e.g., main domain, DNS) or PublicKey.default.
* `expiresAt: Date`: Expiration date (0 for non-expirable domains).
* `isValid: boolean`: Validity status for expirable domains.
* `data: Buffer | undefined`: Additional data stored in the account.

### EVM: NameRecord
Represents domain data on EVM chains:
* `created_at: string`: Creation timestamp.
* `domain_name: string`: Domain name (e.g., "miester").
* `expires_at: string`: Expiration timestamp.
* `main_domain_address: string`: Owner address.
* `tld: string`: Top-level domain (e.g., ".mon").
* `transferrable: boolean`: Whether the domain can be transferred.
* `owner: string`: Owner address.
