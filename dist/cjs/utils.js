"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNameHouse = exports.findTldHouse = exports.findNftRecord = exports.getMintOwner = exports.findAllDomainsForTld = exports.getParentAccountFromTldHouseAccountInfo = exports.getTldFromTldHouseAccountInfo = exports.getAllTld = exports.findMainDomain = exports.findOwnedNameAccountsForUser = exports.getOriginNameAccountKey = exports.getHashedName = exports.getNameOwner = exports.getNameAccountKeyWithBump = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = require("bn.js");
const sha2_1 = require("@ethersproject/sha2");
const constants_1 = require("./constants");
const name_record_header_1 = require("./state/name-record-header");
const tag_1 = require("./types/tag");
const nft_record_1 = require("./state/nft-record");
/**
 * retrieves raw name account
 *
 * @param hashedName hashed name of the name account
 * @param nameClass defaults to pubkey::default()
 * @param parentName defaults to pubkey::default()
 */
function getNameAccountKeyWithBump(hashedName, nameClass, parentName) {
    const seeds = [
        hashedName,
        nameClass ? nameClass.toBuffer() : Buffer.alloc(32),
        parentName ? parentName.toBuffer() : Buffer.alloc(32),
    ];
    return web3_js_1.PublicKey.findProgramAddressSync(seeds, constants_1.ANS_PROGRAM_ID);
}
exports.getNameAccountKeyWithBump = getNameAccountKeyWithBump;
/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
function getNameOwner(connection, nameAccountKey, tldHouse) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const owner = (_a = (yield name_record_header_1.NameRecordHeader.fromAccountAddress(connection, nameAccountKey))) === null || _a === void 0 ? void 0 : _a.owner;
        if (!tldHouse)
            return owner;
        const [nameHouse] = findNameHouse(tldHouse);
        const [nftRecord] = findNftRecord(nameAccountKey, nameHouse);
        if ((owner === null || owner === void 0 ? void 0 : owner.toBase58()) !== nftRecord.toBase58())
            return owner;
        return yield getMintOwner(connection, nftRecord);
    });
}
exports.getNameOwner = getNameOwner;
/**
 * computes hashed name
 *
 * @param name any string or domain name.
 */
function getHashedName(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const input = name_record_header_1.NameRecordHeader.HASH_PREFIX + name;
        const str = (0, sha2_1.sha256)(Buffer.from(input, "utf8")).slice(2);
        return Buffer.from(str, "hex");
    });
}
exports.getHashedName = getHashedName;
/**
 * A constant in tld house.
 *
 * get origin name account should always equal to 3mX9b4AZaQehNoQGfckVcmgmA6bkBoFcbLj9RMmMyNcU
 *
 * @param originTld
 */
function getOriginNameAccountKey(originTld = constants_1.ORIGIN_TLD) {
    return __awaiter(this, void 0, void 0, function* () {
        const hashed_name = yield getHashedName(originTld);
        const [nameAccountKey] = yield getNameAccountKeyWithBump(hashed_name, undefined, undefined);
        return nameAccountKey;
    });
}
exports.getOriginNameAccountKey = getOriginNameAccountKey;
/**
 * finds list of all name accounts for a particular user.
 *
 * @param connection sol connection
 * @param userAccount user's public key
 * @param parentAccount nameAccount's parentName
 */
function findOwnedNameAccountsForUser(connection, userAccount, parentAccount) {
    return __awaiter(this, void 0, void 0, function* () {
        const filters = [
            {
                memcmp: {
                    offset: 40,
                    bytes: userAccount.toBase58(),
                },
            },
        ];
        if (parentAccount) {
            filters.push({
                memcmp: {
                    offset: 8,
                    bytes: parentAccount.toBase58(),
                },
            });
        }
        const accounts = yield connection.getProgramAccounts(constants_1.ANS_PROGRAM_ID, {
            filters: filters,
        });
        return accounts.map((a) => a.pubkey);
    });
}
exports.findOwnedNameAccountsForUser = findOwnedNameAccountsForUser;
function findMainDomain(user) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.MAIN_DOMAIN_PREFIX), user.toBuffer()], constants_1.TLD_HOUSE_PROGRAM_ID);
}
exports.findMainDomain = findMainDomain;
/**
 * finds list of all tld house accounts live.
 *
 * @param connection sol connection
 */
function getAllTld(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const tldHouseDiscriminator = [247, 144, 135, 1, 238, 173, 19, 249];
        const filters = [
            {
                memcmp: {
                    offset: 0,
                    bytes: tldHouseDiscriminator,
                },
            },
        ];
        const accounts = yield connection.getProgramAccounts(constants_1.TLD_HOUSE_PROGRAM_ID, {
            filters: filters,
        });
        const tldsAndParentAccounts = [];
        accounts.map(({ account }) => {
            const parentAccount = getParentAccountFromTldHouseAccountInfo(account);
            const tld = getTldFromTldHouseAccountInfo(account);
            tldsAndParentAccounts.push({ tld, parentAccount });
        });
        return tldsAndParentAccounts;
    });
}
exports.getAllTld = getAllTld;
function getTldFromTldHouseAccountInfo(tldHouseData) {
    var _a;
    const tldStart = 8 + 32 + 32 + 32;
    const tldBuffer = (_a = tldHouseData === null || tldHouseData === void 0 ? void 0 : tldHouseData.data) === null || _a === void 0 ? void 0 : _a.subarray(tldStart);
    const nameLength = new bn_js_1.BN(tldBuffer === null || tldBuffer === void 0 ? void 0 : tldBuffer.subarray(0, 4), 'le').toNumber();
    return tldBuffer
        .subarray(4, 4 + nameLength)
        .toString()
        .replace(/\0.*$/g, '');
}
exports.getTldFromTldHouseAccountInfo = getTldFromTldHouseAccountInfo;
function getParentAccountFromTldHouseAccountInfo(tldHouseData) {
    var _a;
    const parentAccountStart = 8 + 32 + 32;
    const parentAccountBuffer = (_a = tldHouseData === null || tldHouseData === void 0 ? void 0 : tldHouseData.data) === null || _a === void 0 ? void 0 : _a.subarray(parentAccountStart, parentAccountStart + 32);
    return new web3_js_1.PublicKey(parentAccountBuffer);
}
exports.getParentAccountFromTldHouseAccountInfo = getParentAccountFromTldHouseAccountInfo;
/**
 * finds list of all domains in parent account from tld.
 *
 * @param connection sol connection
 * @param parentAccount nameAccount's parentName
 */
function findAllDomainsForTld(connection, parentAccount) {
    return __awaiter(this, void 0, void 0, function* () {
        const filters = [
            {
                memcmp: {
                    offset: 8,
                    bytes: parentAccount.toBase58(),
                },
            },
        ];
        const accounts = yield connection.getProgramAccounts(constants_1.ANS_PROGRAM_ID, {
            filters: filters,
        });
        return accounts.map((a) => a.pubkey);
    });
}
exports.findAllDomainsForTld = findAllDomainsForTld;
function getMintOwner(connection, nftRecord) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const nftRecordData = yield nft_record_1.NftRecord.fromAccountAddress(connection, nftRecord);
            if (nftRecordData.tag !== tag_1.Tag.ActiveRecord)
                return;
            const largestAccounts = yield connection.getTokenLargestAccounts(nftRecordData.nftMintAccount);
            const largestAccountInfo = yield connection.getParsedAccountInfo(largestAccounts.value[0].address);
            if (!largestAccountInfo.value.data)
                return;
            // @ts-ignore
            return new web3_js_1.PublicKey(largestAccountInfo.value.data.parsed.info.owner);
        }
        catch (_a) {
            return undefined;
        }
    });
}
exports.getMintOwner = getMintOwner;
function findNftRecord(nameAccount, nameHouseAccount) {
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from(constants_1.NFT_RECORD_PREFIX),
        nameHouseAccount.toBuffer(),
        nameAccount.toBuffer(),
    ], constants_1.NAME_HOUSE_PROGRAM_ID);
}
exports.findNftRecord = findNftRecord;
function findTldHouse(tldString) {
    tldString = tldString.toLowerCase();
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.TLD_HOUSE_PREFIX), Buffer.from(tldString)], constants_1.TLD_HOUSE_PROGRAM_ID);
}
exports.findTldHouse = findTldHouse;
function findNameHouse(tldHouse) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constants_1.NAME_HOUSE_PREFIX), tldHouse.toBuffer()], constants_1.NAME_HOUSE_PROGRAM_ID);
}
exports.findNameHouse = findNameHouse;
//# sourceMappingURL=utils.js.map