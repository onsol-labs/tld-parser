# TLD Parser

A library to parse top-level domain (TLD) names on Solana and SVM-compatible chains via the Alternative Name Service (ANS). This library provides tools to interact with domain names, retrieve ownership details, and manage domain records.

## Supported Chains

- Solana
- Eclipse
- Yona
- Termina

## Installation

```bash
yarn add @onsol/tldparser
```

## Usage Examples

```typescript
import { createSolanaRpc } from '@solana/kit';
import { TldParser, getDomainKey, NameRecordHeader, getAllTld } from '@onsol/tldparser';

// Constants
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const OWNER = '2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67';
const TLD = 'poor';
const DOMAIN = 'miester.poor';

// Initialize
const rpc = createSolanaRpc(RPC_URL);
const parser = new TldParser(rpc);

// Get all domains owned by a user
const ownerDomains = await parser.getAllUserDomains(OWNER);
// => ["6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB"]

// Get domains for a specific TLD
const tldDomains = await parser.getAllUserDomainsFromTld(OWNER, TLD);
// => ["6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB"]

// Get domain owner
const domainOwner = await parser.getOwnerFromDomainTld(DOMAIN);
// => "2EGGxj2qbNAJNgLCPKca8sxZYetyTjnoRspTPjzN2D67"

// Get NameRecordHeader for a domain
const nameRecord = await parser.getNameRecordFromDomainTld(DOMAIN);
// => NameRecordHeader { parentName, owner, nclass, expiresAt, isValid, data }

// Get TLD from parent account
const parentAccount = '8err4ThuTiZo9LbozHAvMrzXUmyPWj9urnMo38vC6FdQ';
const tld = await parser.getTldFromParentAccount(parentAccount);
// => ".poor"

// Reverse lookup domain from name account
const nameAccount = '6iE5btnTaan1eqfnwChLdVAyFERdn5uCVnp5GiXVg1aB';
const parentOwner = 'ANgPRMKQHgH5Snx2K3VHCvHqFmrABcjTZUrqZBzDCtfA';
const domainName = await parser.reverseLookupNameAccount(nameAccount, parentOwner);
// => "miester"

// Get all TLDs
const allTlds = await getAllTld(rpc);
// => [{ tld: '.bonk', parentAccount: "2j6gC6MMrnw4JJpAKR5FyyUFdxxvdZdG2sg4FrqfyWi5" }, ...]
```

## API Reference

### Core Methods

- `getAllUserDomains(userAccount)`: Retrieves all domains owned by a user.
- `getAllUserDomainsFromTld(userAccount, tld)`: Retrieves domains for a specific TLD.
- `getOwnerFromDomainTld(domainTld)`: Retrieves the owner of a domain.
- `getNameRecordFromDomainTld(domainTld)`: Retrieves detailed record data for a domain.
- `getMainDomain(userAddress)`: Retrieves the user's main domain.
- `getTldFromParentAccount(parentAccount)`: Retrieves the TLD from a parent account key.
- `reverseLookupNameAccount(nameAccount, parentAccountOwner)`: Performs a reverse lookup to get the domain name.
- `getParsedAllUserDomains(userAccount)`: Retrieves all domains (including NFTs) with parsed names.
- `getParsedAllUserDomainsFromTld(userAccount, tld)`: Retrieves parsed domains for a specific TLD.

## NameRecordHeader

Represents the state of an ANS account:

- `parentName: Address`: Parent name account key.
- `owner: Address | undefined`: Owner of the name account (undefined if expired).
- `nclass: Address`: Class of the name account (e.g., main domain, DNS).
- `expiresAt: Date`: Expiration date (0 for non-expirable domains).
- `isValid: boolean`: Validity status for expirable domains.
- `data: Uint8Array | undefined`: Additional data stored in the account.
