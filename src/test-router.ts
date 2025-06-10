import { initializeRouter, CHAIN_ID, routerConfig } from "./const";

async function testRouterSelection() {
  console.log("🧪 测试动态路由器选择...");
  console.log("=".repeat(50));
  
  try {
    const config = await initializeRouter();
    
    console.log("\n📊 路由器选择结果:");
    console.log("   选择的路由器:", config.name);
    console.log("   路由器地址:", config.address);
    console.log("   路由器类型:", config.type);
    console.log("   是否有效:", config.isValid);
    console.log("   链ID:", CHAIN_ID);
    
    if (config.isValid) {
      console.log("\n✅ 动态路由器选择测试成功!");
      console.log("🚀 现在可以安全地运行交易机器人");
    } else {
      console.log("\n⚠️  路由器可能存在问题，请检查网络连接");
    }
    
  } catch (error) {
    console.error("\n❌ 动态路由器选择测试失败:", error);
    console.log("🔄 建议手动检查路由器配置或网络连接");
  }
}

// 主函数
async function main() {
  await testRouterSelection();
  
  console.log("\n" + "=".repeat(50));
  console.log("💡 提示:");
  console.log("   - 如果测试成功，可以运行: npm run init");
  console.log("   - 如果失败，请检查网络连接或代币地址");
  console.log("   - 系统会自动在TraderJoe和PancakeSwap之间选择");
}

main().catch(console.error);
