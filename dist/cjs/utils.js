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
exports.findOwnedNameAccountsForUser = exports.getOriginNameAccountKey = exports.getHashedName = exports.getNameOwner = exports.getNameAccountKeyWithBump = void 0;
const web3_js_1 = require("@solana/web3.js");
const crypto_1 = require("crypto");
const constants_1 = require("./constants");
const state_1 = require("./state");
/**
 * retrieves raw name account
 *
 * @param hashedName hashed name of the name account
 * @param nameClass defaults to pubkey::default()
 * @param parentName defaults to pubkey::default()
 */
function getNameAccountKeyWithBump(hashedName, nameClass, parentName) {
    return __awaiter(this, void 0, void 0, function* () {
        const seeds = [
            hashedName,
            nameClass ? nameClass.toBuffer() : Buffer.alloc(32),
            parentName ? parentName.toBuffer() : Buffer.alloc(32),
        ];
        return yield web3_js_1.PublicKey.findProgramAddress(seeds, constants_1.ANS_PROGRAM_ID);
    });
}
exports.getNameAccountKeyWithBump = getNameAccountKeyWithBump;
/**
 * retrieves owner of the name account
 *
 * @param connection sol connection
 * @param nameAccountKey nameAccount to get owner of.
 */
function getNameOwner(connection, nameAccountKey) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        return (_a = (yield state_1.NameRecordHeader.fromAccountAddress(connection, nameAccountKey))) === null || _a === void 0 ? void 0 : _a.owner;
    });
}
exports.getNameOwner = getNameOwner;
/**
 * computes hashed name
 *
 * @param name any string or domain name.
 */
function getHashedName(name) {
    const input = state_1.NameRecordHeader.HASH_PREFIX + name;
    const buffer = (0, crypto_1.createHash)('sha256').update(input, 'utf8').digest();
    return buffer;
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
        const hashed_name = getHashedName(originTld);
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
//# sourceMappingURL=utils.js.map