"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.mainDomainBeet = exports.MainDomain = exports.mainDomainDiscriminator = void 0;
const web3 = __importStar(require("@solana/web3.js"));
const beetSolana = __importStar(require("@metaplex-foundation/beet-solana"));
const beet = __importStar(require("@metaplex-foundation/beet"));
exports.mainDomainDiscriminator = [109, 239, 227, 199, 98, 226, 66, 175];
/**
 * Holds the data for the {@link MainDomain} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
class MainDomain {
    constructor(nameAccount, tld, domain) {
        this.nameAccount = nameAccount;
        this.tld = tld;
        this.domain = domain;
    }
    /**
     * Creates a {@link MainDomain} instance from the provided args.
     */
    static fromArgs(args) {
        return new MainDomain(args.nameAccount, args.tld, args.domain);
    }
    /**
     * Deserializes the {@link MainDomain} from the data of the provided {@link web3.AccountInfo}.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    static fromAccountInfo(accountInfo, offset = 0) {
        return MainDomain.deserialize(accountInfo.data, offset);
    }
    /**
     * Retrieves the account info from the provided address and deserializes
     * the {@link MainDomain} from its data.
     *
     * @throws Error if no account info is found at the address or if deserialization fails
     */
    static fromAccountAddress(connection, address, commitmentOrConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountInfo = yield connection.getAccountInfo(address, commitmentOrConfig);
            if (accountInfo == null) {
                throw new Error(`Unable to find MainDomain account at ${address}`);
            }
            return MainDomain.fromAccountInfo(accountInfo, 0)[0];
        });
    }
    /**
     * Provides a {@link web3.Connection.getProgramAccounts} config builder,
     * to fetch accounts matching filters that can be specified via that builder.
     *
     * @param programId - the program that owns the accounts we are filtering
     */
    static gpaBuilder(programId = new web3.PublicKey('TLDHkysf5pCnKsVA4gXpNvmy7psXLPEu4LAdDJthT9S')) {
        return beetSolana.GpaBuilder.fromStruct(programId, exports.mainDomainBeet);
    }
    /**
     * Deserializes the {@link MainDomain} from the provided data Buffer.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    static deserialize(buf, offset = 0) {
        return exports.mainDomainBeet.deserialize(buf, offset);
    }
    /**
     * Serializes the {@link MainDomain} into a Buffer.
     * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
     */
    serialize() {
        return exports.mainDomainBeet.serialize(Object.assign({ accountDiscriminator: exports.mainDomainDiscriminator }, this));
    }
    /**
     * Returns the byteSize of a {@link Buffer} holding the serialized data of
     * {@link MainDomain} for the provided args.
     *
     * @param args need to be provided since the byte size for this account
     * depends on them
     */
    static byteSize(args) {
        const instance = MainDomain.fromArgs(args);
        return exports.mainDomainBeet.toFixedFromValue(Object.assign({ accountDiscriminator: exports.mainDomainDiscriminator }, instance)).byteSize;
    }
    /**
     * Fetches the minimum balance needed to exempt an account holding
     * {@link MainDomain} data from rent
     *
     * @param args need to be provided since the byte size for this account
     * depends on them
     * @param connection used to retrieve the rent exemption information
     */
    static getMinimumBalanceForRentExemption(args, connection, commitment) {
        return __awaiter(this, void 0, void 0, function* () {
            return connection.getMinimumBalanceForRentExemption(MainDomain.byteSize(args), commitment);
        });
    }
    /**
     * Returns a readable version of {@link MainDomain} properties
     * and can be used to convert to JSON and/or logging
     */
    pretty() {
        return {
            nameAccount: this.nameAccount.toBase58(),
            tld: this.tld,
            domain: this.domain,
        };
    }
}
exports.MainDomain = MainDomain;
/**
 * @category Accounts
 * @category generated
 */
exports.mainDomainBeet = new beet.FixableBeetStruct([
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['nameAccount', beetSolana.publicKey],
    ['tld', beet.utf8String],
    ['domain', beet.utf8String],
], MainDomain.fromArgs, 'MainDomain');
//# sourceMappingURL=main-domain.js.map