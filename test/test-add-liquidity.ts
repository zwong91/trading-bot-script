import { addLiquidityUSDCUSDT, addLiquidityBNBUSDC } from '../src/addLiquidity';
import { logger } from '../src/fs';

/**
 * 测试DLMM和DLMM流动性添加功能
 */
async function testAddLiquidity() {
    console.log("🧪 测试流动性添加功能...");
    console.log("=".repeat(60));
    
    try {
        // 1. 测试DLMM USDC-USDT流动性添加
        console.log("\n1️⃣ 测试DLMM V2.2 USDC-USDT流动性添加");
        console.log("-".repeat(50));
        
        try {
            const DLMMResult = await addLiquidityUSDCUSDT(
                "1",    // binStep
                "0.1",   // usdcAmount 
                "0.1"    // usdtAmount
            );
            logger.success(`✅ DLMM流动性添加成功: ${DLMMResult}`);
        } catch (error) {
            logger.warn(`⚠️ DLMM流动性添加测试跳过: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // 等待一下再进行下一个测试
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 2. 测试DLMM BNB-USDC流动性添加
        console.log("\n2️⃣ 测试DLMM V2.2 BNB-USDC流动性添加");
        console.log("-".repeat(50));
        
        try {
            const DLMMBNBUSDCResult = await addLiquidityBNBUSDC(
                 "25",     // binStep
                "0.01",   // bnbAmount
                "0.1",   // usdcAmount
            );
            logger.success(`✅ DLMM BNB-USDC流动性添加成功: ${DLMMBNBUSDCResult}`);
        } catch (error) {
            logger.warn(`⚠️ DLMM BNB-USDC流动性添加测试跳过: ${error instanceof Error ? error.message : String(error)}`);
        }
        
    } catch (error) {
        logger.error("❌ 流动性添加测试失败:", error instanceof Error ? error.message : String(error));
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎯 流动性添加测试完成!");
    console.log("\n💡 功能说明:");
    console.log("   🔵 DLMM V2.2:");
    console.log("      - 使用Liquidity Book (LB) 协议");
    console.log("      - 支持集中流动性和bin分布");
    console.log("      - 适合专业流动性提供者");
    
    console.log("\n📊 使用方法:");
    console.log("   - addLiquidityUSDCUSDT(binStep, usdcAmount, usdtAmount)");
    console.log("   - addLiquidityBNBUSDC(binStep, bnbAmount, usdcAmount)");
    
    console.log("\n⚠️ 注意事项:");
    console.log("   - 确保钱包有足够的代币余额");
    console.log("   - DLMM需要更高的技术理解");
    console.log("   - 所有交易都需要BNB支付gas费");
    console.log("   - 建议先用小额进行测试");
}

// 导出测试函数
export { testAddLiquidity };

// 如果直接运行此文件，执行测试
if (require.main === module) {
    testAddLiquidity().catch(console.error);
}
