import { Token, TokenAmount, ChainId } from '@lb-xyz/sdk-core';
import {
    PairV2,
    LB_ROUTER_V22_ADDRESS,
    jsonAbis,
    LiquidityDistribution,
    getLiquidityConfig,
    getUniformDistributionFromBinRange
} from '@lb-xyz/sdk-v2';
import {
    createPublicClient,
    createWalletClient,
    http,
    parseUnits,
    BaseError,
    ContractFunctionRevertedError
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc, bscTestnet } from 'viem/chains';
import JSBI from 'jsbi';
import { config } from 'dotenv';
import { logger } from './fs';

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

// Chain configuration for BSC
const chain = MODE === "dev" ? bscTestnet : bsc;
const CHAIN_ID = MODE === "dev" ? ChainId.BNB_TESTNET : ChainId.BNB_CHAIN;

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

const { LBRouterV22ABI } = jsonAbis;

// DLMM LB V22 router address for BSC
const DLMMRouterAddress = LB_ROUTER_V22_ADDRESS[CHAIN_ID as keyof typeof LB_ROUTER_V22_ADDRESS] || 
    (MODE === "dev" 
        ? "0xe98efCE22A8Ec0dd5dDF6C1A81B6ADD740176E98" // BSC测试网 DLMM
        : "0xe98efCE22A8Ec0dd5dDF6C1A81B6ADD740176E98"  // BSC主网 DLMM
    );

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
] as const;

/**
 * 使用DLMM V2.2在BSC上添加USDC-USDT流动性
 * @param {string} binStep - LB pair的bin step (例如 "1", "5", "10" 等)
 * @param {string} usdcAmount - USDC数量 (例如 "0.01")
 * @param {string} usdtAmount - USDT数量 (例如 "0.01")
 * @returns {Promise<string>} - 交易哈希
 */
export async function addLiquidityUSDCUSDT(
    binStep: string = "1",
    usdcAmount: string = "1.0",
    usdtAmount: string = "1.0"
): Promise<string> {
    try {
        logger.info("🏊‍♂️ 开始使用DLMM V2.2添加 USDC-USDT 流动性");
        logger.info(`   网络: ${MODE === "dev" ? "BSC 测试网" : "BSC 主网"}`);
        logger.info(`   DLMM路由器地址: ${DLMMRouterAddress}`);

        // 定义BSC上的代币 (18位小数)
        const USDC = new Token(
            CHAIN_ID,
            MODE === "dev" 
                ? '0x64544969ed7EBf5f083679233325356EbE738930'  // BSC测试网USDC
                : '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC主网USDC
            18, // BSC上的USDC是18位小数
            'USDC',
            'USD Coin'
        );

        const USDT = new Token(
            CHAIN_ID,
            MODE === "dev"
                ? '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'  // BSC测试网USDT
                : '0x55d398326f99059fF775485246999027B3197955', // BSC主网USDT
            18, // BSC上的USDT是18位小数
            'USDT',
            'Tether USD'
        );

        logger.info(`   USDC地址: ${USDC.address}`);
        logger.info(`   USDT地址: ${USDT.address}`);
        logger.info(`   添加数量: ${usdcAmount} USDC + ${usdtAmount} USDT`);
        logger.info(`   Bin Step: ${binStep}`);

        // 解析代币数量
        const typedValueUSDCParsed = parseUnits(usdcAmount, USDC.decimals);
        const typedValueUSDTParsed = parseUnits(usdtAmount, USDT.decimals);

        // 创建TokenAmount对象
        const tokenAmountUSDC = new TokenAmount(USDC, typedValueUSDCParsed);
        const tokenAmountUSDT = new TokenAmount(USDT, typedValueUSDTParsed);

        // 滑点容忍度 (50 bips = 0.5%)
        const allowedAmountsSlippage = 50;

        // 基于滑点计算最小数量
        const minTokenAmountUSDC = JSBI.divide(
            JSBI.multiply(tokenAmountUSDC.raw, JSBI.BigInt(10000 - allowedAmountsSlippage)),
            JSBI.BigInt(10000)
        );
        const minTokenAmountUSDT = JSBI.divide(
            JSBI.multiply(tokenAmountUSDT.raw, JSBI.BigInt(10000 - allowedAmountsSlippage)),
            JSBI.BigInt(10000)
        );

        // 获取LBPair的活跃bin
        // Get the LBPair's active bin
        // IMPORTANT: Tokens must be passed in ascending order by address.
        // USDC (0x6454...) < USDT (0x3376...), so we order as [USDC, USDT].
        const pair = new PairV2(USDC, USDT);
        const pairVersion = 'v22';
        logger.info("🔍 获取LBPair信息...");
        const lbPair = await pair.fetchLBPair(Number(binStep), pairVersion, publicClient, CHAIN_ID);
        
        if (lbPair.LBPair === '0x0000000000000000000000000000000000000000') {
            throw new Error(`未找到bin step为${binStep}的LB pair`);
        }

        logger.info(`   LBPair地址: ${lbPair.LBPair}`);

        // 获取LBPair数据
        const lbPairData = await PairV2.getLBPairReservesAndId(lbPair.LBPair, pairVersion, publicClient);
        const activeBinId = lbPairData.activeId;

        logger.info(`   活跃Bin ID: ${activeBinId}`);

        // 选择流动性分布：在活跃bin周围的均匀分布
        const binRange = [activeBinId - 5, activeBinId + 5];
        const { deltaIds, distributionX, distributionY } = getUniformDistributionFromBinRange(
            activeBinId,
            binRange
        );

        logger.info(`   流动性分布范围: ${binRange[0]} 到 ${binRange[1]}`);

        // 批准代币支出
        logger.info("\n📝 批准代币支出...");
        await approveTokenIfNeeded(USDC.address, DLMMRouterAddress, typedValueUSDCParsed);
        await approveTokenIfNeeded(USDT.address, DLMMRouterAddress, typedValueUSDTParsed);

        // 构建addLiquidity参数
        const currentTimeInSec = Math.floor(Date.now() / 1000);
        const deadline = currentTimeInSec + 3600; // 1小时后过期

        // IMPORTANT: tokenX must be the token with the lower address (USDC) and tokenY the higher (USDT)
        const addLiquidityInput = {
            tokenX: USDC.address,
            tokenY: USDT.address,
            binStep: Number(binStep),
            amountX: tokenAmountUSDC.raw.toString(),
            amountY: tokenAmountUSDT.raw.toString(),
            amountXMin: minTokenAmountUSDC.toString(),
            amountYMin: minTokenAmountUSDT.toString(),
            activeIdDesired: activeBinId,
            idSlippage: 5,                   // how many bins away from the active bin you allow
            deltaIds,
            distributionX,
            distributionY,
            to: account.address,             // your wallet
            refundTo: account.address,       // if any leftover tokens from distribution
            deadline
        };

        logger.info("\n🔄 执行DLMM添加流动性交易...");

        // 模拟和执行交易
        const { request } = await publicClient.simulateContract({
            address: DLMMRouterAddress as `0x${string}`,
            abi: LBRouterV22ABI,
            functionName: "addLiquidity",
            args: [addLiquidityInput],
            account
        });

        const txHash = await walletClient.writeContract(request);
        logger.success(`✅ DLMM流动性添加交易已发送! 哈希: ${txHash}`);

        // 等待确认
        const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: txHash as `0x${string}` 
        });
        logger.success(`🎉 DLMM流动性添加成功! 区块: ${receipt.blockNumber}`);

        return txHash;
    } catch (error) {
        logger.error("❌ DLMM添加流动性失败:", error instanceof Error ? error.message : String(error));
        throw error;
    }
}

/**
 * 使用DLMM V2.2在BSC上添加BNB-USDC流动性
 * @param {string} binStep - LB pair的bin step (例如 "25", "50", "100" 等)
 * @param {string} bnbAmount - BNB数量 (例如 "0.01")
 * @param {string} usdcAmount - USDC数量 (例如 "3.0")
 * @returns {Promise<string>} - 交易哈希
 */
export async function addLiquidityBNBUSDC(
    binStep: string = "25",
    bnbAmount: string = "0.01",
    usdcAmount: string = "3.0"
): Promise<string> {
    try {
        logger.info("🏊‍♂️ 开始使用DLMM V2.2添加 BNB-USDC 流动性");
        logger.info(`   网络: ${MODE === "dev" ? "BSC 测试网" : "BSC 主网"}`);
        logger.info(`   DLMM路由器地址: ${DLMMRouterAddress}`);

        // 定义BSC上的代币
        const WBNB = new Token(
            CHAIN_ID,
            MODE === "dev" 
                ? '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'  // BSC测试网WBNB
                : '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // BSC主网WBNB
            18,
            'WBNB',
            'Wrapped BNB'
        );

        const USDC = new Token(
            CHAIN_ID,
            MODE === "dev" 
                ? '0x64544969ed7EBf5f083679233325356EbE738930'  // BSC测试网USDC
                : '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC主网USDC
            18, // BSC上的USDC是18位小数
            'USDC',
            'USD Coin'
        );

        logger.info(`   WBNB地址: ${WBNB.address}`);
        logger.info(`   USDC地址: ${USDC.address}`);
        logger.info(`   添加数量: ${bnbAmount} BNB + ${usdcAmount} USDC`);
        logger.info(`   Bin Step: ${binStep}`);

        // 解析代币数量
        const typedValueBNBParsed = parseUnits(bnbAmount, WBNB.decimals);
        const typedValueUSDCParsed = parseUnits(usdcAmount, USDC.decimals);

        // 创建TokenAmount对象
        const tokenAmountWBNB = new TokenAmount(WBNB, typedValueBNBParsed);
        const tokenAmountUSDC = new TokenAmount(USDC, typedValueUSDCParsed);

        // 滑点容忍度 (50 bips = 0.5%)
        const allowedAmountsSlippage = 50;

        // 基于滑点计算最小数量
        const minTokenAmountWBNB = JSBI.divide(
            JSBI.multiply(tokenAmountWBNB.raw, JSBI.BigInt(10000 - allowedAmountsSlippage)),
            JSBI.BigInt(10000)
        );
        const minTokenAmountUSDC = JSBI.divide(
            JSBI.multiply(tokenAmountUSDC.raw, JSBI.BigInt(10000 - allowedAmountsSlippage)),
            JSBI.BigInt(10000)
        );

        // 创建Pair并获取LBPair信息来确定正确的代币顺序
        logger.info("🔍 获取LBPair信息并确定代币顺序...");
        
        // Tokens must be ordered by address: WBNB (0xae13...) < USDC (0x6454...)
        let pair = new PairV2(WBNB, USDC);
        let pairVersion = 'v22' as const;
        let lbPair = await pair.fetchLBPair(Number(binStep), pairVersion, publicClient, CHAIN_ID);
        
        if (lbPair.LBPair === '0x0000000000000000000000000000000000000000') {
            // 如果WBNB-USDC顺序不存在，尝试USDC-WBNB顺序
            logger.info("   尝试反向代币顺序...");
            pair = new PairV2(USDC, WBNB);
            lbPair = await pair.fetchLBPair(Number(binStep), pairVersion, publicClient, CHAIN_ID);
            
            if (lbPair.LBPair === '0x0000000000000000000000000000000000000000') {
                throw new Error(`未找到bin step为${binStep}的BNB-USDC LB pair，请检查binStep值`);
            }
        } 

        logger.info(`   TokenX: ${WBNB.symbol} - ${WBNB.address}`);
        logger.info(`   TokenY: ${USDC.symbol} - ${USDC.address}`);
        logger.info(`   LBPair地址: ${lbPair.LBPair}`);

        // 获取LBPair数据
        const lbPairData = await PairV2.getLBPairReservesAndId(lbPair.LBPair, 'v22' as const, publicClient);
        const activeBinId = lbPairData.activeId;

        logger.info(`   活跃Bin ID: ${activeBinId}`);

        // 选择流动性分布：在活跃bin周围的均匀分布
        const binRange = [activeBinId - 3, activeBinId + 3]; // BNB-USDC波动较大，缩小范围
        const { deltaIds, distributionX, distributionY } = getUniformDistributionFromBinRange(
            activeBinId,
            binRange
        );

        logger.info(`   流动性分布范围: ${binRange[0]} 到 ${binRange[1]}`);

        // 批准代币支出 (需要先将BNB包装成WBNB)
        logger.info("\n📝 处理BNB包装和代币批准...");
        
        // 首先需要将BNB包装成WBNB
        await wrapBNBIfNeeded(typedValueBNBParsed);
        
        // 批准WBNB和USDC支出
        await approveTokenIfNeeded(USDC.address, DLMMRouterAddress, typedValueUSDCParsed);
        await approveTokenIfNeeded(WBNB.address, DLMMRouterAddress, typedValueBNBParsed);

        // 构建addLiquidity参数
        const currentTimeInSec = Math.floor(Date.now() / 1000);
        const deadline = currentTimeInSec + 3600; // 1小时后过期

        const addLiquidityInput = {
            tokenX: WBNB.address,
            tokenY: USDC.address,
            binStep: Number(binStep),
            amountX: tokenAmountWBNB.raw.toString(),
            amountY: tokenAmountUSDC.raw.toString(),
            amountXMin: minTokenAmountWBNB.toString(),
            amountYMin: minTokenAmountUSDC.toString(),
            activeIdDesired: activeBinId,
            idSlippage: 10, // BNB-USDC波动较大，允许更大的bin滑动
            deltaIds,
            distributionX,
            distributionY,
            to: account.address,
            refundTo: account.address,
            deadline
        };

        logger.info("\n🔄 执行DLMM BNB-USDC流动性添加交易...");

        // 模拟和执行交易
        const { request } = await publicClient.simulateContract({
            address: DLMMRouterAddress as `0x${string}`,
            abi: LBRouterV22ABI,
            functionName: "addLiquidity",
            args: [addLiquidityInput],
            account
        });

        const txHash = await walletClient.writeContract(request);
        logger.success(`✅ DLMM BNB-USDC流动性添加交易已发送! 哈希: ${txHash}`);

        // 等待确认
        const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: txHash as `0x${string}` 
        });
        logger.success(`🎉 DLMM BNB-USDC流动性添加成功! 区块: ${receipt.blockNumber}`);

        return txHash;
    } catch (error) {
        logger.error("❌ DLMM BNB-USDC添加流动性失败:", error instanceof Error ? error.message : String(error));
        throw error;
    }
}

// WBNB合约ABI (包装和解包装功能)
const WBNB_ABI = [
    {
        "constant": false,
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "wad", "type": "uint256"}],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
] as const;

/**
 * 如果需要，将BNB包装成WBNB
 * @param {bigint} requiredAmount - 需要的WBNB数量
 */
async function wrapBNBIfNeeded(requiredAmount: bigint): Promise<void> {
    try {
        const WBNB_ADDRESS = MODE === "dev" 
            ? "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"  // BSC测试网WBNB
            : "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // BSC主网WBNB

        // 检查当前WBNB余额
        const currentWBNBBalance = await publicClient.readContract({
            address: WBNB_ADDRESS as `0x${string}`,
            abi: WBNB_ABI,
            functionName: 'balanceOf',
            args: [account.address],
        });

        const currentBalance = BigInt(currentWBNBBalance?.toString() || '0');
        logger.info(`   当前WBNB余额: ${currentBalance.toString()}`);
        logger.info(`   需要WBNB数量: ${requiredAmount.toString()}`);

        if (currentBalance < requiredAmount) {
            const needToWrap = requiredAmount - currentBalance;
            logger.info(`   需要包装 ${needToWrap.toString()} BNB 为 WBNB`);

            // 执行BNB包装
            const { request } = await publicClient.simulateContract({
                address: WBNB_ADDRESS as `0x${string}`,
                abi: WBNB_ABI,
                functionName: 'deposit',
                args: [],
                value: needToWrap,
                account
            });

            const txHash = await walletClient.writeContract(request);
            logger.info(`   ✅ BNB包装交易哈希: ${txHash}`);

            // 等待包装交易确认
            await publicClient.waitForTransactionReceipt({ 
                hash: txHash as `0x${string}` 
            });
            logger.success(`   ✅ BNB包装成功，获得 ${needToWrap.toString()} WBNB`);

            // 短暂等待确保余额更新
            await sleep(2000);
        } else {
            logger.success(`   ✅ WBNB余额充足，无需包装`);
        }
    } catch (error) {
        logger.error(`   ❌ BNB包装失败:`, error instanceof Error ? error.message : String(error));
        throw error;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function approveTokenIfNeeded(
    tokenAddress: string, 
    spender: string, 
    amount: bigint | string
): Promise<void> {
    try {
        const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
        
        // 检查当前批准额度
        const allowanceResult = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: minimalERC20Abi,
            functionName: 'allowance',
            args: [account.address, spender as `0x${string}`],
        });

        const currentAllowance = BigInt(allowanceResult?.toString() || '0');
        logger.info(`   当前批准额度 ${tokenAddress.slice(0, 8)}...: ${currentAllowance.toString()}`);

        if (currentAllowance < amountBigInt) {
            logger.info(`   需要批准 ${tokenAddress.slice(0, 8)}... 支出，当前额度不足`);

            // 批准 2倍数量以减少未来的批准交易
            const approveAmount = amountBigInt * BigInt(2);

            const { request } = await publicClient.simulateContract({
                address: tokenAddress as `0x${string}`,
                abi: minimalERC20Abi,
                functionName: 'approve',
                args: [spender as `0x${string}`, approveAmount],
                account
            });

            const txHash = await walletClient.writeContract(request);
            logger.info(`   ✅ 批准交易哈希: ${txHash}`);

            // 等待批准交易确认
            await publicClient.waitForTransactionReceipt({ 
                hash: txHash as `0x${string}` 
            });
            logger.success(`   ✅ ${tokenAddress.slice(0, 8)}... 批准成功`);

            // 短暂等待确保链状态更新
            await sleep(2000);
        } else {
            logger.success(`   ✅ ${tokenAddress.slice(0, 8)}... 批准额度充足，无需重新批准`);
        }
    } catch (error) {
        logger.error(`   ❌ 批准 ${tokenAddress} 失败:`, error instanceof Error ? error.message : String(error));
        throw error;
    }
}
