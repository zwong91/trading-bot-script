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
exports.swapAnyTokens = swapAnyTokens;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const sdk_core_1 = require("@traderjoe-xyz/sdk-core");
const sdk_v2_1 = require("@traderjoe-xyz/sdk-v2");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const accounts_1 = require("viem/accounts");
const pancakeswap_trade_1 = require("./pancakeswap-trade");
const const_1 = require("./const");
// Minimal ERC-20 ABI
const minimalERC20Abi = [
    {
        "type": "function",
        "stateMutability": "view",
        "outputs": [
            { "type": "uint256" }
        ],
        "name": "allowance",
        "inputs": [
            { "type": "address", "name": "owner" },
            { "type": "address", "name": "spender" }
        ]
    },
    {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [],
        "name": "approve",
        "inputs": [
            { "type": "address", "name": "spender" },
            { "type": "uint256", "name": "amount" }
        ]
    }
];
// You can place approveTokenIfNeeded here or import it from another file:
function approveTokenIfNeeded(publicClient, walletClient, tokenAddress, spender, amount, account) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check current allowance
        const allowanceResult = yield publicClient.readContract({
            address: tokenAddress,
            abi: minimalERC20Abi,
            functionName: "allowance",
            args: [account.address, spender],
        });
        const currentAllowance = BigInt((allowanceResult === null || allowanceResult === void 0 ? void 0 : allowanceResult.toString()) || "0");
        console.log(`Current Allowance for ${tokenAddress}: ${currentAllowance.toString()}`);
        // If not enough allowance, approve
        if (currentAllowance < amount) {
            console.log(`Allowance for token ${tokenAddress} is too low (${currentAllowance}). Approving...`);
            const { request } = yield publicClient.simulateContract({
                address: tokenAddress,
                abi: minimalERC20Abi,
                functionName: "approve",
                args: [spender, amount],
                // This is key: specifying the account for simulation ensures
                // the "from" address isn't zero during simulation
                account,
            });
            const txHash = yield walletClient.writeContract(request);
            console.log(`Approve TX: ${txHash}`);
            // Wait for confirm
            yield publicClient.waitForTransactionReceipt({ hash: txHash });
            console.log("Approval confirmed.");
        }
        else {
            console.log(`Sufficient allowance for token ${tokenAddress}. No approval needed.`);
        }
    });
}
/**
 * swapAnyTokens swaps an exact amount of tokenIn (given by symbolIn) for tokenOut (symbolOut)
 * using the configured router (TraderJoe or PancakeSwap depending on network and availability)
 *
 * @param {string} symbolIn  e.g. "USDC", "USDT", "WBNB", or "BNB"
 * @param {string} symbolOut e.g. "USDC", "USDT", "WBNB", or "BNB"
 * @param {string} amountIn  The amount (as a decimal string, e.g. "5")
 * @returns {Promise<string>} the swap transaction hash.
 */
function swapAnyTokens(symbolIn, symbolOut, amountIn) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Add validation at the start
            console.log("Starting swap with:", { symbolIn, symbolOut, amountIn }); // Debug log
            if (!symbolIn || !symbolOut || !amountIn) {
                throw new Error("Missing required parameters");
            }
            // Validate token symbols for BSC
            const validTokens = ['USDC', 'USDT', 'WBNB', 'BNB'];
            if (!validTokens.includes(symbolIn) || !validTokens.includes(symbolOut)) {
                throw new Error(`Invalid token symbols. Must be one of: ${validTokens.join(', ')}`);
            }
            // Setup: load private key and create clients.
            const privateKey = process.env.PRIVATE_KEY;
            if (!privateKey)
                throw new Error("PRIVATE_KEY not set.");
            const account = (0, accounts_1.privateKeyToAccount)(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
            const MODE = process.env.MODE;
            const chain = MODE === "dev" ? chains_1.bscTestnet : chains_1.bsc;
            const CHAIN_ID = MODE === "dev" ? sdk_core_1.ChainId.BNB_TESTNET : sdk_core_1.ChainId.BNB_CHAIN;
            // Use the router from configuration
            const routerAddress = (const_1.routerConfig === null || const_1.routerConfig === void 0 ? void 0 : const_1.routerConfig.address) || (MODE === "dev"
                ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // PancakeSwap BSC testnet
                : "0x10ED43C718714eb63d5aA57B78B54704E256024E"); // PancakeSwap BSC mainnet
            const publicClient = (0, viem_1.createPublicClient)({
                chain: chain,
                transport: (0, viem_1.http)(),
            });
            const walletClient = (0, viem_1.createWalletClient)({
                account,
                chain: chain,
                transport: (0, viem_1.http)(),
            });
            // Define known tokens for BSC
            const TOKENS = {
                USDC: new sdk_core_1.Token(CHAIN_ID, MODE === "dev"
                    ? "0x64544969ed7EBf5f083679233325356EbE738930" // BSC testnet USDC
                    : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC mainnet USDC
                18, "USDC", "USD Coin"),
                USDT: new sdk_core_1.Token(CHAIN_ID, MODE === "dev"
                    ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" // BSC testnet USDT
                    : "0x55d398326f99059fF775485246999027B3197955", // BSC mainnet USDT
                18, "USDT", "Tether USD"),
                WBNB: sdk_core_1.WNATIVE[CHAIN_ID],
                BNB: sdk_core_1.WNATIVE[CHAIN_ID], // BNB and WBNB are the same for routing
            };
            let isNativeIn = false, isNativeOut = false;
            let tokenIn, tokenOut;
            if (symbolIn === "BNB") {
                isNativeIn = true;
                tokenIn = TOKENS.WBNB; // Use WBNB for routing
            }
            else {
                tokenIn = TOKENS[symbolIn];
                if (!tokenIn)
                    throw new Error(`Unknown token: ${symbolIn}`);
            }
            if (symbolOut === "BNB") {
                isNativeOut = true;
                tokenOut = TOKENS.WBNB; // Use WBNB for routing
            }
            else {
                tokenOut = TOKENS[symbolOut];
                if (!tokenOut)
                    throw new Error(`Unknown token: ${symbolOut}`);
            }
            if (symbolIn === symbolOut || (symbolIn === "BNB" && symbolOut === "WBNB") || (symbolIn === "WBNB" && symbolOut === "BNB")) {
                throw new Error("Input and output tokens must differ.");
            }
            // Parse amountIn
            const typedValueInParsed = (0, viem_1.parseUnits)(amountIn, tokenIn.decimals);
            // Check if we should use PancakeSwap or TraderJoe
            if ((const_1.routerConfig === null || const_1.routerConfig === void 0 ? void 0 : const_1.routerConfig.type) === "pancakeswap") {
                console.log("🥞 Using PancakeSwap for swap");
                // Use PancakeSwap logic
                const pancakeRoute = (0, pancakeswap_trade_1.getPancakeSwapRoute)({
                    amount: amountIn,
                    inputToken: tokenIn,
                    outputToken: tokenOut,
                    isNativeIn,
                    isNativeOut,
                });
                yield (0, pancakeswap_trade_1.tradePancakeSwap)(walletClient, pancakeRoute, routerAddress);
                return "PancakeSwap transaction completed"; // PancakeSwap function doesn't return hash directly
            }
            else {
                console.log("🎯 Using TraderJoe for swap");
                // Approve if needed (only if tokenIn is not native)
                if (!isNativeIn) {
                    yield approveTokenIfNeeded(publicClient, walletClient, tokenIn.address, // tokenAddress
                    routerAddress, // spender
                    typedValueInParsed, account);
                }
                const amountInToken = new sdk_core_1.TokenAmount(tokenIn, typedValueInParsed);
                // Build routes
                const BASES = [TOKENS.WBNB, TOKENS.USDC, TOKENS.USDT];
                const allTokenPairs = sdk_v2_1.PairV2.createAllTokenPairs(tokenIn, tokenOut, BASES);
                const allPairs = sdk_v2_1.PairV2.initPairs(allTokenPairs);
                const allRoutes = sdk_v2_1.RouteV2.createAllRoutes(allPairs, tokenIn, tokenOut);
                // Create trades
                const trades = yield sdk_v2_1.TradeV2.getTradesExactIn(allRoutes, amountInToken, tokenOut, isNativeIn, isNativeOut, publicClient, CHAIN_ID);
                // Filter out undefined trades
                const validTrades = trades.filter((trade) => trade !== undefined);
                const bestTrade = sdk_v2_1.TradeV2.chooseBestTrade(validTrades, true);
                if (!bestTrade) {
                    throw new Error("No valid trade found");
                }
                console.log("Best trade log:", bestTrade.toLog());
                // Slippage tolerance, swap call parameters
                const userSlippageTolerance = new sdk_core_1.Percent("50", "10000"); // 0.5%
                const swapOptions = {
                    allowedSlippage: userSlippageTolerance,
                    ttl: 3600,
                    recipient: account.address,
                    feeOnTransfer: false,
                };
                const { methodName, args, value } = bestTrade.swapCallParameters(swapOptions);
                // Simulate the swap call (now with account specified!)
                const { request: swapRequest } = yield publicClient.simulateContract({
                    address: routerAddress,
                    abi: sdk_v2_1.jsonAbis.LBRouterV21ABI,
                    functionName: methodName,
                    args,
                    value: BigInt(value),
                    account, // Important so the "from" is set for simulation
                });
                // Sign and send the swap
                const txHash = yield walletClient.writeContract(swapRequest);
                console.log("Swap TX sent:", txHash);
                const swapReceipt = yield publicClient.waitForTransactionReceipt({ hash: txHash });
                console.log("Swap confirmed in block:", swapReceipt.blockNumber);
                return txHash;
            }
        }
        catch (err) {
            console.error("Error swapping tokens:", err);
            throw err;
        }
    });
}
