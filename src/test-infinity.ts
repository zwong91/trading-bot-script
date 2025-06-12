import { selectBestRouter, PANCAKE_INFINITY_CONFIG } from "./router-selector";
import { publicClient, CHAIN_ID } from "./const";
import { config } from "dotenv";

config();

async function testPancakeInfinity() {
  console.log("🧪 测试 PancakeSwap Infinity 路由器选择");
  console.log("=".repeat(60));
  
  const MODE = process.env.MODE || "dev";
  
  try {
    // 测试路由器选择
    const routerConfig = await selectBestRouter(CHAIN_ID, MODE, publicClient);
    
    console.log("\n📊 路由器测试结果:");
    console.log(`   类型: ${routerConfig.type}`);
    console.log(`   名称: ${routerConfig.name}`);
    console.log(`   地址: ${routerConfig.address}`);
    console.log(`   有效: ${routerConfig.isValid ? '✅' : '❌'}`);
    
    // 显示 PancakeSwap Infinity 配置
    const config_network = MODE === "dev" ? PANCAKE_INFINITY_CONFIG.testnet : PANCAKE_INFINITY_CONFIG.mainnet;
    
    console.log("\n🚀 PancakeSwap Infinity 配置:");
    console.log(`   环境: ${MODE === "dev" ? "BSC测试网" : "BSC主网"}`);
    console.log(`   路由器: ${config_network.router}`);
    console.log(`   工厂: ${config_network.factory}`);
    console.log(`   WETH: ${config_network.weth}`);
    console.log(`   报价器: ${config_network.quoter}`);
    
    if (routerConfig.type === "pancakeswap-infinity") {
      console.log("\n🎉 成功! PancakeSwap Infinity 路由器已启用");
      console.log("   ✅ 支持智能路由");
      console.log("   ✅ 支持最佳价格发现");
      console.log("   ✅ 支持多跳交易");
      console.log("   ✅ 支持V3风格接口");
    } else {
      console.log("\n⚠️ 当前使用:", routerConfig.name);
      console.log("   PancakeSwap Infinity 不可用，使用备用路由器");
    }
    
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
  
  console.log("\n" + "=".repeat(60));
}

testPancakeInfinity();
