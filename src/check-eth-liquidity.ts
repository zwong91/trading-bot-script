import { createPublicClient, http, parseUnits, formatUnits } from "viem";
import { bscTestnet } from "viem/chains";
import { config } from "dotenv";

config();

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});

// PancakeSwap V2 路由器和工厂合约
const PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const PANCAKE_FACTORY = "0x6725f303b657a9124d3a6a756bc30c0bb72c9d3c";

// 代币地址
const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const USDT = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
const USDC = "0x64544969ed7EBf5f083679233325356EbE738930";
const ETH = "0x8babbb98678facc7342735486c851abd7a0d17ca";

// 路由器 ABI
const ROUTER_ABI = [
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
] as const;

// 工厂 ABI
const FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" }
    ],
    "name": "getPair",
    "outputs": [
      { "internalType": "address", "name": "pair", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

async function checkPairExistence(token0: string, token1: string, label: string) {
  try {
    const pair = await publicClient.readContract({
      address: PANCAKE_FACTORY as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: "getPair",
      args: [token0 as `0x${string}`, token1 as `0x${string}`]
    });
    
    const exists = pair !== "0x0000000000000000000000000000000000000000";
    console.log(`${exists ? '✅' : '❌'} ${label}: ${pair}`);
    return exists;
  } catch (error) {
    console.log(`❌ ${label}: 检查失败`);
    return false;
  }
}

async function checkRoute(path: string[], amount: string, label: string) {
  try {
    const amountIn = parseUnits(amount, 18);
    const amounts = await publicClient.readContract({
      address: PANCAKE_ROUTER as `0x${string}`,
      abi: ROUTER_ABI,
      functionName: "getAmountsOut",
      args: [amountIn, path as `0x${string}`[]]
    });
    
    const amountOut = formatUnits((amounts as bigint[])[path.length - 1], 18);
    console.log(`✅ ${label}: ${amount} → ${amountOut}`);
    return true;
  } catch (error) {
    console.log(`❌ ${label}: 无流动性或路径无效`);
    return false;
  }
}

async function findETHRoutes() {
  console.log("🔍 检查 BSC 测试网上的 ETH 代币流动性");
  console.log("=".repeat(60));
  
  console.log("\n📊 检查交易对存在性:");
  await checkPairExistence(ETH, WBNB, "ETH-WBNB 交易对");
  await checkPairExistence(ETH, USDT, "ETH-USDT 交易对");
  await checkPairExistence(ETH, USDC, "ETH-USDC 交易对");
  await checkPairExistence(WBNB, USDT, "WBNB-USDT 交易对");
  await checkPairExistence(WBNB, USDC, "WBNB-USDC 交易对");
  await checkPairExistence(USDT, USDC, "USDT-USDC 交易对");
  
  console.log("\n🛣️ 检查可能的交易路径:");
  
  // 直接路径
  await checkRoute([USDT, ETH], "1", "USDT → ETH (直接)");
  await checkRoute([USDC, ETH], "1", "USDC → ETH (直接)");
  await checkRoute([WBNB, ETH], "0.01", "WBNB → ETH (直接)");
  
  // 通过 WBNB 的路径
  await checkRoute([USDT, WBNB, ETH], "1", "USDT → WBNB → ETH");
  await checkRoute([USDC, WBNB, ETH], "1", "USDC → WBNB → ETH");
  
  // 通过 USDC 的路径
  await checkRoute([USDT, USDC, ETH], "1", "USDT → USDC → ETH");
  
  console.log("\n💡 建议:");
  console.log("1. 如果没有直接的ETH交易对，可能需要:");
  console.log("   - 使用多跳路径 (如 USDT → WBNB → ETH)");
  console.log("   - 检查ETH代币地址是否正确");
  console.log("   - 在BSC测试网上添加ETH流动性");
  
  console.log("\n🔗 代币地址验证:");
  console.log(`   WBNB: ${WBNB}`);
  console.log(`   USDT: ${USDT}`);
  console.log(`   USDC: ${USDC}`);
  console.log(`   ETH:  ${ETH}`);
  
  console.log("\n" + "=".repeat(60));
}

findETHRoutes();
