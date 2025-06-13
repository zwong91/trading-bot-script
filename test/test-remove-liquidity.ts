import { removeLiquidityUSDCUSDT } from '../src/removeLiquidity';

/**
 * 测试移除流动性功能
 */
async function testRemoveLiquidity() {
    try {
        console.log("🧪 开始测试移除流动性功能...");
        
        // 测试移除50%的流动性
        const txHash = await removeLiquidityUSDCUSDT("50", 0.5);
        
        console.log("✅ 测试成功完成!");
        console.log(`📋 交易哈希: ${txHash}`);
        
    } catch (error: any) {
        console.error("❌ 测试失败:", error.message);
        process.exit(1);
    }
}

// 只有直接运行此文件时才执行测试
if (require.main === module) {
    testRemoveLiquidity()
        .then(() => {
            console.log("🎉 所有测试通过!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 测试执行失败:", error);
            process.exit(1);
        });
}
