import { Token, TokenAmount } from '@traderjoe-xyz/sdk-core';
import {
    createPublicClient,
    createWalletClient,
    http,
    parseUnits,
    getContract,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc, bscTestnet } from 'viem/chains';
import { config } from 'dotenv';

config(); // Load .env file

if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env file');
}

const MODE = process.env.MODE || 'dev';

// Make sure private key is properly formatted
const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY 
    : `0x${process.env.PRIVATE_KEY}`;

const account = privateKeyToAccount(privateKey as `0x${string}`);

// Chain configuration
const chain = MODE === "dev" ? bscTestnet : bsc;

// Create Viem clients (public and wallet)
const publicClient = createPublicClient({
    chain: chain,
    transport: http()
});

const walletClient = createWalletClient({
    account,
    chain: chain,
    transport: http()
});

// PancakeSwap V2 Router address
const routerAddress = MODE === "dev" 
    ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // BSC测试网
    : "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // BSC主网

// TraderJoe V2.2 Router address
const traderJoeRouterAddress = MODE === "dev"
    ? "0x8FABE13D95F28f7478Dc655d8D4BA99935D50e02" // BSC测试网 TraderJoe V2.2
    : "0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30"; // BSC主网 TraderJoe V2.2

// Chain ID
const CHAIN_ID = MODE === "dev" ? 97 : 56;

// Bin step for TraderJoe V2.2
const BIN_STEP = "1";

// PancakeSwap V2 Router ABI (流动性移除相关方法)
const PANCAKE_ROUTER_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" },
            { "internalType": "uint256", "name": "liquidity", "type": "uint256" },
            { "internalType": "uint256", "name": "amountAMin", "type": "uint256" },
            { "internalType": "uint256", "name": "amountBMin", "type": "uint256" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "removeLiquidity",
        "outputs": [
            { "internalType": "uint256", "name": "amountA", "type": "uint256" },
            { "internalType": "uint256", "name": "amountB", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "uint256", "name": "liquidity", "type": "uint256" },
            { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" },
            { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "removeLiquidityETH",
        "outputs": [
            { "internalType": "uint256", "name": "amountToken", "type": "uint256" },
            { "internalType": "uint256", "name": "amountETH", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

// TraderJoe V2.2 LB Pair ABI (essential functions)
const LBPairV21ABI = [
    {
        "inputs": [
            { "internalType": "address[]", "name": "accounts", "type": "address[]" },
            { "internalType": "uint256[]", "name": "ids", "type": "uint256[]" }
        ],
        "name": "balanceOfBatch",
        "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "account", "type": "address" },
            { "internalType": "address", "name": "operator", "type": "address" }
        ],
        "name": "isApprovedForAll",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "operator", "type": "address" },
            { "internalType": "bool", "name": "approved", "type": "bool" }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

// TraderJoe V2.2 Router ABI (remove liquidity function)
const LBRouterV22ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "tokenX", "type": "address" },
            { "internalType": "address", "name": "tokenY", "type": "address" },
            { "internalType": "uint16", "name": "binStep", "type": "uint16" },
            { "internalType": "uint256", "name": "amountXMin", "type": "uint256" },
            { "internalType": "uint256", "name": "amountYMin", "type": "uint256" },
            { "internalType": "uint256[]", "name": "ids", "type": "uint256[]" },
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "removeLiquidity",
        "outputs": [
            { "internalType": "uint256", "name": "amountX", "type": "uint256" },
            { "internalType": "uint256", "name": "amountY", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

// TraderJoe V2.2 Factory ABI
const LBFactoryABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" },
            { "internalType": "uint256", "name": "binStep", "type": "uint256" }
        ],
        "name": "getLBPairInformation",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint16", "name": "binStep", "type": "uint16" },
                    { "internalType": "address", "name": "LBPair", "type": "address" },
                    { "internalType": "bool", "name": "createdByOwner", "type": "bool" },
                    { "internalType": "bool", "name": "ignoredForRouting", "type": "bool" }
                ],
                "internalType": "struct ILBFactory.LBPairInformation",
                "name": "lbPairInformation",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

// PancakeSwap V2 Factory and Pair ABI
const PANCAKE_FACTORY_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "tokenA", "type": "address" },
            { "internalType": "address", "name": "tokenB", "type": "address" }
        ],
        "name": "getPair",
        "outputs": [{ "internalType": "address", "name": "pair", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

const PAIR_ABI = [
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getReserves",
        "outputs": [
            { "internalType": "uint112", "name": "reserve0", "type": "uint112" },
            { "internalType": "uint112", "name": "reserve1", "type": "uint112" },
            { "internalType": "uint32", "name": "blockTimestampLast", "type": "uint32" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
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
] as const;

// PancakeSwap V2 Factory address
const factoryAddress = MODE === "dev"
    ? "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc" // BSC测试网 PancakeSwap V2 Factory
    : "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"; // BSC主网

// TraderJoe V2.2 Factory address
const traderJoeFactoryAddress = MODE === "dev"
    ? "0x8e42f2F4101563bF679975178e880FD87d3eFd4e" // BSC测试网 TraderJoe V2.2 Factory
    : "0x8e42f2F4101563bF679975178e880FD87d3eFd4e"; // BSC主网 TraderJoe V2.2 Factory

/**
 * 移除 USDC-USDT 流动性
 * @param {string} liquidityPercentage - 要移除的流动性百分比 (如 "50" 表示 50%)
 * @param {number} slippagePercent - 滑点容忍度百分比 (如 0.5 表示 0.5%)
 * @returns {Promise<string>} - 交易哈希
 */
export async function removeLiquidityUSDCUSDT(
    liquidityPercentage: string = "100",
    slippagePercent: number = 0.5
): Promise<string> {
    try {
        console.log("🏊‍♀️ 开始移除 USDC-USDT 流动性");
        console.log("   网络:", MODE === "dev" ? "BSC 测试网" : "BSC 主网");
        console.log("   移除比例:", `${liquidityPercentage}%`);
        console.log("   滑点容忍度:", `${slippagePercent}%`);

        // 定义代币地址
        const USDC_ADDRESS = MODE === "dev"
            ? "0x64544969ed7EBf5f083679233325356EbE738930"
            : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

        const USDT_ADDRESS = MODE === "dev"
            ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
            : "0x55d398326f99059fF775485246999027B3197955";

        // 获取配对地址
        const pairAddress = await publicClient.readContract({
            address: factoryAddress as `0x${string}`,
            abi: PANCAKE_FACTORY_ABI,
            functionName: "getPair",
            args: [USDC_ADDRESS as `0x${string}`, USDT_ADDRESS as `0x${string}`]
        });

        if (pairAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("USDC-USDT 流动性池不存在");
        }

        console.log("   配对地址:", pairAddress);

        // 获取用户的LP代币余额
        const lpBalance = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "balanceOf",
            args: [account.address]
        });

        if (lpBalance === BigInt(0)) {
            throw new Error("您在该流动性池中没有流动性");
        }

        console.log("   LP代币余额:", lpBalance.toString());

        // 计算要移除的流动性数量
        const liquidityToRemove = (lpBalance * BigInt(liquidityPercentage)) / BigInt(100);
        console.log("   要移除的流动性:", liquidityToRemove.toString());

        // 获取池子储备量来估算最小输出
        const reserves = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "getReserves",
            args: []
        });

        const totalSupply = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "totalSupply",
            args: []
        });

        // 计算预期输出 (简化计算)
        const expectedUSDC = (reserves[0] * liquidityToRemove) / totalSupply;
        const expectedUSDT = (reserves[1] * liquidityToRemove) / totalSupply;

        // 应用滑点容忍度
        const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100));
        const minUSDC = (expectedUSDC * slippageMultiplier) / BigInt(10000);
        const minUSDT = (expectedUSDT * slippageMultiplier) / BigInt(10000);

        console.log("   预期 USDC:", expectedUSDC.toString());
        console.log("   预期 USDT:", expectedUSDT.toString());
        console.log("   最小 USDC:", minUSDC.toString());
        console.log("   最小 USDT:", minUSDT.toString());

        // 批准LP代币给路由器
        await approveLPTokenIfNeeded(pairAddress, routerAddress, liquidityToRemove);

        // 设置截止时间
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

        console.log("\n🔄 执行移除流动性交易...");

        // 模拟交易
        const { request } = await publicClient.simulateContract({
            address: routerAddress as `0x${string}`,
            abi: PANCAKE_ROUTER_ABI,
            functionName: "removeLiquidity",
            args: [
                USDC_ADDRESS as `0x${string}`,
                USDT_ADDRESS as `0x${string}`,
                liquidityToRemove,
                minUSDC,
                minUSDT,
                account.address,
                deadline
            ],
            account
        });

        // 发送交易
        const txHash = await walletClient.writeContract(request);
        console.log("✅ 移除流动性交易已发送! 哈希:", txHash);

        // 等待确认
        const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: txHash as `0x${string}` 
        });
        console.log("🎉 流动性移除成功! 区块:", receipt.blockNumber);

        return txHash;
    } catch (error) {
        console.error("❌ 移除流动性失败:", error);
        throw error;
    }
}

/**
 * 移除 BNB-USDC 流动性
 * @param {string} liquidityPercentage - 要移除的流动性百分比
 * @param {number} slippagePercent - 滑点容忍度百分比
 * @returns {Promise<string>} - 交易哈希
 */
export async function removeLiquidityBNBUSDC(
    liquidityPercentage: string = "100",
    slippagePercent: number = 0.5
): Promise<string> {
    try {
        console.log("🏊‍♀️ 开始移除 BNB-USDC 流动性");

        const USDC_ADDRESS = MODE === "dev"
            ? "0x64544969ed7EBf5f083679233325356EbE738930"
            : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

        const WBNB_ADDRESS = MODE === "dev"
            ? "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
            : "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

        // 获取配对地址
        const pairAddress = await publicClient.readContract({
            address: factoryAddress as `0x${string}`,
            abi: PANCAKE_FACTORY_ABI,
            functionName: "getPair",
            args: [WBNB_ADDRESS as `0x${string}`, USDC_ADDRESS as `0x${string}`]
        });

        if (pairAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("BNB-USDC 流动性池不存在");
        }

        const lpBalance = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "balanceOf",
            args: [account.address]
        });

        if (lpBalance === BigInt(0)) {
            throw new Error("您在该流动性池中没有流动性");
        }

        const liquidityToRemove = (lpBalance * BigInt(liquidityPercentage)) / BigInt(100);

        // 获取储备量和总供应量
        const reserves = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "getReserves",
            args: []
        });

        const totalSupply = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "totalSupply",
            args: []
        });

        // 计算预期输出 (需要确定哪个是WBNB哪个是USDC)
        const expectedWBNB = (reserves[0] * liquidityToRemove) / totalSupply;
        const expectedUSDC = (reserves[1] * liquidityToRemove) / totalSupply;

        const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100));
        const minWBNB = (expectedWBNB * slippageMultiplier) / BigInt(10000);
        const minUSDC = (expectedUSDC * slippageMultiplier) / BigInt(10000);

        console.log("   移除比例:", `${liquidityPercentage}%`);
        console.log("   LP代币:", liquidityToRemove.toString());

        // 批准LP代币
        await approveLPTokenIfNeeded(pairAddress, routerAddress, liquidityToRemove);

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

        const { request } = await publicClient.simulateContract({
            address: routerAddress as `0x${string}`,
            abi: PANCAKE_ROUTER_ABI,
            functionName: "removeLiquidityETH",
            args: [
                USDC_ADDRESS as `0x${string}`,
                liquidityToRemove,
                minUSDC,
                minWBNB,
                account.address,
                deadline
            ],
            account
        });

        const txHash = await walletClient.writeContract(request);
        console.log("✅ BNB-USDC 流动性移除交易已发送:", txHash);

        await publicClient.waitForTransactionReceipt({ 
            hash: txHash as `0x${string}` 
        });
        console.log("🎉 BNB-USDC 流动性移除成功!");

        return txHash;
    } catch (error) {
        console.error("❌ 移除 BNB-USDC 流动性失败:", error);
        throw error;
    }
}

/**
 * 获取用户在指定流动性池中的信息
 * @param {string} type - 流动性池类型 ("usdc-usdt" 或 "bnb-usdc")
 * @returns {Promise<object>} - 流动性信息
 */
export async function getLiquidityInfo(type: string): Promise<any> {
    try {
        let tokenA, tokenB;
        
        if (type === "usdc-usdt") {
            tokenA = MODE === "dev" ? "0x64544969ed7EBf5f083679233325356EbE738930" : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
            tokenB = MODE === "dev" ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" : "0x55d398326f99059fF775485246999027B3197955";
        } else if (type === "bnb-usdc") {
            tokenA = MODE === "dev" ? "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" : "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
            tokenB = MODE === "dev" ? "0x64544969ed7EBf5f083679233325356EbE738930" : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
        } else {
            throw new Error("无效的流动性池类型");
        }

        // 获取配对地址
        const pairAddress = await publicClient.readContract({
            address: factoryAddress as `0x${string}`,
            abi: PANCAKE_FACTORY_ABI,
            functionName: "getPair",
            args: [tokenA as `0x${string}`, tokenB as `0x${string}`]
        });

        if (pairAddress === "0x0000000000000000000000000000000000000000") {
            return {
                exists: false,
                lpBalance: "0",
                reserves: null,
                share: "0"
            };
        }

        // 获取用户LP余额
        const lpBalance = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "balanceOf",
            args: [account.address]
        });

        // 获取总供应量和储备量
        const totalSupply = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "totalSupply",
            args: []
        });

        const reserves = await publicClient.readContract({
            address: pairAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "getReserves",
            args: []
        });

        // 计算用户份额
        const sharePercentage = totalSupply > 0 
            ? ((Number(lpBalance) / Number(totalSupply)) * 100).toFixed(4)
            : "0";

        return {
            exists: true,
            pairAddress,
            lpBalance: lpBalance.toString(),
            totalSupply: totalSupply.toString(),
            reserves: {
                reserve0: reserves[0].toString(),
                reserve1: reserves[1].toString()
            },
            sharePercentage,
            type
        };
    } catch (error) {
        console.error("获取流动性信息失败:", error);
        throw error;
    }
}

/**
 * 移除 TraderJoe V2.2 USDC-USDT 流动性
 * @param {string} liquidityPercentage - 要移除的流动性百分比 (如 "50" 表示 50%)
 * @param {number} slippagePercent - 滑点容忍度百分比 (如 0.5 表示 0.5%)
 * @returns {Promise<string>} - 交易哈希
 */
export async function removeLiquidityTraderJoeUSDCUSDT(
    liquidityPercentage: string = "100",
    slippagePercent: number = 0.5
): Promise<string> {
    try {
        console.log("🏊‍♀️ 开始移除 TraderJoe V2.2 USDC-USDT 流动性");
        console.log("   网络:", MODE === "dev" ? "BSC 测试网" : "BSC 主网");
        console.log("   移除比例:", `${liquidityPercentage}%`);
        console.log("   滑点容忍度:", `${slippagePercent}%`);

        // 定义代币地址
        const USDC_ADDRESS = MODE === "dev"
            ? "0x64544969ed7EBf5f083679233325356EbE738930"
            : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

        const USDT_ADDRESS = MODE === "dev"
            ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
            : "0x55d398326f99059fF775485246999027B3197955";

        // 获取TraderJoe LB Pair信息
        const lbPairInfo = await publicClient.readContract({
            address: traderJoeFactoryAddress as `0x${string}`,
            abi: LBFactoryABI,
            functionName: "getLBPairInformation",
            args: [USDC_ADDRESS as `0x${string}`, USDT_ADDRESS as `0x${string}`, BigInt(BIN_STEP)]
        });

        if (lbPairInfo.LBPair === "0x0000000000000000000000000000000000000000") {
            throw new Error("TraderJoe USDC-USDT 流动性池不存在");
        }

        console.log("   LB Pair 地址:", lbPairInfo.LBPair);

        // 获取当前活跃bin周围的范围
        const range = 200;
        const activeBinId = 8388608; // 默认活跃bin ID

        // 准备地址和bin数组
        const addressArray = Array.from({ length: 2 * range + 1 }).fill(account.address);
        const binsArray = [];
        for (let i = activeBinId - range; i <= activeBinId + range; i++) {
            binsArray.push(BigInt(i));
        }

        // 获取用户在所有bins中的余额
        const allBins = await publicClient.readContract({
            address: lbPairInfo.LBPair as `0x${string}`,
            abi: LBPairV21ABI,
            functionName: 'balanceOfBatch',
            args: [addressArray as `0x${string}`[], binsArray]
        });

        // 筛选出用户拥有的bins
        const userOwnedBins = binsArray.filter((bin, index) => allBins[index] !== BigInt(0));
        const nonZeroAmounts = allBins.filter(amount => amount !== BigInt(0));

        if (userOwnedBins.length === 0) {
            throw new Error("您在该TraderJoe流动性池中没有流动性");
        }

        console.log("   用户拥有的bins:", userOwnedBins.length);

        // 根据百分比计算要移除的数量
        const percentage = BigInt(liquidityPercentage);
        const adjustedAmounts = nonZeroAmounts.map(amount => 
            (amount * percentage) / BigInt(100)
        );

        // 检查是否已批准
        const approved = await publicClient.readContract({
            address: lbPairInfo.LBPair as `0x${string}`,
            abi: LBPairV21ABI,
            functionName: 'isApprovedForAll',
            args: [account.address, traderJoeRouterAddress as `0x${string}`]
        });

        if (!approved) {
            console.log("   需要批准LB对路由器的操作权限");
            const { request } = await publicClient.simulateContract({
                address: lbPairInfo.LBPair as `0x${string}`,
                abi: LBPairV21ABI,
                functionName: 'setApprovalForAll',
                args: [traderJoeRouterAddress as `0x${string}`, true],
                account
            });
            
            const hashApproval = await walletClient.writeContract(request);
            console.log(`   ✅ 批准交易哈希: ${hashApproval}`);
            
            await publicClient.waitForTransactionReceipt({ 
                hash: hashApproval as `0x${string}` 
            });
            console.log("   ✅ 批准成功");
        }

        // 设置交易截止时间
        const currentTimeInSec = Math.floor(Date.now() / 1000);
        const deadline = BigInt(currentTimeInSec + 3600);

        console.log("\n🔄 执行TraderJoe移除流动性交易...");

        // 模拟并发送移除流动性交易
        const { request } = await publicClient.simulateContract({
            address: traderJoeRouterAddress as `0x${string}`,
            abi: LBRouterV22ABI,
            functionName: "removeLiquidity",
            args: [
                USDC_ADDRESS as `0x${string}`,
                USDT_ADDRESS as `0x${string}`,
                Number(BIN_STEP),
                BigInt(0), // amountXMin - 简化示例中设为0
                BigInt(0), // amountYMin - 简化示例中设为0
                userOwnedBins,
                adjustedAmounts,
                account.address,
                deadline
            ],
            account
        });

        const removalHash = await walletClient.writeContract(request);
        console.log("✅ TraderJoe流动性移除交易已发送! 哈希:", removalHash);

        // 等待确认
        const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: removalHash as `0x${string}` 
        });
        console.log("🎉 TraderJoe流动性移除成功! 区块:", receipt.blockNumber);

        return removalHash;
    } catch (error) {
        console.error("❌ 移除TraderJoe流动性失败:", error);
        throw error;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function approveLPTokenIfNeeded(
    lpTokenAddress: string,
    spender: string, 
    amount: bigint
): Promise<void> {
    try {
        // 检查当前批准额度
        const allowanceResult = await publicClient.readContract({
            address: lpTokenAddress as `0x${string}`,
            abi: PAIR_ABI,
            functionName: "allowance",
            args: [account.address, spender as `0x${string}`],
        });

        const currentAllowance = BigInt(allowanceResult?.toString() || '0');
        console.log(`   当前LP代币批准额度：${currentAllowance.toString()}`);

        if (currentAllowance < amount) {
            console.log(`   需要批准LP代币支出`);

            const { request } = await publicClient.simulateContract({
                address: lpTokenAddress as `0x${string}`,
                abi: PAIR_ABI,
                functionName: "approve",
                args: [spender as `0x${string}`, amount],
                account
            });

            const txHash = await walletClient.writeContract(request);
            console.log(`   ✅ LP代币批准交易哈希: ${txHash}`);

            await publicClient.waitForTransactionReceipt({ 
                hash: txHash as `0x${string}` 
            });
            console.log(`   ✅ LP代币批准成功`);

            await sleep(2000);
        } else {
            console.log(`   ✅ LP代币批准额度充足`);
        }
    } catch (error) {
        console.error(`   ❌ 批准LP代币失败:`, error);
        throw error;
    }
}
