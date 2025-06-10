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
exports.wallets_count = exports.assetParams = exports.chain = exports.routerConfig = exports.router = exports.account = exports.CHAIN_ID = exports.mainWalletClient = exports.publicClient = exports.BASES = void 0;
exports.initializeRouter = initializeRouter;
const sdk_core_1 = require("@traderjoe-xyz/sdk-core");
const sdk_v2_1 = require("@traderjoe-xyz/sdk-v2");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const dotenv_1 = require("dotenv");
const router_selector_1 = require("./router-selector");
(0, dotenv_1.config)();
const { PRIVATE_KEY, MODE } = process.env;
const chain = MODE === "dev" ? chains_1.bscTestnet : chains_1.bsc;
exports.chain = chain;
const CHAIN_ID = MODE === "dev" ? sdk_core_1.ChainId.BNB_TESTNET : sdk_core_1.ChainId.BNB_CHAIN;
exports.CHAIN_ID = CHAIN_ID;
const account = (0, accounts_1.privateKeyToAccount)(`0x${PRIVATE_KEY}`);
exports.account = account;
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
// 动态路由器配置
let routerConfig = null;
exports.routerConfig = routerConfig;
let router = "0x0000000000000000000000000000000000000000";
exports.router = router;
function initializeRouter() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔧 初始化动态路由器选择...");
            exports.routerConfig = routerConfig = yield (0, router_selector_1.selectBestRouter)(CHAIN_ID, MODE || "dev", publicClient);
            exports.router = router = routerConfig.address;
            console.log("\n🎉 路由器初始化完成:");
            console.log("   选择的路由器:", routerConfig.name);
            console.log("   路由器地址:", router);
            console.log("   路由器类型:", routerConfig.type);
            console.log("=".repeat(50));
            return routerConfig;
        }
        catch (error) {
            console.error("❌ 动态路由器选择失败，使用备用路由器");
            exports.router = router = (0, router_selector_1.getRouterFallback)(MODE || "dev");
            exports.routerConfig = routerConfig = {
                address: router,
                type: "pancakeswap",
                name: "PancakeSwap V2 (Fallback)",
                isValid: true
            };
            console.log("🔄 使用备用 PancakeSwap 路由器:", router);
            return routerConfig;
        }
    });
}
// 为了保持向后兼容，提供静态路由器作为后备
const staticRouter = sdk_v2_1.LB_ROUTER_V21_ADDRESS[CHAIN_ID] || (0, router_selector_1.getRouterFallback)(MODE || "dev");
if (!router || router === "0x0000000000000000000000000000000000000000") {
    exports.router = router = staticRouter;
}
console.log("🔍 当前路由器状态:");
console.log("   链ID:", CHAIN_ID);
console.log("   静态路由器地址:", staticRouter);
console.log("   当前使用路由器:", router);
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
// declare bases used to generate trade routes
const BASES = [WBNB, USDC, USDT];
exports.BASES = BASES;
// Please update these values only
const assetParams = {
    [WBNB.symbol]: {
        min: 0.01, // 提高到 0.01 BNB 以满足验证要求
        max: 0.05, // 提高到 0.05 BNB
    },
    [USDC.symbol]: {
        min: 0.1, // 保持 0.1 USDC
        max: 1.0, // 提高到 1.0 USDC
    },
    [USDT.symbol]: {
        min: 0.1,
        max: 1.0, // 提高到 1.0 USDT
    },
};
exports.assetParams = assetParams;
const wallets_count = 2;
exports.wallets_count = wallets_count;
