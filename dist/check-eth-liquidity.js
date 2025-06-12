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
(0, dotenv_1.config)();
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.bscTestnet,
    transport: (0, viem_1.http)(),
});
// PancakeSwap V2 路由器和工厂合约
const PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const PANCAKE_FACTORY = "0x6725f303b657a9124d3a6a756bc30c0bb72c9d3c";
// 代币地址
const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const USDT = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
const USDC = "0x64544969ed7EBf5f083679233325356EbE738930";
const ETH = "0x8babbb98678facc7342735486c851abd7a0d17ca";
// 路由器 ABI
const ROUTER_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" }
        ],
        "name": "getAmountsOut",
        "outputs": [
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
// 工厂 ABI
const FACTORY_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" }
        ],
        "name": "getPair",
        "outputs": [
            { "internalType": "address", "name": "pair", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
function checkPairExistence(token0, token1, label) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pair = yield publicClient.readContract({
                address: PANCAKE_FACTORY,
                abi: FACTORY_ABI,
                functionName: "getPair",
                args: [token0, token1]
            });
            const exists = pair !== "0x0000000000000000000000000000000000000000";
            console.log(`${exists ? '✅' : '❌'} ${label}: ${pair}`);
            return exists;
        }
        catch (error) {
            console.log(`❌ ${label}: 检查失败`);
            return false;
        }
    });
}
function checkRoute(path, amount, label) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const amountIn = (0, viem_1.parseUnits)(amount, 18);
            const amounts = yield publicClient.readContract({
                address: PANCAKE_ROUTER,
                abi: ROUTER_ABI,
                functionName: "getAmountsOut",
                args: [amountIn, path]
            });
            const amountOut = (0, viem_1.formatUnits)(amounts[path.length - 1], 18);
            console.log(`✅ ${label}: ${amount} → ${amountOut}`);
            return true;
        }
        catch (error) {
            console.log(`❌ ${label}: 无流动性或路径无效`);
            return false;
        }
    });
}
function findETHRoutes() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🔍 检查 BSC 测试网上的 ETH 代币流动性");
        console.log("=".repeat(60));
        console.log("\n📊 检查交易对存在性:");
        yield checkPairExistence(ETH, WBNB, "ETH-WBNB 交易对");
        yield checkPairExistence(ETH, USDT, "ETH-USDT 交易对");
        yield checkPairExistence(ETH, USDC, "ETH-USDC 交易对");
        yield checkPairExistence(WBNB, USDT, "WBNB-USDT 交易对");
        yield checkPairExistence(WBNB, USDC, "WBNB-USDC 交易对");
        yield checkPairExistence(USDT, USDC, "USDT-USDC 交易对");
        console.log("\n🛣️ 检查可能的交易路径:");
        // 直接路径
        yield checkRoute([USDT, ETH], "1", "USDT → ETH (直接)");
        yield checkRoute([USDC, ETH], "1", "USDC → ETH (直接)");
        yield checkRoute([WBNB, ETH], "0.01", "WBNB → ETH (直接)");
        // 通过 WBNB 的路径
        yield checkRoute([USDT, WBNB, ETH], "1", "USDT → WBNB → ETH");
        yield checkRoute([USDC, WBNB, ETH], "1", "USDC → WBNB → ETH");
        // 通过 USDC 的路径
        yield checkRoute([USDT, USDC, ETH], "1", "USDT → USDC → ETH");
        console.log("\n💡 建议:");
        console.log("1. 如果没有直接的ETH交易对，可能需要:");
        console.log("   - 使用多跳路径 (如 USDT → WBNB → ETH)");
        console.log("   - 检查ETH代币地址是否正确");
        console.log("   - 在BSC测试网上添加ETH流动性");
        console.log("\n🔗 代币地址验证:");
        console.log(`   WBNB: ${WBNB}`);
        console.log(`   USDT: ${USDT}`);
        console.log(`   USDC: ${USDC}`);
        console.log(`   ETH:  ${ETH}`);
        console.log("\n" + "=".repeat(60));
    });
}
findETHRoutes();
