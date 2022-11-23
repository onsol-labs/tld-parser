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
exports.NameRecordHeader = void 0;
const web3_js_1 = require("@solana/web3.js");
const borsh_1 = require("borsh");
/**
 * Holds the data for the {@link NameRecordHeader} Account and provides de/serialization
 * functionality for that data
 */
class NameRecordHeader {
    constructor(obj) {
        this.parentName = new web3_js_1.PublicKey(obj.parentName);
        this.nclass = new web3_js_1.PublicKey(obj.nclass);
        this.expiresAt = new Date(new borsh_1.BinaryReader(Buffer.from(obj.expiresAt)).readU64().toNumber() * 1000);
        this.isValid =
            new borsh_1.BinaryReader(Buffer.from(obj.expiresAt)).readU64().toNumber() === 0
                ? true
                : this.expiresAt > new Date();
        this.owner = this.isValid ? new web3_js_1.PublicKey(obj.owner) : undefined;
    }
    /**
     * Returns the minimum size of a {@link Buffer} holding the serialized data of
     * {@link NameRecordHeader}
     */
    static get byteSize() {
        return 8 + 32 + 32 + 32 + 8 + 88;
    }
    /**
     * Retrieves the account info from the provided address and deserializes
     * the {@link NameRecordHeader} from its data.
     */
    static fromAccountAddress(connection, nameAccountKey) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const nameAccount = yield connection.getAccountInfo(nameAccountKey, 'confirmed');
            if (!nameAccount) {
                return undefined;
            }
            const res = (0, borsh_1.deserializeUnchecked)(this.schema, NameRecordHeader, nameAccount.data);
            res.data = (_a = nameAccount.data) === null || _a === void 0 ? void 0 : _a.subarray(this.byteSize);
            return res;
        });
    }
    /**
     * Returns a readable version of {@link NameRecordHeader} properties
     * and can be used to convert to JSON and/or logging
     */
    pretty() {
        var _a;
        const indexOf0 = this.data.indexOf(0x00);
        return {
            parentName: this.parentName.toBase58(),
            owner: (_a = this.owner) === null || _a === void 0 ? void 0 : _a.toBase58(),
            nclass: this.nclass.toBase58(),
            expiresAt: this.expiresAt,
            isValid: this.isValid,
            data: this.isValid
                ? this.data.subarray(0, indexOf0).toString()
                : undefined,
        };
    }
}
exports.NameRecordHeader = NameRecordHeader;
NameRecordHeader.DISCRIMINATOR = [68, 72, 88, 44, 15, 167, 103, 243];
NameRecordHeader.HASH_PREFIX = 'ALT Name Service';
/**
 * NameRecordHeader Schema across all alt name service accounts
 */
NameRecordHeader.schema = new Map([
    [
        NameRecordHeader,
        {
            kind: 'struct',
            fields: [
                ['discriminator', [8]],
                ['parentName', [32]],
                ['owner', [32]],
                ['nclass', [32]],
                ['expiresAt', [8]],
                ['padding', [88]],
            ],
        },
    ],
]);
//# sourceMappingURL=state.js.map