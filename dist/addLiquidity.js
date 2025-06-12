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
exports.addLiquidityUSDCUSDT = addLiquidityUSDCUSDT;
exports.addLiquidityBNBUSDC = addLiquidityBNBUSDC;
const sdk_core_1 = require("@lb-xyz/sdk-core");
const sdk_v2_1 = require("@lb-xyz/sdk-v2");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const jsbi_1 = __importDefault(require("jsbi"));
const dotenv_1 = require("dotenv");
const fs_1 = require("./fs");
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
// Chain configuration for BSC
const chain = MODE === "dev" ? chains_1.bscTestnet : chains_1.bsc;
const CHAIN_ID = MODE === "dev" ? sdk_core_1.ChainId.BNB_TESTNET : sdk_core_1.ChainId.BNB_CHAIN;
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
const { LBRouterV22ABI } = sdk_v2_1.jsonAbis;
// TraderJoe LB V22 router address for BSC
const traderJoeRouterAddress = sdk_v2_1.LB_ROUTER_V22_ADDRESS[CHAIN_ID] ||
    (MODE === "dev"
        ? "0xe98efCE22A8Ec0dd5dDF6C1A81B6ADD740176E98" // BSC测试网 TraderJoe
        : "0xe98efCE22A8Ec0dd5dDF6C1A81B6ADD740176E98" // BSC主网 TraderJoe
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
];
/**
 * 使用TraderJoe V2.2在BSC上添加USDC-USDT流动性
 * @param {string} binStep - LB pair的bin step (例如 "1", "5", "10" 等)
 * @param {string} usdcAmount - USDC数量 (例如 "0.01")
 * @param {string} usdtAmount - USDT数量 (例如 "0.01")
 * @returns {Promise<string>} - 交易哈希
 */
function addLiquidityUSDCUSDT() {
    return __awaiter(this, arguments, void 0, function* (binStep = "1", usdcAmount = "1.0", usdtAmount = "1.0") {
        try {
            fs_1.logger.info("🏊‍♂️ 开始使用TraderJoe V2.2添加 USDC-USDT 流动性");
            fs_1.logger.info(`   网络: ${MODE === "dev" ? "BSC 测试网" : "BSC 主网"}`);
            fs_1.logger.info(`   TraderJoe路由器地址: ${traderJoeRouterAddress}`);
            // 定义BSC上的代币 (18位小数)
            const USDC = new sdk_core_1.Token(CHAIN_ID, MODE === "dev"
                ? '0x64544969ed7EBf5f083679233325356EbE738930' // BSC测试网USDC
                : '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC主网USDC
            18, // BSC上的USDC是18位小数
            'USDC', 'USD Coin');
            const USDT = new sdk_core_1.Token(CHAIN_ID, MODE === "dev"
                ? '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' // BSC测试网USDT
                : '0x55d398326f99059fF775485246999027B3197955', // BSC主网USDT
            18, // BSC上的USDT是18位小数
            'USDT', 'Tether USD');
            fs_1.logger.info(`   USDC地址: ${USDC.address}`);
            fs_1.logger.info(`   USDT地址: ${USDT.address}`);
            fs_1.logger.info(`   添加数量: ${usdcAmount} USDC + ${usdtAmount} USDT`);
            fs_1.logger.info(`   Bin Step: ${binStep}`);
            // 解析代币数量
            const typedValueUSDCParsed = (0, viem_1.parseUnits)(usdcAmount, USDC.decimals);
            const typedValueUSDTParsed = (0, viem_1.parseUnits)(usdtAmount, USDT.decimals);
            // 创建TokenAmount对象
            const tokenAmountUSDC = new sdk_core_1.TokenAmount(USDC, typedValueUSDCParsed);
            const tokenAmountUSDT = new sdk_core_1.TokenAmount(USDT, typedValueUSDTParsed);
            // 滑点容忍度 (50 bips = 0.5%)
            const allowedAmountsSlippage = 50;
            // 基于滑点计算最小数量
            const minTokenAmountUSDC = jsbi_1.default.divide(jsbi_1.default.multiply(tokenAmountUSDC.raw, jsbi_1.default.BigInt(10000 - allowedAmountsSlippage)), jsbi_1.default.BigInt(10000));
            const minTokenAmountUSDT = jsbi_1.default.divide(jsbi_1.default.multiply(tokenAmountUSDT.raw, jsbi_1.default.BigInt(10000 - allowedAmountsSlippage)), jsbi_1.default.BigInt(10000));
            // 获取LBPair的活跃bin
            // Get the LBPair's active bin
            // IMPORTANT: Tokens must be passed in ascending order by address.
            // USDC (0x6454...) < USDT (0x3376...), so we order as [USDC, USDT].
            const pair = new sdk_v2_1.PairV2(USDC, USDT);
            const pairVersion = 'v22';
            fs_1.logger.info("🔍 获取LBPair信息...");
            const lbPair = yield pair.fetchLBPair(Number(binStep), pairVersion, publicClient, CHAIN_ID);
            if (lbPair.LBPair === '0x0000000000000000000000000000000000000000') {
                throw new Error(`未找到bin step为${binStep}的LB pair`);
            }
            fs_1.logger.info(`   LBPair地址: ${lbPair.LBPair}`);
            // 获取LBPair数据
            const lbPairData = yield sdk_v2_1.PairV2.getLBPairReservesAndId(lbPair.LBPair, pairVersion, publicClient);
            const activeBinId = lbPairData.activeId;
            fs_1.logger.info(`   活跃Bin ID: ${activeBinId}`);
            // 选择流动性分布：在活跃bin周围的均匀分布
            const binRange = [activeBinId - 5, activeBinId + 5];
            const { deltaIds, distributionX, distributionY } = (0, sdk_v2_1.getUniformDistributionFromBinRange)(activeBinId, binRange);
            fs_1.logger.info(`   流动性分布范围: ${binRange[0]} 到 ${binRange[1]}`);
            // 批准代币支出
            fs_1.logger.info("\n📝 批准代币支出...");
            yield approveTokenIfNeeded(USDC.address, traderJoeRouterAddress, typedValueUSDCParsed);
            yield approveTokenIfNeeded(USDT.address, traderJoeRouterAddress, typedValueUSDTParsed);
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
                idSlippage: 5, // how many bins away from the active bin you allow
                deltaIds,
                distributionX,
                distributionY,
                to: account.address, // your wallet
                refundTo: account.address, // if any leftover tokens from distribution
                deadline
            };
            fs_1.logger.info("\n🔄 执行TraderJoe添加流动性交易...");
            // 模拟和执行交易
            const { request } = yield publicClient.simulateContract({
                address: traderJoeRouterAddress,
                abi: LBRouterV22ABI,
                functionName: "addLiquidity",
                args: [addLiquidityInput],
                account
            });
            const txHash = yield walletClient.writeContract(request);
            fs_1.logger.success(`✅ TraderJoe流动性添加交易已发送! 哈希: ${txHash}`);
            // 等待确认
            const receipt = yield publicClient.waitForTransactionReceipt({
                hash: txHash
            });
            fs_1.logger.success(`🎉 TraderJoe流动性添加成功! 区块: ${receipt.blockNumber}`);
            return txHash;
        }
        catch (error) {
            fs_1.logger.error("❌ TraderJoe添加流动性失败:", error instanceof Error ? error.message : String(error));
            throw error;
        }
    });
}
/**
 * 使用TraderJoe V2.2在BSC上添加BNB-USDC流动性
 * @param {string} binStep - LB pair的bin step (例如 "25", "50", "100" 等)
 * @param {string} bnbAmount - BNB数量 (例如 "0.01")
 * @param {string} usdcAmount - USDC数量 (例如 "3.0")
 * @returns {Promise<string>} - 交易哈希
 */
function addLiquidityBNBUSDC() {
    return __awaiter(this, arguments, void 0, function* (binStep = "25", bnbAmount = "0.01", usdcAmount = "3.0") {
        try {
            fs_1.logger.info("🏊‍♂️ 开始使用TraderJoe V2.2添加 BNB-USDC 流动性");
            fs_1.logger.info(`   网络: ${MODE === "dev" ? "BSC 测试网" : "BSC 主网"}`);
            fs_1.logger.info(`   TraderJoe路由器地址: ${traderJoeRouterAddress}`);
            // 定义BSC上的代币
            const WBNB = new sdk_core_1.Token(CHAIN_ID, MODE === "dev"
                ? '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' // BSC测试网WBNB
                : '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // BSC主网WBNB
            18, 'WBNB', 'Wrapped BNB');
            const USDC = new sdk_core_1.Token(CHAIN_ID, MODE === "dev"
                ? '0x64544969ed7EBf5f083679233325356EbE738930' // BSC测试网USDC
                : '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC主网USDC
            18, // BSC上的USDC是18位小数
            'USDC', 'USD Coin');
            fs_1.logger.info(`   WBNB地址: ${WBNB.address}`);
            fs_1.logger.info(`   USDC地址: ${USDC.address}`);
            fs_1.logger.info(`   添加数量: ${bnbAmount} BNB + ${usdcAmount} USDC`);
            fs_1.logger.info(`   Bin Step: ${binStep}`);
            // 解析代币数量
            const typedValueBNBParsed = (0, viem_1.parseUnits)(bnbAmount, WBNB.decimals);
            const typedValueUSDCParsed = (0, viem_1.parseUnits)(usdcAmount, USDC.decimals);
            // 创建TokenAmount对象
            const tokenAmountWBNB = new sdk_core_1.TokenAmount(WBNB, typedValueBNBParsed);
            const tokenAmountUSDC = new sdk_core_1.TokenAmount(USDC, typedValueUSDCParsed);
            // 滑点容忍度 (50 bips = 0.5%)
            const allowedAmountsSlippage = 50;
            // 基于滑点计算最小数量
            const minTokenAmountWBNB = jsbi_1.default.divide(jsbi_1.default.multiply(tokenAmountWBNB.raw, jsbi_1.default.BigInt(10000 - allowedAmountsSlippage)), jsbi_1.default.BigInt(10000));
            const minTokenAmountUSDC = jsbi_1.default.divide(jsbi_1.default.multiply(tokenAmountUSDC.raw, jsbi_1.default.BigInt(10000 - allowedAmountsSlippage)), jsbi_1.default.BigInt(10000));
            // 创建Pair并获取LBPair信息来确定正确的代币顺序
            fs_1.logger.info("🔍 获取LBPair信息并确定代币顺序...");
            // Tokens must be ordered by address: WBNB (0xae13...) < USDC (0x6454...)
            let pair = new sdk_v2_1.PairV2(WBNB, USDC);
            let pairVersion = 'v22';
            let lbPair = yield pair.fetchLBPair(Number(binStep), pairVersion, publicClient, CHAIN_ID);
            if (lbPair.LBPair === '0x0000000000000000000000000000000000000000') {
                // 如果WBNB-USDC顺序不存在，尝试USDC-WBNB顺序
                fs_1.logger.info("   尝试反向代币顺序...");
                pair = new sdk_v2_1.PairV2(USDC, WBNB);
                lbPair = yield pair.fetchLBPair(Number(binStep), pairVersion, publicClient, CHAIN_ID);
                if (lbPair.LBPair === '0x0000000000000000000000000000000000000000') {
                    throw new Error(`未找到bin step为${binStep}的BNB-USDC LB pair，请检查binStep值`);
                }
            }
            fs_1.logger.info(`   TokenX: ${WBNB.symbol} - ${WBNB.address}`);
            fs_1.logger.info(`   TokenY: ${USDC.symbol} - ${USDC.address}`);
            fs_1.logger.info(`   LBPair地址: ${lbPair.LBPair}`);
            // 获取LBPair数据
            const lbPairData = yield sdk_v2_1.PairV2.getLBPairReservesAndId(lbPair.LBPair, 'v22', publicClient);
            const activeBinId = lbPairData.activeId;
            fs_1.logger.info(`   活跃Bin ID: ${activeBinId}`);
            // 选择流动性分布：在活跃bin周围的均匀分布
            const binRange = [activeBinId - 3, activeBinId + 3]; // BNB-USDC波动较大，缩小范围
            const { deltaIds, distributionX, distributionY } = (0, sdk_v2_1.getUniformDistributionFromBinRange)(activeBinId, binRange);
            fs_1.logger.info(`   流动性分布范围: ${binRange[0]} 到 ${binRange[1]}`);
            // 批准代币支出 (需要先将BNB包装成WBNB)
            fs_1.logger.info("\n📝 处理BNB包装和代币批准...");
            // 首先需要将BNB包装成WBNB
            yield wrapBNBIfNeeded(typedValueBNBParsed);
            // 批准WBNB和USDC支出
            yield approveTokenIfNeeded(USDC.address, traderJoeRouterAddress, typedValueUSDCParsed);
            yield approveTokenIfNeeded(WBNB.address, traderJoeRouterAddress, typedValueBNBParsed);
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
            fs_1.logger.info("\n🔄 执行TraderJoe BNB-USDC流动性添加交易...");
            // 模拟和执行交易
            const { request } = yield publicClient.simulateContract({
                address: traderJoeRouterAddress,
                abi: LBRouterV22ABI,
                functionName: "addLiquidity",
                args: [addLiquidityInput],
                account
            });
            const txHash = yield walletClient.writeContract(request);
            fs_1.logger.success(`✅ TraderJoe BNB-USDC流动性添加交易已发送! 哈希: ${txHash}`);
            // 等待确认
            const receipt = yield publicClient.waitForTransactionReceipt({
                hash: txHash
            });
            fs_1.logger.success(`🎉 TraderJoe BNB-USDC流动性添加成功! 区块: ${receipt.blockNumber}`);
            return txHash;
        }
        catch (error) {
            fs_1.logger.error("❌ TraderJoe BNB-USDC添加流动性失败:", error instanceof Error ? error.message : String(error));
            throw error;
        }
    });
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
        "inputs": [{ "name": "wad", "type": "uint256" }],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
/**
 * 如果需要，将BNB包装成WBNB
 * @param {bigint} requiredAmount - 需要的WBNB数量
 */
function wrapBNBIfNeeded(requiredAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const WBNB_ADDRESS = MODE === "dev"
                ? "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" // BSC测试网WBNB
                : "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // BSC主网WBNB
            // 检查当前WBNB余额
            const currentWBNBBalance = yield publicClient.readContract({
                address: WBNB_ADDRESS,
                abi: WBNB_ABI,
                functionName: 'balanceOf',
                args: [account.address],
            });
            const currentBalance = BigInt((currentWBNBBalance === null || currentWBNBBalance === void 0 ? void 0 : currentWBNBBalance.toString()) || '0');
            fs_1.logger.info(`   当前WBNB余额: ${currentBalance.toString()}`);
            fs_1.logger.info(`   需要WBNB数量: ${requiredAmount.toString()}`);
            if (currentBalance < requiredAmount) {
                const needToWrap = requiredAmount - currentBalance;
                fs_1.logger.info(`   需要包装 ${needToWrap.toString()} BNB 为 WBNB`);
                // 执行BNB包装
                const { request } = yield publicClient.simulateContract({
                    address: WBNB_ADDRESS,
                    abi: WBNB_ABI,
                    functionName: 'deposit',
                    args: [],
                    value: needToWrap,
                    account
                });
                const txHash = yield walletClient.writeContract(request);
                fs_1.logger.info(`   ✅ BNB包装交易哈希: ${txHash}`);
                // 等待包装交易确认
                yield publicClient.waitForTransactionReceipt({
                    hash: txHash
                });
                fs_1.logger.success(`   ✅ BNB包装成功，获得 ${needToWrap.toString()} WBNB`);
                // 短暂等待确保余额更新
                yield sleep(2000);
            }
            else {
                fs_1.logger.success(`   ✅ WBNB余额充足，无需包装`);
            }
        }
        catch (error) {
            fs_1.logger.error(`   ❌ BNB包装失败:`, error instanceof Error ? error.message : String(error));
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
            const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
            // 检查当前批准额度
            const allowanceResult = yield publicClient.readContract({
                address: tokenAddress,
                abi: minimalERC20Abi,
                functionName: 'allowance',
                args: [account.address, spender],
            });
            const currentAllowance = BigInt((allowanceResult === null || allowanceResult === void 0 ? void 0 : allowanceResult.toString()) || '0');
            fs_1.logger.info(`   当前批准额度 ${tokenAddress.slice(0, 8)}...: ${currentAllowance.toString()}`);
            if (currentAllowance < amountBigInt) {
                fs_1.logger.info(`   需要批准 ${tokenAddress.slice(0, 8)}... 支出，当前额度不足`);
                // 批准 2倍数量以减少未来的批准交易
                const approveAmount = amountBigInt * BigInt(2);
                const { request } = yield publicClient.simulateContract({
                    address: tokenAddress,
                    abi: minimalERC20Abi,
                    functionName: 'approve',
                    args: [spender, approveAmount],
                    account
                });
                const txHash = yield walletClient.writeContract(request);
                fs_1.logger.info(`   ✅ 批准交易哈希: ${txHash}`);
                // 等待批准交易确认
                yield publicClient.waitForTransactionReceipt({
                    hash: txHash
                });
                fs_1.logger.success(`   ✅ ${tokenAddress.slice(0, 8)}... 批准成功`);
                // 短暂等待确保链状态更新
                yield sleep(2000);
            }
            else {
                fs_1.logger.success(`   ✅ ${tokenAddress.slice(0, 8)}... 批准额度充足，无需重新批准`);
            }
        }
        catch (error) {
            fs_1.logger.error(`   ❌ 批准 ${tokenAddress} 失败:`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    });
}
