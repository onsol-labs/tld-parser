# Records API Documentation

This document covers the new Records API added to `@onsol/tldparser`. These features provide unified access to domain records across both **Solana (SVM)** and **Monad (EVM)** chains.

## Overview

The Records API enables developers to:

- Fetch individual domain records (Twitter, Discord, avatars, crypto addresses, etc.)
- Batch-fetch multiple records efficiently
- Resolve avatar URLs with automatic gateway conversion (IPFS, Arweave, NFTs)
- Look up main domains for multiple addresses in a single call

## Installation

```bash
npm/yarn install @onsol/tldparser
```

## Quick Start

```typescript
import { TldParserSvm, TldParserEvm, Record, NetworkWithRpc } from '@onsol/tldparser';
import { Connection } from '@solana/web3.js';

// Solana
const connection = new Connection('https://api.mainnet-beta.solana.com');
const svmParser = new TldParserSvm(connection);

// Monad (EVM)
const evmSettings = new NetworkWithRpc('monad', 143, 'https://rpc.monad.xyz');
const evmParser = new TldParserEvm(evmSettings);
```

---

## API Reference

### `getRecord(domainTld, record)`

Fetch a single record for a domain.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `domainTld` | `string` | Full domain with TLD (e.g., `"miester.poor"`, `"miester.mon"`) |
| `record` | `Record` | The record type to fetch |

**Returns:** `Promise<string | null>`

**Example:**
```typescript
const twitter = await parser.getRecord('miester.poor', Record.Twitter);
// => "@miester" or null
```

**How it works:**
- **SVM (Solana):** Derives a sub-account PDA from `Record.Twitter + "." + domain` → fetches `Twitter.miester.poor`
- **EVM (Monad):** Calls `text(namehash, "com.twitter")` on the resolver contract

---

### `getRecords(domainTld, records?)`

Batch-fetch multiple records for a domain.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `domainTld` | `string` | Full domain with TLD |
| `records` | `Record[]` | Array of record types (optional, defaults to all) |

**Returns:** `Promise<RecordResult>`

```typescript
type RecordResult = {
    [key in Record]?: string | null;
};
```

**Example:**
```typescript
const records = await parser.getRecords('miester.poor', [
    Record.Twitter,
    Record.Discord,
    Record.Pic,
    Record.ETH,
]);
// => { Twitter: "@miester", Discord: "miester#1234", Pic: "ipfs://Qm...", ETH: "0x..." }
```

**Performance:**
- **SVM:** Uses `getMultipleAccountsInfo` for efficient batch fetching
- **EVM:** Uses `Promise.all` for parallel contract calls

---

### `getAvatar(domainTld, options?)`

Fetch and resolve avatar URL to an HTTP-accessible endpoint.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `domainTld` | `string` | Full domain with TLD |
| `options` | `AvatarOptions` | Custom gateway URLs (optional) |

```typescript
interface AvatarOptions {
    ipfsGateway?: string;     // Default: "https://ipfs.io"
    arweaveGateway?: string;  // Default: "https://arweave.net"
    nftGateway?: string;      // Default: "https://alldomains.id/api"
}
```

**Returns:** `Promise<string | null>`

**Example:**
```typescript
// Basic usage
const avatar = await parser.getAvatar('miester.poor');
// => "https://ipfs.io/ipfs/QmXxxx..."

// Custom gateways
const avatar = await parser.getAvatar('miester.poor', {
    ipfsGateway: 'https://cloudflare-ipfs.com',
    arweaveGateway: 'https://arweave.net',
});
```

**Supported formats:**

| Input Format | Output |
|--------------|--------|
| `ipfs://QmXxx` | `https://ipfs.io/ipfs/QmXxx` |
| `QmXxx...` (raw CIDv0) | `https://ipfs.io/ipfs/QmXxx...` |
| `bafyxxx...` (raw CIDv1) | `https://ipfs.io/ipfs/bafyxxx...` |
| `ar://txId` | `https://arweave.net/txId` |
| `arwv://txId` | `https://arweave.net/txId` |
| `https://...` | unchanged |
| `data:image/...` | unchanged |
| `mpl:<mint>` | `https://alldomains.id/api/nft/mpl/<mint>` |
| `core:<asset>` | `https://alldomains.id/api/nft/core/<asset>` |
| `eip155:1/erc721:0x.../123` | `https://alldomains.id/api/nft/evm/...` |

**NFT Gateway Requirement:**

The NFT gateway endpoint **must return the actual image data** (not JSON metadata). When implementing a custom NFT gateway, the endpoint should:

1. Fetch the NFT metadata from the blockchain
2. Extract the `image` field from the metadata
3. **Return the raw image bytes** with appropriate `Content-Type` header

The default gateway (`https://alldomains.id/api`) handles this automatically for:
- **Metaplex Token Metadata** (`mpl:`) - Fetches metadata and returns the image
- **Metaplex Core** (`core:`) - Fetches Core asset and returns the image
- **EVM NFTs** (`eip155:`) - Resolves ERC-721/ERC-1155 tokenURI and returns the image

```typescript
// Custom NFT gateway example
const avatar = await parser.getAvatar('miester.poor', {
    nftGateway: 'https://your-gateway.com/api'
});
// Results in: https://your-gateway.com/api/nft/mpl/<mint>
// Your endpoint should return: image/png, image/jpeg, etc.
```

---

### `getMainDomains(addresses)`

Get main domains for multiple wallet addresses in a single call.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `addresses` | `string[]` | Array of wallet addresses |

**Returns:** `Promise<(string | null)[]>`

**Example:**
```typescript
// Solana
const mainDomains = await svmParser.getMainDomains([
    'GjJCJ1gzqKBp9Mw8bELDJaZG6Lp8sHXTcUb5YWPXQZJ3',
    'AnotherPubkeyHere...',
]);
// => ["miester.poor", null]

// Monad
const mainDomains = await evmParser.getMainDomains([
    '0x94Bfb92da83B27B39370550CA038Af96d182462f',
    '0x0000000000000000000000000000000000000000',
]);
// => ["miester.mon", null]
```

**Performance:**
- **SVM:** Uses `getMultipleAccountsInfo` for batch fetching
- **EVM:** Uses parallel contract calls with `Promise.all`

---

## Record Types

```typescript
import { Record } from '@onsol/tldparser';
```

### Social Records
| Record | SVM Key | EVM Key |
|--------|---------|---------|
| `Record.Twitter` | `Twitter` | `com.twitter` |
| `Record.Discord` | `Discord` | `com.discord` |
| `Record.Github` | `Github` | `com.github` |
| `Record.Reddit` | `Reddit` | `com.reddit` |
| `Record.Telegram` | `Telegram` | `org.telegram` |

### Profile Records
| Record | SVM Key | EVM Key |
|--------|---------|---------|
| `Record.Pic` | `Pic` | `avatar` |
| `Record.Email` | `Email` | `email` |
| `Record.Url` | `Url` | `url` |

### Crypto Address Records
| Record | SVM Key | EVM Key |
|--------|---------|---------|
| `Record.SOL` | `SOL` | `sol` |
| `Record.ETH` | `ETH` | `eth` |
| `Record.BTC` | `BTC` | `btc` |
| `Record.APTOS` | `APTOS` | `aptos` |
| `Record.NEAR` | `NEAR` | `near` |
| `Record.BASE` | `BASE` | `base` |
| `Record.SUI` | `SUI` | `sui` |
| `Record.LTC` | `LTC` | `ltc` |
| `Record.DOGE` | `DOGE` | `doge` |
| `Record.STACKS` | `STACKS` | `stacks` |
| `Record.LATTICA` | `Lattica` | `lattica` |
| `Record.POINT` | `POINT` | `point` |

### Storage Records
| Record | SVM Key | EVM Key |
|--------|---------|---------|
| `Record.IPFS` | `IPFS` | `ipfs` |
| `Record.ARWV` | `ARWV` | `arweave` |

---

## Utility Functions

### `resolveAvatarUrl(record, options?)`

Standalone utility to resolve avatar URLs. Used internally by `getAvatar()`.

```typescript
import { resolveAvatarUrl } from '@onsol/tldparser';

const httpUrl = resolveAvatarUrl('ipfs://QmXxxx');
// => "https://ipfs.io/ipfs/QmXxxx"
```

### `getReverseNode(address)` (EVM only)

Compute the reverse node hash for an address (used for reverse resolution).

```typescript
import { getReverseNode } from '@onsol/tldparser';

const reverseNode = getReverseNode('0x94Bfb92da83B27B39370550CA038Af96d182462f');
// => "0x..." (namehash of "94bfb92da83b27b39370550ca038af96d182462f.addr.reverse")
```

---

## EVM Chain Configuration

The EVM parser now includes resolver contract addresses:

```typescript
// Monad Mainnet
{
    chainId: 143,
    rootContractAddress: '0xE6d461c863987F2a1096eA3476137F30f75B3d46',
    registryContractAddress: '0xa4338eadf4D2e0851eFb225b0Eab90bE47A095F1',
    resolverAddress: '0x314582158A0a72802aD8F6EeE6243C73dCf1F562',
    reverseRegistrarAddress: '0x270BC6b51006F4C5cbe1c38238a0cC6CAeCFbff1',
}
```

---

## Architecture Notes

### SVM Implementation

Records on Solana are stored as **sub-accounts** derived from the parent domain:

```
Domain: miester.poor
Twitter Record: Twitter.miester.poor (separate PDA)
Discord Record: Discord.miester.poor (separate PDA)
```

The `getRecords()` method uses `getMultipleAccountsInfo` to batch-fetch all record accounts in a single RPC call.

### EVM Implementation

Records on EVM chains are stored in a **resolver contract** using ENS-compatible text records:

```solidity
function text(bytes32 node, string key) view returns (string)
function name(bytes32 node) view returns (string) // reverse resolution
```

The namehash is computed using the ANS-compatible algorithm (same as ENS but without normalization).

## Complete Example

```typescript
import { TldParserSvm, TldParserEvm, Record, NetworkWithRpc } from '@onsol/tldparser';
import { Connection } from '@solana/web3.js';

async function main() {
    // === Solana ===
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const svmParser = new TldParserSvm(connection);

    // Get a single record
    const svmTwitter = await svmParser.getRecord('miester.poor', Record.Twitter);
    console.log('SVM Twitter:', svmTwitter);

    // Get multiple records
    const svmRecords = await svmParser.getRecords('miester.poor', [
        Record.Twitter,
        Record.Discord,
        Record.Pic,
    ]);
    console.log('SVM Records:', svmRecords);

    // Get avatar
    const svmAvatar = await svmParser.getAvatar('miester.poor');
    console.log('SVM Avatar:', svmAvatar);

    // Batch main domain lookup
    const svmMainDomains = await svmParser.getMainDomains([
        'GjJCJ1gzqKBp9Mw8bELDJaZG6Lp8sHXTcUb5YWPXQZJ3',
    ]);
    console.log('SVM Main Domains:', svmMainDomains);

    // === Monad (EVM) ===
    const evmSettings = new NetworkWithRpc('monad', 143, 'https://rpc.monad.xyz');
    const evmParser = new TldParserEvm(evmSettings);

    // Get a single record
    const evmTwitter = await evmParser.getRecord('miester.mon', Record.Twitter);
    console.log('EVM Twitter:', evmTwitter);

    // Get multiple records
    const evmRecords = await evmParser.getRecords('miester.mon', [
        Record.Twitter,
        Record.Discord,
        Record.Pic,
    ]);
    console.log('EVM Records:', evmRecords);

    // Get avatar with custom gateway
    const evmAvatar = await evmParser.getAvatar('miester.mon', {
        ipfsGateway: 'https://cloudflare-ipfs.com',
    });
    console.log('EVM Avatar:', evmAvatar);

    // Batch main domain lookup
    const evmMainDomains = await evmParser.getMainDomains([
        '0x94Bfb92da83B27B39370550CA038Af96d182462f',
    ]);
    console.log('EVM Main Domains:', evmMainDomains);
}

main();
```
