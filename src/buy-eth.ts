import { tradePancakeSwap, getPancakeSwapRoute } from "./pancakeswap-trade";
import { publicClient, account } from "./const";
import { createWalletClient, http, parseUnits } from "viem";
import { bscTestnet } from "viem/chains";
import { Token } from "@lb-xyz/sdk-core";

// 创建钱包客户端
const walletClient = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(),
});

// 定义代币
const USDT = new Token(
  97, // BSC 测试网
  "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
  18,
  "USDT",
  "Tether USD"
);

const ETH = new Token(
  97, // BSC 测试网
  "0x8babbb98678facc7342735486c851abd7a0d17ca",
  18,
  "ETH", 
  "Ethereum Token"
);

async function buyETHWithUSDT() {
  try {
    console.log("🔄 准备用 USDT 购买 ETH 代币...");
    console.log("=".repeat(50));
    
    // 准备交易参数
    const amount = "1"; // 1 USDT
    
    console.log("交易详情:");
    console.log(`   输入: ${amount} USDT`);
    console.log(`   输出: ETH`);
    console.log(`   路径: ${USDT.symbol} -> ${ETH.symbol}`);
    console.log(`   USDT地址: ${USDT.address}`);
    console.log(`   ETH地址: ${ETH.address}`);
    
    // 使用 PancakeSwap V2 路由器
    const router = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
    
    // 获取正确格式的路由信息
    const pancakeRoute = getPancakeSwapRoute({
      amount: amount,
      inputToken: USDT,
      outputToken: ETH,
      isNativeIn: false,
      isNativeOut: false,
    });
    
    console.log("\n🚀 开始执行交易...");
    await tradePancakeSwap(walletClient, pancakeRoute, router);
    
    console.log("✅ USDT -> ETH 交易完成!");
    console.log("🔍 请运行余额检查脚本验证 ETH 余额变化");
    
  } catch (error) {
    console.error("❌ 交易失败:", error);
  }
}

buyETHWithUSDT();
