import { initializeRouter } from "./const";
import { debugLiquidity, checkPancakeSwapLiquidity } from "./debug-liquidity";

async function main() {
  console.log("🧪 开始调试流动性问题...");
  
  try {
    // 初始化路由器
    await initializeRouter();
    
    // 调试当前路由器的流动性
    await debugLiquidity();
    
    // 检查 PancakeSwap 作为备选
    await checkPancakeSwapLiquidity();
    
  } catch (error) {
    console.error("调试失败:", error);
  }
}

main().catch(console.error);
