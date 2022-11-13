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
exports.getNameRecordFromDomainTld = exports.getOwnerFromDomainTld = exports.getAllUserDomainsFromTld = void 0;
const web3_js_1 = require("@solana/web3.js");
const state_1 = require("./state");
const utils_1 = require("./utils");
/**
 * retrieves all nameaccounts for any user in a particular tld.
 *
 * @param connection sol connection
 * @param userAccount user publickey or string
 * @param tld tld to be retrieved from
 */
function getAllUserDomainsFromTld(connection, userAccount, tld) {
    return __awaiter(this, void 0, void 0, function* () {
        const tldName = '.' + tld;
        const nameOriginTldKey = yield (0, utils_1.getOriginNameAccountKey)();
        const parentHashedName = (0, utils_1.getHashedName)(tldName);
        const [parentAccountKey] = yield (0, utils_1.getNameAccountKeyWithBump)(parentHashedName, undefined, nameOriginTldKey);
        if (typeof userAccount == 'string') {
            userAccount = new web3_js_1.PublicKey(userAccount);
        }
        const allDomains = yield (0, utils_1.findOwnedNameAccountsForUser)(connection, userAccount, parentAccountKey);
        return allDomains;
    });
}
exports.getAllUserDomainsFromTld = getAllUserDomainsFromTld;
/**
 * retrieves owner of a particular Name Account from domain.tld.
 *
 * @param connection sol connection
 * @param domainTld full string of domain and tld e.g. "miester.poor"
 */
function getOwnerFromDomainTld(connection, domainTld) {
    return __awaiter(this, void 0, void 0, function* () {
        const domainTldSplit = domainTld.split('.');
        const domain = domainTldSplit[0];
        const tldName = '.' + domainTldSplit[1];
        const nameOriginTldKey = yield (0, utils_1.getOriginNameAccountKey)();
        const parentHashedName = (0, utils_1.getHashedName)(tldName);
        const [parentAccountKey] = yield (0, utils_1.getNameAccountKeyWithBump)(parentHashedName, undefined, nameOriginTldKey);
        const domainHashedName = (0, utils_1.getHashedName)(domain);
        const [domainAccountKey] = yield (0, utils_1.getNameAccountKeyWithBump)(domainHashedName, undefined, parentAccountKey);
        const nameOwner = yield (0, utils_1.getNameOwner)(connection, domainAccountKey);
        return nameOwner;
    });
}
exports.getOwnerFromDomainTld = getOwnerFromDomainTld;
/**
 * retrieves domainTld data a domain from domain.tld.
 *
 * @param connection sol connection
 * @param domainTld full string of domain and tld e.g. "miester.poor"
 */
function getNameRecordFromDomainTld(connection, domainTld) {
    return __awaiter(this, void 0, void 0, function* () {
        const domainTldSplit = domainTld.split('.');
        const domain = domainTldSplit[0];
        const tldName = '.' + domainTldSplit[1];
        const nameOriginTldKey = yield (0, utils_1.getOriginNameAccountKey)();
        const parentHashedName = (0, utils_1.getHashedName)(tldName);
        const [parentAccountKey] = yield (0, utils_1.getNameAccountKeyWithBump)(parentHashedName, undefined, nameOriginTldKey);
        const domainHashedName = (0, utils_1.getHashedName)(domain);
        const [domainAccountKey] = yield (0, utils_1.getNameAccountKeyWithBump)(domainHashedName, undefined, parentAccountKey);
        const nameRecord = yield state_1.NameRecordHeader.fromAccountAddress(connection, domainAccountKey);
        return nameRecord;
    });
}
exports.getNameRecordFromDomainTld = getNameRecordFromDomainTld;
