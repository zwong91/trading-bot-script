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
exports.addLiquidityUSDCUSDT = addLiquidityUSDCUSDT;
exports.addLiquidityBNBUSDC = addLiquidityBNBUSDC;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)(); // Load .env file
if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env file');
}
const MODE = process.env.MODE || 'dev';
// Make sure private key is properly formatted
const privateKey = process.env.PRIVATE_KEY.startsWith('0x')
    ? process.env.PRIVATE_KEY
    : `0x${process.env.PRIVATE_KEY}`;
const account = (0, accounts_1.privateKeyToAccount)(privateKey);
// Chain configuration
const chain = MODE === "dev" ? chains_1.bscTestnet : chains_1.bsc;
// Create Viem clients (public and wallet)
const publicClient = (0, viem_1.createPublicClient)({
    chain: chain,
    transport: (0, viem_1.http)()
});
const walletClient = (0, viem_1.createWalletClient)({
    account,
    chain: chain,
    transport: (0, viem_1.http)()
});
// PancakeSwap V2 Router address
const routerAddress = MODE === "dev"
    ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // BSC测试网
    : "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // BSC主网
// PancakeSwap V2 Router ABI (只包含添加流动性需要的方法)
const PANCAKE_ROUTER_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" },
            { "internalType": "uint256", "name": "amountADesired", "type": "uint256" },
            { "internalType": "uint256", "name": "amountBDesired", "type": "uint256" },
            { "internalType": "uint256", "name": "amountAMin", "type": "uint256" },
            { "internalType": "uint256", "name": "amountBMin", "type": "uint256" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "addLiquidity",
        "outputs": [
            { "internalType": "uint256", "name": "amountA", "type": "uint256" },
            { "internalType": "uint256", "name": "amountB", "type": "uint256" },
            { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "uint256", "name": "amountTokenDesired", "type": "uint256" },
            { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" },
            { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "addLiquidityETH",
        "outputs": [
            { "internalType": "uint256", "name": "amountToken", "type": "uint256" },
            { "internalType": "uint256", "name": "amountETH", "type": "uint256" },
            { "internalType": "uint256", "name": "liquidity", "type": "uint256" }
        ],
        "stateMutability": "payable",
        "type": "function"
    }
];
// ERC20 ABI for approvals
const minimalERC20Abi = [
    {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{ "type": "uint256" }],
        "name": "allowance",
        "inputs": [
            { "type": "address", "name": "owner" },
            { "type": "address", "name": "spender" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [{ "type": "bool" }],
        "name": "approve",
        "inputs": [
            { "type": "address", "name": "spender" },
            { "type": "uint256", "name": "amount" }
        ]
    }
];
/**
 * 添加流动性到 PancakeSwap V2 的 USDC-USDT 池
 * @param {string} usdcAmount - USDC 数量 (如 "1.0")
 * @param {string} usdtAmount - USDT 数量 (如 "1.0")
 * @param {number} slippagePercent - 滑点容忍度百分比 (如 0.5 表示 0.5%)
 * @returns {Promise<string>} - 交易哈希
 */
function addLiquidityUSDCUSDT() {
    return __awaiter(this, arguments, void 0, function* (usdcAmount = "1.0", usdtAmount = "1.0", slippagePercent = 0.5) {
        try {
            console.log("🏊‍♂️ 开始添加 USDC-USDT 流动性到 PancakeSwap V2");
            console.log("   网络:", MODE === "dev" ? "BSC 测试网" : "BSC 主网");
            console.log("   路由器地址:", routerAddress);
            // 定义代币
            const USDC_ADDRESS = MODE === "dev"
                ? "0x64544969ed7EBf5f083679233325356EbE738930" // BSC测试网USDC
                : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // BSC主网USDC
            const USDT_ADDRESS = MODE === "dev"
                ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" // BSC测试网USDT
                : "0x55d398326f99059fF775485246999027B3197955"; // BSC主网USDT
            console.log("   USDC 地址:", USDC_ADDRESS);
            console.log("   USDT 地址:", USDT_ADDRESS);
            console.log("   添加数量:", `${usdcAmount} USDC + ${usdtAmount} USDT`);
            console.log("   滑点容忍度:", `${slippagePercent}%`);
            // 解析代币数量 (BSC上的USDC和USDT都是18位小数)
            const usdcAmountParsed = (0, viem_1.parseUnits)(usdcAmount, 18);
            const usdtAmountParsed = (0, viem_1.parseUnits)(usdtAmount, 18);
            // 计算最小数量 (考虑滑点)
            const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100));
            const usdcAmountMin = (usdcAmountParsed * slippageMultiplier) / BigInt(10000);
            const usdtAmountMin = (usdtAmountParsed * slippageMultiplier) / BigInt(10000);
            console.log("   最小 USDC:", usdcAmountMin.toString());
            console.log("   最小 USDT:", usdtAmountMin.toString());
            // 批准代币支出
            console.log("\n📝 批准代币支出...");
            yield approveTokenIfNeeded(USDC_ADDRESS, routerAddress, usdcAmountParsed);
            yield approveTokenIfNeeded(USDT_ADDRESS, routerAddress, usdtAmountParsed);
            // 设置截止时间 (30分钟后)
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
            console.log("\n🔄 执行添加流动性交易...");
            // 模拟交易
            const { request } = yield publicClient.simulateContract({
                address: routerAddress,
                abi: PANCAKE_ROUTER_ABI,
                functionName: "addLiquidity",
                args: [
                    USDC_ADDRESS,
                    USDT_ADDRESS,
                    usdcAmountParsed,
                    usdtAmountParsed,
                    usdcAmountMin,
                    usdtAmountMin,
                    account.address,
                    deadline
                ],
                account
            });
            // 发送交易
            const txHash = yield walletClient.writeContract(request);
            console.log("✅ 交易已发送! 哈希:", txHash);
            // 等待确认
            const receipt = yield publicClient.waitForTransactionReceipt({
                hash: txHash
            });
            console.log("🎉 流动性添加成功! 区块:", receipt.blockNumber);
            return txHash;
        }
        catch (error) {
            console.error("❌ 添加流动性失败:", error);
            throw error;
        }
    });
}
/**
 * 添加 BNB-USDC 流动性
 * @param {string} bnbAmount - BNB 数量 (如 "0.1")
 * @param {string} usdcAmount - USDC 数量 (如 "30.0")
 * @param {number} slippagePercent - 滑点容忍度百分比
 * @returns {Promise<string>} - 交易哈希
 */
function addLiquidityBNBUSDC() {
    return __awaiter(this, arguments, void 0, function* (bnbAmount = "0.1", usdcAmount = "30.0", slippagePercent = 0.5) {
        try {
            console.log("🏊‍♂️ 开始添加 BNB-USDC 流动性到 PancakeSwap V2");
            const USDC_ADDRESS = MODE === "dev"
                ? "0x64544969ed7EBf5f083679233325356EbE738930"
                : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
            const bnbAmountParsed = (0, viem_1.parseUnits)(bnbAmount, 18);
            const usdcAmountParsed = (0, viem_1.parseUnits)(usdcAmount, 18);
            const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100));
            const bnbAmountMin = (bnbAmountParsed * slippageMultiplier) / BigInt(10000);
            const usdcAmountMin = (usdcAmountParsed * slippageMultiplier) / BigInt(10000);
            console.log("   添加数量:", `${bnbAmount} BNB + ${usdcAmount} USDC`);
            // 只需要批准 USDC (BNB 是原生代币)
            yield approveTokenIfNeeded(USDC_ADDRESS, routerAddress, usdcAmountParsed);
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
            const { request } = yield publicClient.simulateContract({
                address: routerAddress,
                abi: PANCAKE_ROUTER_ABI,
                functionName: "addLiquidityETH",
                args: [
                    USDC_ADDRESS,
                    usdcAmountParsed,
                    usdcAmountMin,
                    bnbAmountMin,
                    account.address,
                    deadline
                ],
                value: bnbAmountParsed,
                account
            });
            const txHash = yield walletClient.writeContract(request);
            console.log("✅ BNB-USDC 流动性添加交易已发送:", txHash);
            yield publicClient.waitForTransactionReceipt({
                hash: txHash
            });
            console.log("🎉 BNB-USDC 流动性添加成功!");
            return txHash;
        }
        catch (error) {
            console.error("❌ 添加 BNB-USDC 流动性失败:", error);
            throw error;
        }
    });
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function approveTokenIfNeeded(tokenAddress, spender, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 检查当前批准额度
            const allowanceResult = yield publicClient.readContract({
                address: tokenAddress,
                abi: minimalERC20Abi,
                functionName: 'allowance',
                args: [account.address, spender],
            });
            const currentAllowance = BigInt((allowanceResult === null || allowanceResult === void 0 ? void 0 : allowanceResult.toString()) || '0');
            console.log(`   当前批准额度 ${tokenAddress.slice(0, 8)}...：${currentAllowance.toString()}`);
            if (currentAllowance < amount) {
                console.log(`   需要批准 ${tokenAddress.slice(0, 8)}... 支出，当前额度不足`);
                // 批准 2倍数量以减少未来的批准交易
                const approveAmount = amount * BigInt(2);
                const { request } = yield publicClient.simulateContract({
                    address: tokenAddress,
                    abi: minimalERC20Abi,
                    functionName: 'approve',
                    args: [spender, approveAmount],
                    account
                });
                const txHash = yield walletClient.writeContract(request);
                console.log(`   ✅ 批准交易哈希: ${txHash}`);
                // 等待批准交易确认
                yield publicClient.waitForTransactionReceipt({
                    hash: txHash
                });
                console.log(`   ✅ ${tokenAddress.slice(0, 8)}... 批准成功`);
                // 短暂等待确保链状态更新
                yield sleep(2000);
            }
            else {
                console.log(`   ✅ ${tokenAddress.slice(0, 8)}... 批准额度充足，无需重新批准`);
            }
        }
        catch (error) {
            console.error(`   ❌ 批准 ${tokenAddress} 失败:`, error);
            throw error;
        }
    });
}
