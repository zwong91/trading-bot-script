import { createPublicClient, http, formatUnits } from "viem";
import { bscTestnet } from "viem/chains";
import { config } from "dotenv";
import { ChainId, WNATIVE } from "@lb-xyz/sdk-core";
import { LB_ROUTER_V22_ADDRESS } from "@lb-xyz/sdk-v2";

config();

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});

const walletAddress = "0xE0A051f87bb78f38172F633449121475a193fC1A";
const usdcAddress = "0x64544969ed7EBf5f083679233325356EbE738930";
const usdtAddress = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
const wbnbAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

// ETH address on BSC testnet - This is Ethereum Token (ETH) wrapped on BSC
// get this token from BSC testnet faucets or bridges
const ethAddress = "0x8babbb98678facc7342735486c851abd7a0d17ca"; // ETH on BSC testnet

const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
];

async function checkTokenBalance(tokenAddress: string, tokenName: string) {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [walletAddress],
    });

    const decimals = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals",
      args: [],
    });

    const symbol = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "symbol",
      args: [],
    });

    console.log(`💰 ${tokenName} (${symbol})余额:`, formatUnits(balance as bigint, decimals as number), symbol);
    return { balance: balance as bigint, decimals: decimals as number, symbol: symbol as string };
  } catch (error) {
    console.log(`❌ ${tokenName}余额检查失败:`, (error as Error).message);
    return null;
  }
}

async function analyzeETHAvailability() {
  console.log("\n🔍 ETH代币详细分析:");
  console.log("-".repeat(40));
  
  try {
    // 检查ETH代币是否真实存在
    const name = await publicClient.readContract({
      address: ethAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "name",
      args: [],
    });
    
    console.log(`   ✅ ETH代币合约有效: ${name}`);
    console.log(`   📋 合约地址: ${ethAddress}`);
    
    // 提供获取ETH的具体建议
    console.log("\n💡 如何获取ETH代币:");
    console.log("   方法1 - PancakeSwap兑换:");
    console.log(`      1. 访问 https://pancakeswap.finance/swap`);
    console.log(`      2. 选择BSC测试网`);
    console.log(`      3. 用USDT/USDC/BNB兑换ETH`);
    console.log(`      4. ETH合约地址: ${ethAddress}`);
    
    console.log("\n   方法2 - 使用交易机器人:");
    console.log(`      npm run trade -- --from USDT --to ETH --amount 1`);
    
  } catch (error) {
    console.log(`   ❌ ETH代币合约无效或不存在: ${(error as Error).message}`);
    console.log("   💡 建议:");
    console.log("      1. 验证ETH代币合约地址");
    console.log("      2. 检查是否在正确的网络上");
    console.log("      3. 寻找其他可用的ETH代币合约");
  }
}

async function checkBalances() {
  try {
    console.log("🔍 检查钱包余额...");
    console.log("钱包地址:", walletAddress);
    console.log("网络: BSC测试网");
    console.log("=".repeat(50));

    // 检查原生BNB余额
    const bnbBalance = await publicClient.getBalance({
      address: walletAddress as `0x${string}`,
    });
    console.log("🪙 BNB余额:", formatUnits(bnbBalance, 18), "BNB");
    
    console.log("-".repeat(30));

    // 检查各种代币余额并收集结果
    const tokenResults = [];
    
    const wbnbResult = await checkTokenBalance(wbnbAddress, "Wrapped BNB");
    tokenResults.push({ name: "WBNB", result: wbnbResult });
    
    const usdcResult = await checkTokenBalance(usdcAddress, "USD Coin");
    tokenResults.push({ name: "USDC", result: usdcResult });
    
    const usdtResult = await checkTokenBalance(usdtAddress, "Tether USD");
    tokenResults.push({ name: "USDT", result: usdtResult });
    
    const ethResult = await checkTokenBalance(ethAddress, "Ethereum");
    tokenResults.push({ name: "ETH", result: ethResult });

    console.log("=".repeat(50));
    console.log("✅ 余额检查完成");

    // 特别分析ETH代币状态
    console.log("\n🔍 ETH代币分析:");
    if (ethResult && ethResult.balance > BigInt(0)) {
      const ethAmount = formatUnits(ethResult.balance, ethResult.decimals);
      console.log(`   ✅ 当前ETH余额: ${ethAmount} ${ethResult.symbol}`);
      console.log("   📊 ETH可用于:");
      console.log("      - 与其他代币进行交易对");
      console.log("      - 参与流动性挖矿");
      console.log("      - 跨链桥接操作");
    } else {
      console.log("   ❌ 当前ETH余额为0");
      console.log("   💡 获取ETH代币的方法:");
      console.log("      1. 使用跨链桥从以太坊主网桥接ETH到BSC");
      console.log("      2. 在PancakeSwap用其他代币兑换ETH");
      console.log("      3. 使用BSC测试网水龙头(如果有ETH选项)");
      console.log("      4. 从交易所提取ETH到BSC网络");
      console.log(`   🔗 ETH代币合约: ${ethAddress}`);
    }

    // 检查是否有足够资金进行测试
    const minBnbForGas = 0.01; // 最少需要0.01 BNB用于gas费
    const bnbAmount = parseFloat(formatUnits(bnbBalance, 18));
    
    console.log("\n📊 资金状态分析:");
    if (bnbAmount >= minBnbForGas) {
      console.log("✅ BNB余额充足，可以支付gas费");
    } else {
      console.log("⚠️  BNB余额不足，建议从水龙头获取更多BNB");
      console.log("   水龙头地址: https://testnet.binance.org/faucet-smart");
    }

    // 显示代币可用性摘要
    console.log("\n🎯 代币可用性摘要:");
    tokenResults.forEach(({ name, result }) => {
      if (result && result.balance > BigInt(0)) {
        const amount = formatUnits(result.balance, result.decimals);
        console.log(`   ✅ ${name}: ${amount} ${result.symbol} (可用于交易)`);
      } else if (result) {
        console.log(`   ❌ ${name}: 0 ${result.symbol} (余额为零)`);
      } else {
        console.log(`   ❓ ${name}: 检查失败或代币不存在`);
      }
    });

  } catch (error) {
    console.error("❌ 检查余额失败:", error);
  }
}

async function main() {  
  // 检查余额
  await checkBalances();
  
  // 分析ETH代币可用性
  await analyzeETHAvailability();
}

main();