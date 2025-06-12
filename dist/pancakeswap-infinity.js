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
exports.swapWithPancakeInfinity = swapWithPancakeInfinity;
exports.getBestPriceQuote = getBestPriceQuote;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const accounts_1 = require("viem/accounts");
const dotenv_1 = require("dotenv");
const router_selector_1 = require("./router-selector");
(0, dotenv_1.config)();
const MODE = process.env.MODE || "dev";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment variables");
}
const account = (0, accounts_1.privateKeyToAccount)(`0x${PRIVATE_KEY}`);
const chain = MODE === "dev" ? chains_1.bscTestnet : chains_1.bsc;
const config_network = MODE === "dev" ? router_selector_1.PANCAKE_INFINITY_CONFIG.testnet : router_selector_1.PANCAKE_INFINITY_CONFIG.mainnet;
const publicClient = (0, viem_1.createPublicClient)({
    chain,
    transport: (0, viem_1.http)()
});
const walletClient = (0, viem_1.createWalletClient)({
    account,
    chain,
    transport: (0, viem_1.http)()
});
// PancakeSwap Infinity Router ABI
const INFINITY_ROUTER_ABI = [
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "address", "name": "tokenIn", "type": "address" },
                    { "internalType": "address", "name": "tokenOut", "type": "address" },
                    { "internalType": "uint24", "name": "fee", "type": "uint24" },
                    { "internalType": "address", "name": "recipient", "type": "address" },
                    { "internalType": "uint256", "name": "deadline", "type": "uint256" },
                    { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                    { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
                    { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
                ],
                "internalType": "struct ISwapRouter.ExactInputSingleParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "exactInputSingle",
        "outputs": [
            { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "tokenIn", "type": "address" },
            { "internalType": "address", "name": "tokenOut", "type": "address" },
            { "internalType": "uint24", "name": "fee", "type": "uint24" },
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
        ],
        "name": "quoteExactInputSingle",
        "outputs": [
            { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
// ERC20 ABI for approvals
const ERC20_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    }
];
/**
 * PancakeSwap Infinity 交易函数
 * @param tokenInAddress 输入代币地址
 * @param tokenOutAddress 输出代币地址
 * @param amountIn 输入金额 (最小单位)
 * @param slippagePercent 滑点百分比 (例如: 0.5 = 0.5%)
 * @returns 交易哈希
 */
function swapWithPancakeInfinity(tokenInAddress_1, tokenOutAddress_1, amountIn_1) {
    return __awaiter(this, arguments, void 0, function* (tokenInAddress, tokenOutAddress, amountIn, slippagePercent = 0.5) {
        try {
            console.log("🚀 使用 PancakeSwap Infinity 进行交易");
            console.log("=".repeat(50));
            // 1. 获取代币信息
            const tokenInDecimals = yield publicClient.readContract({
                address: tokenInAddress,
                abi: ERC20_ABI,
                functionName: "decimals"
            });
            const tokenOutDecimals = yield publicClient.readContract({
                address: tokenOutAddress,
                abi: ERC20_ABI,
                functionName: "decimals"
            });
            console.log(`📊 输入代币精度: ${tokenInDecimals}`);
            console.log(`📊 输出代币精度: ${tokenOutDecimals}`);
            console.log(`💰 输入金额: ${(0, viem_1.formatUnits)(amountIn, tokenInDecimals)} tokens`);
            // 2. 检查并批准代币
            yield approveTokenIfNeeded(tokenInAddress, config_network.router, amountIn);
            // 3. 获取价格报价 (使用3000基点的手续费池，这是最常见的)
            const fee = 3000; // 0.3% fee tier
            let quote;
            try {
                quote = yield publicClient.readContract({
                    address: config_network.quoter,
                    abi: INFINITY_ROUTER_ABI,
                    functionName: "quoteExactInputSingle",
                    args: [
                        tokenInAddress,
                        tokenOutAddress,
                        fee,
                        amountIn
                    ]
                });
                console.log(`💸 预期输出: ${(0, viem_1.formatUnits)(quote, tokenOutDecimals)} tokens`);
            }
            catch (quoteError) {
                console.log("⚠️ 无法获取精确报价，使用估算值");
                quote = amountIn; // 使用输入金额作为估算
            }
            // 4. 计算最小输出金额 (考虑滑点)
            const amountOutMinimum = (quote * BigInt(Math.floor((100 - slippagePercent) * 100))) / BigInt(10000);
            console.log(`🛡️ 最小输出金额: ${(0, viem_1.formatUnits)(amountOutMinimum, tokenOutDecimals)} tokens (${slippagePercent}% 滑点保护)`);
            // 5. 准备交易参数
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30分钟后过期
            const swapParams = {
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                fee: fee,
                recipient: account.address,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: BigInt(0) // 0 表示无价格限制
            };
            console.log("📝 交易参数:");
            console.log(`   路由器: ${config_network.router}`);
            console.log(`   手续费层级: ${fee / 10000}%`);
            console.log(`   截止时间: ${new Date(Number(deadline) * 1000).toLocaleString()}`);
            // 6. 模拟交易
            const { request } = yield publicClient.simulateContract({
                address: config_network.router,
                abi: INFINITY_ROUTER_ABI,
                functionName: "exactInputSingle",
                args: [swapParams],
                account,
                value: tokenInAddress.toLowerCase() === config_network.weth.toLowerCase() ? amountIn : BigInt(0)
            });
            // 7. 执行交易
            console.log("🚀 发送交易到区块链...");
            const txHash = yield walletClient.writeContract(request);
            console.log(`✅ 交易已发送: ${txHash}`);
            // 8. 等待确认
            console.log("⏳ 等待交易确认...");
            const receipt = yield publicClient.waitForTransactionReceipt({
                hash: txHash
            });
            console.log(`🎉 交易成功确认!`);
            console.log(`   区块号: ${receipt.blockNumber}`);
            console.log(`   Gas 使用量: ${receipt.gasUsed}`);
            console.log("=".repeat(50));
            return txHash;
        }
        catch (error) {
            console.error("❌ PancakeSwap Infinity 交易失败:", error);
            throw error;
        }
    });
}
function approveTokenIfNeeded(tokenAddress, spenderAddress, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentAllowance = yield publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [account.address, spenderAddress]
        });
        if (currentAllowance < amount) {
            console.log(`🔓 批准代币使用权限...`);
            const { request } = yield publicClient.simulateContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [spenderAddress, amount],
                account
            });
            const approvalHash = yield walletClient.writeContract(request);
            console.log(`✅ 批准交易: ${approvalHash}`);
            yield publicClient.waitForTransactionReceipt({
                hash: approvalHash
            });
            console.log("✅ 批准完成");
        }
        else {
            console.log("✅ 代币已获得足够的使用权限");
        }
    });
}
/**
 * 获取最佳交易路径和价格
 */
function getBestPriceQuote(tokenInAddress, tokenOutAddress, amountIn) {
    return __awaiter(this, void 0, void 0, function* () {
        const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
        let bestQuote = { amountOut: BigInt(0), fee: 3000, impact: 100 };
        for (const fee of feeTiers) {
            try {
                const quote = yield publicClient.readContract({
                    address: config_network.quoter,
                    abi: INFINITY_ROUTER_ABI,
                    functionName: "quoteExactInputSingle",
                    args: [
                        tokenInAddress,
                        tokenOutAddress,
                        fee,
                        amountIn
                    ]
                });
                if (quote > bestQuote.amountOut) {
                    bestQuote = {
                        amountOut: quote,
                        fee: fee,
                        impact: 0 // 简化版，实际需要计算价格影响
                    };
                }
            }
            catch (error) {
                console.log(`⚠️ 手续费层级 ${fee / 10000}% 无可用流动性`);
            }
        }
        return bestQuote;
    });
}
