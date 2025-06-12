import { config } from "dotenv";
config();

import {
    ChainId,
    WNATIVE,
    Token,
    TokenAmount,
    Percent,
} from "@lb-xyz/sdk-core";

import {
    PairV2,
    RouteV2,
    TradeV2,
    LB_ROUTER_V22_ADDRESS,
    jsonAbis,
} from "@lb-xyz/sdk-v2";

import {
    createPublicClient,
    createWalletClient,
    parseUnits,
    http,
} from "viem";
import { bsc, bscTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { getPancakeSwapRoute, tradePancakeSwap } from "./pancakeswap-trade";
import { routerConfig } from "./const";

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
] as const;

// You can place approveTokenIfNeeded here or import it from another file:
async function approveTokenIfNeeded(
    publicClient: any,
    walletClient: any,
    tokenAddress: string,
    spender: string,
    amount: bigint,
    account: any
) {
    // Check current allowance
    const allowanceResult = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: minimalERC20Abi,
        functionName: "allowance",
        args: [account.address, spender as `0x${string}`],
    });

    const currentAllowance = BigInt(allowanceResult?.toString() || "0");
    console.log(`Current Allowance for ${tokenAddress}: ${currentAllowance.toString()}`);

    // If not enough allowance, approve
    if (currentAllowance < amount) {
        console.log(
            `Allowance for token ${tokenAddress} is too low (${currentAllowance}). Approving...`
        );

        const { request } = await publicClient.simulateContract({
            address: tokenAddress as `0x${string}`,
            abi: minimalERC20Abi,
            functionName: "approve",
            args: [spender as `0x${string}`, amount],
            // This is key: specifying the account for simulation ensures
            // the "from" address isn't zero during simulation
            account,
        });

        const txHash = await walletClient.writeContract(request);
        console.log(`Approve TX: ${txHash}`);

        // Wait for confirm
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log("Approval confirmed.");
    } else {
        console.log(`Sufficient allowance for token ${tokenAddress}. No approval needed.`);
    }
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
export async function swapAnyTokens(symbolIn: string, symbolOut: string, amountIn: string): Promise<string> {
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
        if (!privateKey) throw new Error("PRIVATE_KEY not set.");

        const account = privateKeyToAccount(
            privateKey.startsWith("0x") ? privateKey as `0x${string}` : `0x${privateKey}` as `0x${string}`
        );

        const MODE = process.env.MODE;
        const chain = MODE === "dev" ? bscTestnet : bsc;
        const CHAIN_ID = MODE === "dev" ? ChainId.BNB_TESTNET : ChainId.BNB_CHAIN;

        // Use the router from configuration
        const routerAddress = routerConfig?.address || (MODE === "dev" 
            ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // PancakeSwap BSC testnet
            : "0x10ED43C718714eb63d5aA57B78B54704E256024E"); // PancakeSwap BSC mainnet

        const publicClient = createPublicClient({
            chain: chain,
            transport: http(),
        });
        const walletClient = createWalletClient({
            account,
            chain: chain,
            transport: http(),
        });

        // Define known tokens for BSC
        const TOKENS = {
            USDC: new Token(
                CHAIN_ID,
                MODE === "dev"
                    ? "0x64544969ed7EBf5f083679233325356EbE738930" // BSC testnet USDC
                    : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC mainnet USDC
                18,
                "USDC",
                "USD Coin"
            ),
            USDT: new Token(
                CHAIN_ID,
                MODE === "dev"
                    ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" // BSC testnet USDT
                    : "0x55d398326f99059fF775485246999027B3197955", // BSC mainnet USDT
                18,
                "USDT",
                "Tether USD"
            ),
            WBNB: WNATIVE[CHAIN_ID],
            BNB: WNATIVE[CHAIN_ID], // BNB and WBNB are the same for routing
        };

        let isNativeIn = false,
            isNativeOut = false;
        let tokenIn: Token, tokenOut: Token;

        if (symbolIn === "BNB") {
            isNativeIn = true;
            tokenIn = TOKENS.WBNB; // Use WBNB for routing
        } else {
            tokenIn = TOKENS[symbolIn as keyof typeof TOKENS];
            if (!tokenIn) throw new Error(`Unknown token: ${symbolIn}`);
        }

        if (symbolOut === "BNB") {
            isNativeOut = true;
            tokenOut = TOKENS.WBNB; // Use WBNB for routing
        } else {
            tokenOut = TOKENS[symbolOut as keyof typeof TOKENS];
            if (!tokenOut) throw new Error(`Unknown token: ${symbolOut}`);
        }

        if (symbolIn === symbolOut || (symbolIn === "BNB" && symbolOut === "WBNB") || (symbolIn === "WBNB" && symbolOut === "BNB")) {
            throw new Error("Input and output tokens must differ.");
        }

        // Parse amountIn
        const typedValueInParsed = parseUnits(amountIn, tokenIn.decimals);

        // Check if we should use PancakeSwap or TraderJoe
        if (routerConfig?.type === "pancakeswap") {
            console.log("🥞 Using PancakeSwap for swap");
            
            // Use PancakeSwap logic
            const pancakeRoute = getPancakeSwapRoute({
                amount: amountIn,
                inputToken: tokenIn,
                outputToken: tokenOut,
                isNativeIn,
                isNativeOut,
            });

            await tradePancakeSwap(walletClient, pancakeRoute, routerAddress);
            return "PancakeSwap transaction completed"; // PancakeSwap function doesn't return hash directly
        } else {
            console.log("🎯 Using TraderJoe for swap");
            
            // Approve if needed (only if tokenIn is not native)
            if (!isNativeIn) {
                await approveTokenIfNeeded(
                    publicClient,
                    walletClient,
                    tokenIn.address,   // tokenAddress
                    routerAddress,     // spender
                    typedValueInParsed,
                    account
                );
            }

            const amountInToken = new TokenAmount(tokenIn, typedValueInParsed);

            // Build routes
            const BASES = [TOKENS.WBNB, TOKENS.USDC, TOKENS.USDT];
            const allTokenPairs = PairV2.createAllTokenPairs(tokenIn, tokenOut, BASES);
            const allPairs = PairV2.initPairs(allTokenPairs);
            const allRoutes = RouteV2.createAllRoutes(allPairs, tokenIn, tokenOut);

            // Create trades
            const trades = await TradeV2.getTradesExactIn(
                allRoutes,
                amountInToken,
                tokenOut,
                isNativeIn,
                isNativeOut,
                publicClient,
                CHAIN_ID
            );
            
            // Filter out undefined trades
            const validTrades = trades.filter((trade): trade is TradeV2 => trade !== undefined);
            const bestTrade = TradeV2.chooseBestTrade(validTrades, true);
            
            if (!bestTrade) {
                throw new Error("No valid trade found");
            }
            
            console.log("Best trade log:", bestTrade.toLog());

            // Slippage tolerance, swap call parameters
            const userSlippageTolerance = new Percent("50", "10000"); // 0.5%
            const swapOptions = {
                allowedSlippage: userSlippageTolerance,
                ttl: 3600,
                recipient: account.address,
                feeOnTransfer: false,
            };
            const { methodName, args, value } = bestTrade.swapCallParameters(swapOptions);

            // Simulate the swap call (now with account specified!)
            const { request: swapRequest } = await publicClient.simulateContract({
                address: routerAddress as `0x${string}`,
                abi: jsonAbis.LBRouterV22ABI,
                functionName: methodName,
                args,
                value: BigInt(value),
                account, // Important so the "from" is set for simulation
            });

            // Sign and send the swap
            const txHash = await walletClient.writeContract(swapRequest);
            console.log("Swap TX sent:", txHash);
            const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            console.log("Swap confirmed in block:", swapReceipt.blockNumber);

            return txHash;
        }
    } catch (err) {
        console.error("Error swapping tokens:", err);
        throw err;
    }
}
