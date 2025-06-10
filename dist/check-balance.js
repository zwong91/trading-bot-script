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
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const dotenv_1 = require("dotenv");
const sdk_core_1 = require("@traderjoe-xyz/sdk-core");
const sdk_v2_1 = require("@traderjoe-xyz/sdk-v2");
(0, dotenv_1.config)();
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.bscTestnet,
    transport: (0, viem_1.http)(),
});
const walletAddress = "0xE0A051f87bb78f38172F633449121475a193fC1A";
const usdcAddress = "0x64544969ed7EBf5f083679233325356EbE738930";
const usdtAddress = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
const wbnbAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const erc20Abi = [
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "name",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
    },
    {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
    },
    {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
    },
];
function debugAddresses() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { MODE } = process.env;
        console.log("🔍 调试地址信息:");
        console.log("=".repeat(50));
        console.log("环境配置:");
        console.log("   MODE:", MODE);
        const CHAIN_ID = MODE === "dev" ? sdk_core_1.ChainId.BNB_TESTNET : sdk_core_1.ChainId.BNB_CHAIN;
        console.log("   CHAIN_ID:", CHAIN_ID);
        console.log("\n路由器地址检查:");
        console.log("   所有可用路由器:", Object.keys(sdk_v2_1.LB_ROUTER_V21_ADDRESS));
        console.log("   当前链的路由器:", sdk_v2_1.LB_ROUTER_V21_ADDRESS[CHAIN_ID]);
        console.log("\nWNATIVE地址检查:");
        console.log("   所有可用WNATIVE:", Object.keys(sdk_core_1.WNATIVE));
        console.log("   当前链的WNATIVE:", (_a = sdk_core_1.WNATIVE[CHAIN_ID]) === null || _a === void 0 ? void 0 : _a.address);
        // 检查是否TraderJoe支持BSC
        const supportedChains = Object.keys(sdk_v2_1.LB_ROUTER_V21_ADDRESS).map(id => parseInt(id));
        console.log("\n支持的链ID:", supportedChains);
        if (supportedChains.includes(CHAIN_ID)) {
            console.log("✅ TraderJoe支持当前链");
        }
        else {
            console.log("❌ TraderJoe不支持当前链");
            console.log("建议:");
            console.log("   1. 切换到支持的链");
            console.log("   2. 使用PancakeSwap路由器代替");
        }
        console.log("\n" + "=".repeat(50));
    });
}
function checkTokenBalance(tokenAddress, tokenName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const balance = yield publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [walletAddress],
            });
            const decimals = yield publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "decimals",
                args: [],
            });
            const symbol = yield publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "symbol",
                args: [],
            });
            console.log(`💰 ${tokenName} (${symbol})余额:`, (0, viem_1.formatUnits)(balance, decimals), symbol);
            return { balance: balance, decimals: decimals, symbol: symbol };
        }
        catch (error) {
            console.log(`❌ ${tokenName}余额检查失败:`, error.message);
            return null;
        }
    });
}
function checkBalances() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔍 检查钱包余额...");
            console.log("钱包地址:", walletAddress);
            console.log("网络: BSC测试网");
            console.log("=".repeat(50));
            // 检查原生BNB余额
            const bnbBalance = yield publicClient.getBalance({
                address: walletAddress,
            });
            console.log("🪙 BNB余额:", (0, viem_1.formatUnits)(bnbBalance, 18), "BNB");
            console.log("-".repeat(30));
            // 检查各种代币余额
            yield checkTokenBalance(wbnbAddress, "Wrapped BNB");
            yield checkTokenBalance(usdcAddress, "USD Coin");
            yield checkTokenBalance(usdtAddress, "Tether USD");
            console.log("=".repeat(50));
            console.log("✅ 余额检查完成");
            // 检查是否有足够资金进行测试
            const minBnbForGas = 0.01; // 最少需要0.01 BNB用于gas费
            const bnbAmount = parseFloat((0, viem_1.formatUnits)(bnbBalance, 18));
            console.log("\n📊 资金状态分析:");
            if (bnbAmount >= minBnbForGas) {
                console.log("✅ BNB余额充足，可以支付gas费");
            }
            else {
                console.log("⚠️  BNB余额不足，建议从水龙头获取更多BNB");
                console.log("   水龙头地址: https://testnet.binance.org/faucet-smart");
            }
        }
        catch (error) {
            console.error("❌ 检查余额失败:", error);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 先运行地址调试
        yield debugAddresses();
        // 然后检查余额
        yield checkBalances();
    });
}
main();
