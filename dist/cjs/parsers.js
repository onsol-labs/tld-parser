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
exports.TldParser = void 0;
const main_domain_1 = require("./state/main-domain");
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = require("bn.js");
const name_record_header_1 = require("./state/name-record-header");
const utils_1 = require("./utils");
class TldParser {
    constructor(connection) {
        this.connection = connection;
    }
    /**
     * retrieves all nameAccounts for any user.
     *
     * @param userAccount user publickey or string
     */
    getAllUserDomains(userAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof userAccount == 'string') {
                userAccount = new web3_js_1.PublicKey(userAccount);
            }
            const allDomains = yield (0, utils_1.findOwnedNameAccountsForUser)(this.connection, userAccount, undefined);
            return allDomains;
        });
    }
    /**
     * retrieves all nameaccounts for any user in a particular tld.
     *
     * @param userAccount user publickey or string
     * @param tld tld to be retrieved from
     */
    getAllUserDomainsFromTld(userAccount, tld) {
        return __awaiter(this, void 0, void 0, function* () {
            const tldName = '.' + tld;
            const nameOriginTldKey = yield (0, utils_1.getOriginNameAccountKey)();
            const parentHashedName = yield (0, utils_1.getHashedName)(tldName);
            const [parentAccountKey] = (0, utils_1.getNameAccountKeyWithBump)(parentHashedName, undefined, nameOriginTldKey);
            if (typeof userAccount == 'string') {
                userAccount = new web3_js_1.PublicKey(userAccount);
            }
            const allDomains = yield (0, utils_1.findOwnedNameAccountsForUser)(this.connection, userAccount, parentAccountKey);
            return allDomains;
        });
    }
    /**
     * retrieves owner of a particular Name Account from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getOwnerFromDomainTld(domainTld) {
        return __awaiter(this, void 0, void 0, function* () {
            const domainTldSplit = domainTld.split('.');
            const domain = domainTldSplit[0];
            const tldName = '.' + domainTldSplit[1];
            const nameOriginTldKey = yield (0, utils_1.getOriginNameAccountKey)();
            const parentHashedName = yield (0, utils_1.getHashedName)(tldName);
            const [parentAccountKey] = (0, utils_1.getNameAccountKeyWithBump)(parentHashedName, undefined, nameOriginTldKey);
            const domainHashedName = yield (0, utils_1.getHashedName)(domain);
            const [domainAccountKey] = (0, utils_1.getNameAccountKeyWithBump)(domainHashedName, undefined, parentAccountKey);
            const [tldHouse] = (0, utils_1.findTldHouse)(tldName);
            const nameOwner = yield (0, utils_1.getNameOwner)(this.connection, domainAccountKey, tldHouse);
            return nameOwner;
        });
    }
    /**
     * retrieves domainTld data a domain from domain.tld.
     *
     * @param domainTld full string of domain and tld e.g. "miester.poor"
     */
    getNameRecordFromDomainTld(domainTld) {
        return __awaiter(this, void 0, void 0, function* () {
            const domainTldSplit = domainTld.split('.');
            const domain = domainTldSplit[0];
            const tldName = '.' + domainTldSplit[1];
            const nameOriginTldKey = yield (0, utils_1.getOriginNameAccountKey)();
            const parentHashedName = yield (0, utils_1.getHashedName)(tldName);
            const [parentAccountKey] = (0, utils_1.getNameAccountKeyWithBump)(parentHashedName, undefined, nameOriginTldKey);
            const domainHashedName = yield (0, utils_1.getHashedName)(domain);
            const [domainAccountKey] = (0, utils_1.getNameAccountKeyWithBump)(domainHashedName, undefined, parentAccountKey);
            const nameRecord = yield name_record_header_1.NameRecordHeader.fromAccountAddress(this.connection, domainAccountKey);
            return nameRecord;
        });
    }
    /**
     * retrieves tld from parent name via TldHouse account.
     *
     * @param parentAccount parent publickey or string
     */
    getTldFromParentAccount(parentAccount) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof parentAccount == 'string') {
                parentAccount = new web3_js_1.PublicKey(parentAccount);
            }
            const parentNameAccount = yield name_record_header_1.NameRecordHeader.fromAccountAddress(this.connection, parentAccount);
            const tldHouseData = yield this.connection.getAccountInfo(parentNameAccount === null || parentNameAccount === void 0 ? void 0 : parentNameAccount.owner);
            const tldStart = 8 + 32 + 32 + 32;
            const tldBuffer = (_a = tldHouseData === null || tldHouseData === void 0 ? void 0 : tldHouseData.data) === null || _a === void 0 ? void 0 : _a.subarray(tldStart);
            const nameLength = new bn_js_1.BN(tldBuffer === null || tldBuffer === void 0 ? void 0 : tldBuffer.subarray(0, 4), 'le').toNumber();
            const tld = tldBuffer
                .subarray(4, 4 + nameLength)
                .toString()
                .replace(/\0.*$/g, '');
            return tld;
        });
    }
    /**
     * retrieves domain from name account via tldParent account.
     *
     * @param nameAccount name publickey or string
     * @param parentAccountOwner parent Owner or string (TldHouse)
     */
    reverseLookupNameAccount(nameAccount, parentAccountOwner) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof nameAccount == 'string') {
                nameAccount = new web3_js_1.PublicKey(nameAccount);
            }
            if (typeof parentAccountOwner == 'string') {
                parentAccountOwner = new web3_js_1.PublicKey(parentAccountOwner);
            }
            const reverseLookupHashedName = yield (0, utils_1.getHashedName)(nameAccount.toString());
            const [reverseLookupAccount] = (0, utils_1.getNameAccountKeyWithBump)(reverseLookupHashedName, parentAccountOwner, undefined);
            const reverseLookUpResult = yield name_record_header_1.NameRecordHeader.fromAccountAddress(this.connection, reverseLookupAccount);
            const domain = (_a = reverseLookUpResult === null || reverseLookUpResult === void 0 ? void 0 : reverseLookUpResult.data) === null || _a === void 0 ? void 0 : _a.toString();
            return domain;
        });
    }
    /**
     * retrieves main domain name account and its domain tld from user address.
     *
     * @param userAddress user publickey or string
     */
    getMainDomain(userAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof userAddress == 'string') {
                userAddress = new web3_js_1.PublicKey(userAddress);
            }
            const [mainDomainAddress] = (0, utils_1.findMainDomain)(userAddress);
            const mainDomain = yield main_domain_1.MainDomain.fromAccountAddress(this.connection, mainDomainAddress);
            return mainDomain;
        });
    }
}
exports.TldParser = TldParser;
//# sourceMappingURL=parsers.js.map