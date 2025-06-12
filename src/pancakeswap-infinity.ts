import {
    createPublicClient,
    createWalletClient,
    http,
    parseUnits,
    formatUnits,
    encodeFunctionData
} from "viem";
import { bsc, bscTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
import { PANCAKE_INFINITY_CONFIG } from "./router-selector";

config();

const MODE = process.env.MODE || "dev";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment variables");
}

const account = privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`);
const chain = MODE === "dev" ? bscTestnet : bsc;
const config_network = MODE === "dev" ? PANCAKE_INFINITY_CONFIG.testnet : PANCAKE_INFINITY_CONFIG.mainnet;

const publicClient = createPublicClient({
    chain,
    transport: http()
});

const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
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
] as const;

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
] as const;

/**
 * PancakeSwap Infinity 交易函数
 * @param tokenInAddress 输入代币地址
 * @param tokenOutAddress 输出代币地址
 * @param amountIn 输入金额 (最小单位)
 * @param slippagePercent 滑点百分比 (例如: 0.5 = 0.5%)
 * @returns 交易哈希
 */
export async function swapWithPancakeInfinity(
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: bigint,
    slippagePercent: number = 0.5
): Promise<string> {
    try {
        console.log("🚀 使用 PancakeSwap Infinity 进行交易");
        console.log("=".repeat(50));
        
        // 1. 获取代币信息
        const tokenInDecimals = await publicClient.readContract({
            address: tokenInAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "decimals"
        });

        const tokenOutDecimals = await publicClient.readContract({
            address: tokenOutAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "decimals"
        });

        console.log(`📊 输入代币精度: ${tokenInDecimals}`);
        console.log(`📊 输出代币精度: ${tokenOutDecimals}`);
        console.log(`💰 输入金额: ${formatUnits(amountIn, tokenInDecimals)} tokens`);

        // 2. 检查并批准代币
        await approveTokenIfNeeded(tokenInAddress, config_network.router, amountIn);

        // 3. 获取价格报价 (使用3000基点的手续费池，这是最常见的)
        const fee = 3000; // 0.3% fee tier
        let quote;
        try {
            quote = await publicClient.readContract({
                address: config_network.quoter as `0x${string}`,
                abi: INFINITY_ROUTER_ABI,
                functionName: "quoteExactInputSingle",
                args: [
                    tokenInAddress as `0x${string}`,
                    tokenOutAddress as `0x${string}`,
                    fee,
                    amountIn
                ]
            });
            console.log(`💸 预期输出: ${formatUnits(quote as bigint, tokenOutDecimals)} tokens`);
        } catch (quoteError) {
            console.log("⚠️ 无法获取精确报价，使用估算值");
            quote = amountIn; // 使用输入金额作为估算
        }

        // 4. 计算最小输出金额 (考虑滑点)
        const amountOutMinimum = (quote as bigint * BigInt(Math.floor((100 - slippagePercent) * 100))) / BigInt(10000);
        console.log(`🛡️ 最小输出金额: ${formatUnits(amountOutMinimum, tokenOutDecimals)} tokens (${slippagePercent}% 滑点保护)`);

        // 5. 准备交易参数
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30分钟后过期
        const swapParams = {
            tokenIn: tokenInAddress as `0x${string}`,
            tokenOut: tokenOutAddress as `0x${string}`,
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
        const { request } = await publicClient.simulateContract({
            address: config_network.router as `0x${string}`,
            abi: INFINITY_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [swapParams],
            account,
            value: tokenInAddress.toLowerCase() === config_network.weth.toLowerCase() ? amountIn : BigInt(0)
        });

        // 7. 执行交易
        console.log("🚀 发送交易到区块链...");
        const txHash = await walletClient.writeContract(request);
        console.log(`✅ 交易已发送: ${txHash}`);

        // 8. 等待确认
        console.log("⏳ 等待交易确认...");
        const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: txHash as `0x${string}` 
        });
        
        console.log(`🎉 交易成功确认!`);
        console.log(`   区块号: ${receipt.blockNumber}`);
        console.log(`   Gas 使用量: ${receipt.gasUsed}`);
        console.log("=".repeat(50));

        return txHash;
    } catch (error) {
        console.error("❌ PancakeSwap Infinity 交易失败:", error);
        throw error;
    }
}

async function approveTokenIfNeeded(tokenAddress: string, spenderAddress: string, amount: bigint) {
    const currentAllowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account.address, spenderAddress as `0x${string}`]
    });

    if ((currentAllowance as bigint) < amount) {
        console.log(`🔓 批准代币使用权限...`);
        const { request } = await publicClient.simulateContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [spenderAddress as `0x${string}`, amount],
            account
        });

        const approvalHash = await walletClient.writeContract(request);
        console.log(`✅ 批准交易: ${approvalHash}`);
        
        await publicClient.waitForTransactionReceipt({ 
            hash: approvalHash as `0x${string}` 
        });
        console.log("✅ 批准完成");
    } else {
        console.log("✅ 代币已获得足够的使用权限");
    }
}

/**
 * 获取最佳交易路径和价格
 */
export async function getBestPriceQuote(
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: bigint
): Promise<{ amountOut: bigint, fee: number, impact: number }> {
    const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
    let bestQuote = { amountOut: BigInt(0), fee: 3000, impact: 100 };

    for (const fee of feeTiers) {
        try {
            const quote = await publicClient.readContract({
                address: config_network.quoter as `0x${string}`,
                abi: INFINITY_ROUTER_ABI,
                functionName: "quoteExactInputSingle",
                args: [
                    tokenInAddress as `0x${string}`,
                    tokenOutAddress as `0x${string}`,
                    fee,
                    amountIn
                ]
            });

            if ((quote as bigint) > bestQuote.amountOut) {
                bestQuote = {
                    amountOut: quote as bigint,
                    fee: fee,
                    impact: 0 // 简化版，实际需要计算价格影响
                };
            }
        } catch (error) {
            console.log(`⚠️ 手续费层级 ${fee / 10000}% 无可用流动性`);
        }
    }

    return bestQuote;
}
