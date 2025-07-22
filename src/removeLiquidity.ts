import { ChainId, Token, TokenAmount } from '@lb-xyz/sdk-core';
import { PairV2, LB_ROUTER_V22_ADDRESS, jsonAbis, } from '@lb-xyz/sdk-v2'
import {
    createPublicClient,
    createWalletClient,
    http,
    parseUnits,
    getContract,
    BaseError,
    ContractFunctionRevertedError,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc, bscTestnet } from 'viem/chains';
import { config } from 'dotenv';
import { CHAIN_ID } from './const';

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
const router = LB_ROUTER_V22_ADDRESS[CHAIN_ID]
const { LBRouterV22ABI, LBPairV21ABI } = jsonAbis

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

const USDC = new Token(
  CHAIN_ID,
  MODE === "dev"
    ? "0x64544969ed7EBf5f083679233325356EbE738930" // BSC测试网USDC (PancakeSwap测试)
    : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC主网USDC
  18,
  "USDC",
  "USD Coin",
);

const USDT = new Token(
  CHAIN_ID,
  MODE === "dev" 
    ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" // BSC测试网USDT (PancakeSwap测试)
    : "0x55d398326f99059fF775485246999027B3197955", // BSC主网USDT
  18,
  "USDT",
  "Tether USD",
);

// Bin step for DLMM V2.2
const BIN_STEP = "1";

/**
 * 移除 DLMM V2.2 USDC-USDT 流动性
 * @param {string} liquidityPercentage - 要移除的流动性百分比 (如 "50" 表示 50%)
 * @param {number} slippagePercent - 滑点容忍度百分比 (如 0.5 表示 0.5%)
 * @returns {Promise<string>} - 交易哈希
 */
export async function removeLiquidityUSDCUSDT(
    liquidityPercentage: string = "100",
    slippagePercent: number = 0.5
): Promise<string> {
    try {
        console.log("🏊‍♀️ 开始移除 DLMM V2.2 USDC-USDT 流动性");
        console.log("   网络:", MODE === "dev" ? "BSC 测试网" : "BSC 主网");
        console.log("   移除比例:", `${liquidityPercentage}%`);
        console.log("   滑点容忍度:", `${slippagePercent}%`);

        const pair = new PairV2(USDC, USDT)
        const binStep = Number(BIN_STEP)
        const pairVersion = 'v22'
        const lbPair = await pair.fetchLBPair(binStep, pairVersion, publicClient, CHAIN_ID)
        if (lbPair.LBPair == "0x0000000000000000000000000000000000000000") {
            console.log("No LB pair found with given parameters")
            throw new Error("DLMM USDC-USDT 流动性池不存在");
        }
        const lbPairData = await PairV2.getLBPairReservesAndId(lbPair.LBPair, pairVersion, publicClient)
        const activeBinId = Number(lbPairData.activeId)

        console.log("   当前活跃bin ID:", activeBinId);
        
        const range = 200 // should be enough in most cases
        const addressArray = Array.from({ length: 2 * range + 1 }).fill(account.address);
        const binsArray = [];
        for (let i = activeBinId - range; i <= activeBinId + range; i++) {
            binsArray.push(i);
        }
        
        const allBins: bigint[] = await publicClient.readContract({
            address: lbPair.LBPair,
            abi: LBPairV21ABI,
            functionName: 'balanceOfBatch',
            args: [addressArray, binsArray]
        }) as bigint[];
        const userOwnedBins = binsArray.filter((bin, index) => allBins[index] != BigInt(0));
        const nonZeroAmounts = allBins.filter(amount => amount !== BigInt(0));
      
        const approved = await publicClient.readContract({
            address: lbPair.LBPair,
            abi: LBPairV21ABI,
            functionName: 'isApprovedForAll',
            args: [account.address, router]
        })

        if (!approved) {
            const { request } = await publicClient.simulateContract({
                address: lbPair.LBPair,
                abi: LBPairV21ABI,
                functionName: 'approveForAll',
                args: [router, true],
                account
            })
            const hashApproval = await walletClient.writeContract(request)
            console.log(`🔄 授权交易已发送，哈希: ${hashApproval}`)
            
            // 等待授权交易确认
            await publicClient.waitForTransactionReceipt({ 
                hash: hashApproval,
                timeout: 60000
            });
            console.log("✅ 授权成功!");
        }
        
        // set transaction deadline
        const currentTimeInSec =  Math.floor((new Date().getTime()) / 1000)

        // set array of remove liquidity parameters
        const removeLiquidityInput = {
            tokenX: USDT.address,
            tokenY: USDC.address,
            binStep: Number(BIN_STEP),
            amountXmin: 0,
            amountYmin: 0,
            ids: userOwnedBins,
            amounts: nonZeroAmounts,
            to: account.address,
            deadline: currentTimeInSec + 3600
        }

        const { request } = await publicClient.simulateContract({
            address: router,
            abi: LBRouterV22ABI,
            functionName: "removeLiquidity",
            args: [
                removeLiquidityInput.tokenX,
                removeLiquidityInput.tokenY,
                removeLiquidityInput.binStep,
                removeLiquidityInput.amountXmin, //zero in this example
                removeLiquidityInput.amountYmin, //zero in this example
                removeLiquidityInput.ids,
                removeLiquidityInput.amounts,
                removeLiquidityInput.to,
                removeLiquidityInput.deadline],
            account
        })
        const removalHash = await walletClient.writeContract(request)
        console.log(`🔄 交易已发送，哈希: ${removalHash}`)
        
        // 等待交易确认
        const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: removalHash,
            timeout: 60000 // 60秒超时
        });
        
        if (receipt.status === 'success') {
            console.log("✅ 流动性移除成功!");
            console.log(`📊 交易详情: https://testnet.bscscan.com/tx/${removalHash}`);
            return removalHash;
        } else {
            throw new Error("交易失败");
        }
        
    } catch (error: any) {
        console.error("❌ 移除流动性失败:", error);
        
        if (error instanceof BaseError) {
            const revertError = error.walk(err => err instanceof ContractFunctionRevertedError);
            if (revertError instanceof ContractFunctionRevertedError) {
                const errorName = revertError.data?.errorName ?? 'Unknown';
                console.error(`📋 合约错误: ${errorName}`);
                throw new Error(`合约执行失败: ${errorName}`);
            }
        }
        
        throw error;
    }
}