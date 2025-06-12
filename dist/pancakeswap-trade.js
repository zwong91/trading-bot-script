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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPancakeSwapRoute = getPancakeSwapRoute;
exports.tradePancakeSwap = tradePancakeSwap;
const viem_1 = require("viem");
const const_1 = require("./const");
const utils_1 = require("./utils");
const fs_1 = __importDefault(require("./fs"));
const database_1 = require("./database");
// ERC20 ABI for approval
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
    }
];
// PancakeSwap V2 Router ABI
const PANCAKE_ROUTER_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactTokensForTokens",
        "outputs": [
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactETHForTokens",
        "outputs": [
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactTokensForETH",
        "outputs": [
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
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
function getPancakeSwapRoute(routeParams) {
    try {
        const { amount, inputToken, outputToken, isNativeIn, isNativeOut } = routeParams;
        // 解析输入金额
        const amountIn = (0, viem_1.parseUnits)(amount, inputToken.decimals);
        // 构建交易路径
        const path = [];
        if (isNativeIn) {
            // BNB -> Token: [WBNB, Token]
            path.push(inputToken.address);
            path.push(outputToken.address);
        }
        else if (isNativeOut) {
            // Token -> BNB: [Token, WBNB]
            path.push(inputToken.address);
            path.push(outputToken.address);
        }
        else {
            // Token -> Token: [TokenA, TokenB] 或 [TokenA, WBNB, TokenB]
            if (inputToken.address.toLowerCase() !== outputToken.address.toLowerCase()) {
                path.push(inputToken.address);
                path.push(outputToken.address);
            }
            else {
                throw new Error("Input and output tokens cannot be the same");
            }
        }
        console.log("🛣️ PancakeSwap 路径:", path);
        console.log("💰 输入金额:", amount, inputToken.symbol);
        return {
            amountIn,
            inputToken,
            outputToken,
            isNativeIn,
            isNativeOut,
            path,
            expectedAmountOut: BigInt(0) // 将在交易前获取实际报价
        };
    }
    catch (error) {
        console.error("❌ PancakeSwap 路径生成失败:", error);
        throw new Error("Error generating PancakeSwap route");
    }
}
function tradePancakeSwap(walletClient, route, routerAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const account = walletClient.account;
            const { amountIn, inputToken, outputToken, isNativeIn, isNativeOut, path } = route;
            console.log("🥞 执行 PancakeSwap 交易:");
            console.log("   路由器:", routerAddress);
            console.log("   输入:", inputToken.symbol, "->", outputToken.symbol);
            // 如果不是原生代币输入，需要先批准代币支出
            if (!isNativeIn) {
                yield approveTokenIfNeeded(walletClient, inputToken.address, routerAddress, amountIn);
            }
            // 获取预期输出金额
            const amountsOut = yield const_1.publicClient.readContract({
                address: routerAddress,
                abi: PANCAKE_ROUTER_ABI,
                functionName: "getAmountsOut",
                args: [amountIn, path]
            });
            const expectedAmountOut = amountsOut[amountsOut.length - 1];
            const slippageTolerance = 0.005; // 0.5% 滑点
            const amountOutMin = expectedAmountOut * BigInt(Math.floor((1 - slippageTolerance) * 10000)) / BigInt(10000);
            console.log("   预期输出:", expectedAmountOut.toString());
            console.log("   最小输出:", amountOutMin.toString());
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes
            let nonce = yield (0, utils_1.getNonce)(account.address);
            let hash;
            if (isNativeIn) {
                // BNB -> Token
                const { request } = yield const_1.publicClient.simulateContract({
                    address: routerAddress,
                    abi: PANCAKE_ROUTER_ABI,
                    functionName: "swapExactETHForTokens",
                    args: [amountOutMin, path, account.address, deadline],
                    account,
                    value: amountIn,
                    nonce,
                });
                hash = yield walletClient.writeContract(request);
            }
            else if (isNativeOut) {
                // Token -> BNB
                const { request } = yield const_1.publicClient.simulateContract({
                    address: routerAddress,
                    abi: PANCAKE_ROUTER_ABI,
                    functionName: "swapExactTokensForETH",
                    args: [amountIn, amountOutMin, path, account.address, deadline],
                    account,
                    nonce,
                });
                hash = yield walletClient.writeContract(request);
            }
            else {
                // Token -> Token
                const { request } = yield const_1.publicClient.simulateContract({
                    address: routerAddress,
                    abi: PANCAKE_ROUTER_ABI,
                    functionName: "swapExactTokensForTokens",
                    args: [amountIn, amountOutMin, path, account.address, deadline],
                    account,
                    nonce,
                });
                hash = yield walletClient.writeContract(request);
            }
            // 计算实际输出金额用于显示
            const actualAmountOut = expectedAmountOut;
            const actualAmountOutFormatted = (Number(actualAmountOut) / Math.pow(10, outputToken.decimals)).toFixed(6);
            const amountInFormatted = (Number(amountIn) / Math.pow(10, inputToken.decimals)).toFixed(6);
            let txn_data = [
                hash,
                account.address,
                inputToken.symbol,
                outputToken.symbol,
                amountInFormatted,
                actualAmountOutFormatted,
                (0, utils_1.getUnixTime)(),
            ];
            (0, fs_1.default)(`${trim(account.address)} PancakeSwap Swap ${amountInFormatted} ${inputToken.symbol} for ${actualAmountOutFormatted} ${outputToken.symbol} \nTransaction sent with hash ${hash} \n\n`);
            yield (0, database_1.insertDB)(database_1.txn_sql, txn_data);
            yield const_1.publicClient.waitForTransactionReceipt({ hash: hash });
        }
        catch (error) {
            (0, fs_1.default)(`PancakeSwap 交易失败: ${error} \n\n`);
            throw new Error("Error executing PancakeSwap trade");
        }
    });
}
// 检查并批准代币支出
function approveTokenIfNeeded(walletClient, tokenAddress, spenderAddress, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const account = walletClient.account;
            // 检查当前批准额度
            const currentAllowance = yield const_1.publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: "allowance",
                args: [account.address, spenderAddress]
            });
            console.log("   当前批准额度:", currentAllowance.toString());
            console.log("   需要额度:", amount.toString());
            // 如果当前批准额度不足，进行批准
            if (currentAllowance < amount) {
                console.log("   📝 批准代币支出...");
                const nonce = yield (0, utils_1.getNonce)(account.address);
                const { request } = yield const_1.publicClient.simulateContract({
                    address: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "approve",
                    args: [spenderAddress, amount * BigInt(2)], // 批准2倍金额以避免频繁批准
                    account,
                    nonce,
                });
                const approveHash = yield walletClient.writeContract(request);
                console.log("   ✅ 批准交易哈希:", approveHash);
                // 等待批准交易确认
                yield const_1.publicClient.waitForTransactionReceipt({ hash: approveHash });
                console.log("   ✅ 代币批准成功");
            }
            else {
                console.log("   ✅ 批准额度充足，无需重新批准");
            }
        }
        catch (error) {
            console.error("   ❌ 代币批准失败:", error);
            throw new Error("Token approval failed");
        }
    });
}
function trim(address, startLength = 7, endLength = 5) {
    const truncatedStart = address.slice(0, startLength);
    const truncatedEnd = address.slice(-endLength);
    return truncatedStart + "..." + truncatedEnd;
}
