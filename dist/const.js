"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wallets_count = exports.assetParams = exports.chain = exports.router = exports.account = exports.CHAIN_ID = exports.mainWalletClient = exports.publicClient = exports.BASES = void 0;
const sdk_core_1 = require("@traderjoe-xyz/sdk-core");
const sdk_v2_1 = require("@traderjoe-xyz/sdk-v2");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const { PRIVATE_KEY, MODE } = process.env;
const chain = MODE === "dev" ? chains_1.bscTestnet : chains_1.bsc;
exports.chain = chain;
const CHAIN_ID = MODE === "dev" ? sdk_core_1.ChainId.BNB_TESTNET : sdk_core_1.ChainId.BNB_CHAIN;
exports.CHAIN_ID = CHAIN_ID;
const account = (0, accounts_1.privateKeyToAccount)(`0x${PRIVATE_KEY}`);
exports.account = account;
const router = sdk_v2_1.LB_ROUTER_V21_ADDRESS[CHAIN_ID];
exports.router = router;
console.log("🔍 路由器检查:");
console.log("   链ID:", CHAIN_ID);
console.log("   路由器地址:", router);
// // 使用PancakeSwap路由器
// const router = MODE === "dev" 
//   ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // PancakeSwap V2 测试网路由器
//   : "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 主网路由器
// console.log("🔧 使用PancakeSwap路由器:");
// console.log("   环境:", MODE === "dev" ? "BSC测试网" : "BSC主网");
// console.log("   路由器地址:", router);
// console.log("   账户地址:", account.address);
// initialize tokens
const WBNB = sdk_core_1.WNATIVE[CHAIN_ID]; // Token instance of WBNB
const USDC = new sdk_core_1.Token(CHAIN_ID, MODE === "dev"
    ? "0x64544969ed7EBf5f083679233325356EbE738930" // BSC测试网USDC (PancakeSwap测试)
    : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC主网USDC
18, "USDC", "USD Coin");
const USDT = new sdk_core_1.Token(CHAIN_ID, MODE === "dev"
    ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" // BSC测试网USDT (PancakeSwap测试)
    : "0x55d398326f99059fF775485246999027B3197955", // BSC主网USDT
18, "USDT", "Tether USD");
/* Step 4 */
// declare bases used to generate trade routes
const BASES = [WBNB, USDC, USDT];
exports.BASES = BASES;
const publicClient = (0, viem_1.createPublicClient)({
    chain: chain,
    transport: (0, viem_1.http)(),
});
exports.publicClient = publicClient;
const mainWalletClient = (0, viem_1.createWalletClient)({
    account,
    chain: chain,
    transport: (0, viem_1.http)(),
});
exports.mainWalletClient = mainWalletClient;
// Please update these values only
const assetParams = {
    [WBNB.symbol]: {
        min: 0.01,
        max: 0.1,
    },
    [USDC.symbol]: {
        min: 0.1,
        max: 1,
    },
};
exports.assetParams = assetParams;
const wallets_count = 1;
exports.wallets_count = wallets_count;
