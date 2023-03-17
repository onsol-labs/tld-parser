"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAME_HOUSE_PREFIX = exports.TLD_HOUSE_PREFIX = exports.NFT_RECORD_PREFIX = exports.NAME_HOUSE_PROGRAM_ID = exports.TLD_HOUSE_PROGRAM_ID = exports.ANS_PROGRAM_ID = exports.ORIGIN_TLD = exports.MAIN_DOMAIN_PREFIX = void 0;
const web3_js_1 = require("@solana/web3.js");
exports.MAIN_DOMAIN_PREFIX = 'main_domain';
// MAINNET
exports.ORIGIN_TLD = 'ANS';
exports.ANS_PROGRAM_ID = new web3_js_1.PublicKey('ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK');
exports.TLD_HOUSE_PROGRAM_ID = new web3_js_1.PublicKey('TLDHkysf5pCnKsVA4gXpNvmy7psXLPEu4LAdDJthT9S');
exports.NAME_HOUSE_PROGRAM_ID = new web3_js_1.PublicKey('NH3uX6FtVE2fNREAioP7hm5RaozotZxeL6khU1EHx51');
exports.NFT_RECORD_PREFIX = 'nft_record';
exports.TLD_HOUSE_PREFIX = 'tld_house';
exports.NAME_HOUSE_PREFIX = 'name_house';
//# sourceMappingURL=constants.js.map