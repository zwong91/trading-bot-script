import { logger, LogLevel } from "./fs";

/**
 * 测试友善的日志系统
 */
async function testFriendlyLogger() {
  console.log("🧪 测试友善的日志系统...");
  console.log("=".repeat(50));
  
  // 测试不同级别的日志
  logger.info("系统启动成功，欢迎使用交易机器人！");
  
  logger.success("🎉 交易执行成功！获利 0.5 USDT");
  
  logger.warn("⚠️  Gas 费用较高，建议等待网络拥堵缓解");
  
  logger.error("网络连接超时，正在重试...");
  
  logger.debug("调试信息：当前路由器地址 0x1234...");
  
  // 测试专门的日志类型
  console.log("\n📊 测试专门的日志类型...");
  
  logger.trade({
    action: "swap",
    from: "USDT",
    to: "BNB",
    amount: "10.5",
    price: "0.0034",
    timestamp: new Date().toISOString()
  });
  
  logger.wallet({
    action: "generate_new_wallet",
    address: "0xabcd1234...",
    balance: "0.0",
    timestamp: new Date().toISOString()
  });
  
  logger.database({
    action: "query",
    table: "transactions", 
    records: 51,
    execution_time: "125ms"
  });
  
  // 测试对象和数组记录
  console.log("\n📋 测试复杂数据记录...");
  
  const tradeResult = {
    success: true,
    transaction: {
      hash: "0x8880c4a38c871425b4be3e781fdb3bb54d7766ce709a37dd997e4edbc7e36294",
      gasUsed: "21000",
      gasPrice: "5000000000"
    },
    tokens: ["USDT", "WBNB", "ETH"],
    amounts: [100, 0.034, 0.012]
  };
  
  logger.info(tradeResult);
  
  // 测试错误处理
  console.log("\n🚨 测试错误处理...");
  
  try {
    logger.error("这是一个测试错误", undefined, true);
  } catch (error) {
    console.log("✅ 错误抛出机制正常工作");
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("🎯 日志系统测试完成!");
  console.log("📁 日志文件位置:");
  console.log("   - 应用日志: ./logs/app.log");
  console.log("   - 交易日志: ./logs/trading.log"); 
  console.log("   - 钱包日志: ./logs/wallet.log");
  console.log("   - 数据库日志: ./logs/database.log");
  
  console.log("\n💡 使用方法:");
  console.log("   - logger.info('消息')    - 普通信息");
  console.log("   - logger.success('消息') - 成功操作");
  console.log("   - logger.warn('消息')    - 警告信息");
  console.log("   - logger.error('消息')   - 错误信息");
  console.log("   - logger.debug('消息')   - 调试信息");
  console.log("   - logger.trade(数据)     - 交易记录");
  console.log("   - logger.wallet(数据)    - 钱包记录");
  console.log("   - logger.database(数据)  - 数据库记录");
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testFriendlyLogger().catch(console.error);
}

export { testFriendlyLogger };
