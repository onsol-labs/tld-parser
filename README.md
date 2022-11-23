# TLD Parser 

library to parse tld house domains via alternative name service (ANS) on the Solana Blockchain. 

## Examples
current functions and how to use them.

### initialize
```js
// the library only works in mainnet. 
// the devnet values are in constants.ts file
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);

// any owner
const owner = new PublicKey("owner pubkey");

const parser = new TldParser(connection);
```
### list of all domains owned by owner
```js
const allDomains = await parser.getAllUserDomains(owner); 
```
### list of all domains owned by owner in a tld
```js
const tld = 'poor';
const ownedDomainsReceived = await parser.getAllUserDomainsFromTld(owner, tld);
```
### get the owner of a domain and a tld
```js
const domanTld = 'miester.poor';
const ownerRecieved = await parser.getOwnerFromDomainTld(domanTld);
```
### get the nameRecord of a domain and a tld
```js

const domanTld = 'miester.poor';
const nameRecordRecieved = await parser.getNameRecordFromDomainTld(domanTld);
// if domain is expired owner and data fields would be null

```
### get the tld from a parentAccount

```js
const tld = await parser.getTldFromParentAccount(nameRecordRecieved.parentName);
// .poor
```
### get the domain from a parentAccountOwner (TldHouse Account)

```js
const domain = await parser.reverseLookupNameAccount(nameAccount, parentAccountOwner);
// miester
```

## States
current state is the NameRecordHeader, it is the data retrieved from any ANS account.

the account structure:
- parentName: PublicKey;

parent is a name account that can have many children (name accounts)
- owner: PublicKey | undefined;

name account owner can be undefined if the name account has expired
- nclass: PublicKey;

name class is an account that holds an account state (Main domain, DNS, Subdomains) or can be Publickey.default
- expiresAt: Date;

the date by which the name account will expire. would be 0 if non expirable domains
- isValid: boolean;

only valid for expirable domains
- data: Buffer | undefined;

any data that is held by the name account