/**
 * TraderJoe V2.2 BNB-USDC 流动性演示
 * 快速测试TraderJoe在BSC上的BNB-USDC流动性添加功能
 */

import { addLiquidityBNBUSDC } from './addLiquidity';
import { logger } from './fs';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const MODE = process.env.MODE || 'dev';

/**
 * 演示TraderJoe BNB-USDC流动性添加
 */
async function demoTraderJoeBNBUSDC(): Promise<void> {
    try {
        logger.info("🚀 TraderJoe V2.2 BNB-USDC 流动性演示");
        logger.info(`   环境: ${MODE === "dev" ? "BSC测试网" : "BSC主网"}`);
        
        // 演示参数 - 使用较小的金额进行测试
        const binStep = "25";        // 0.25% 费率，适合BNB-USDC
        const bnbAmount = "0.005";   // 0.005 BNB
        const usdcAmount = "1.0";    // 1 USDC
        
        logger.info("\n📋 演示参数:");
        logger.info(`   Bin Step: ${binStep} (${Number(binStep) / 100}% 费率)`);
        logger.info(`   BNB数量: ${bnbAmount} BNB`);
        logger.info(`   USDC数量: ${usdcAmount} USDC`);
        
        logger.info("\n🔄 开始执行流动性添加...");
        
        // 执行TraderJoe BNB-USDC流动性添加
        const txHash = await addLiquidityBNBUSDC(
            binStep,
            bnbAmount, 
            usdcAmount
        );
        
        logger.success("🎉 TraderJoe BNB-USDC 流动性添加成功!");
        logger.success(`   交易哈希: ${txHash}`);
        
        // 显示区块链浏览器链接
        if (MODE === "dev") {
            logger.info(`   查看交易: https://testnet.bscscan.com/tx/${txHash}`);
        } else {
            logger.info(`   查看交易: https://bscscan.com/tx/${txHash}`);
        }
        
        logger.info("\n✨ 演示完成! 你已成功使用TraderJoe V2.2在BSC上添加了BNB-USDC流动性");
        
    } catch (error) {
        logger.error("❌ TraderJoe BNB-USDC演示失败:");
        logger.error(`   错误: ${error instanceof Error ? error.message : String(error)}`);
        
        // 提供故障排除提示
        logger.info("\n🔧 故障排除提示:");
        logger.info("   1. 检查钱包是否有足够的BNB和USDC余额");
        logger.info("   2. 确认网络连接和RPC节点状态");
        logger.info("   3. 验证私钥配置正确");
        logger.info("   4. 检查代币合约地址是否正确");
        
        throw error;
    }
}

/**
 * 显示TraderJoe V2.2特点
 */
function showTraderJoeInfo(): void {
    logger.info("\n📚 TraderJoe V2.2 Liquidity Book 介绍:");
    logger.info("   🎯 创新技术: 基于Bin的集中流动性");
    logger.info("   💰 动态费率: 根据市场波动自动调整");
    logger.info("   ⚡ 高效资本: 比传统AMM提供更好的资本效率");
    logger.info("   🛡️  风险管理: 减少无常损失，提供更好的风险控制");
    logger.info("   🎁 激励机制: 流动性提供者可获得JOE代币奖励");
    
    logger.info("\n💡 适用场景:");
    logger.info("   • DeFi协议流动性管理");
    logger.info("   • 做市商策略实现"); 
    logger.info("   • 自动化交易策略");
    logger.info("   • 资产管理和收益优化");
}

/**
 * 主函数
 */
async function main(): Promise<void> {
    try {
        // 显示TraderJoe信息
        showTraderJoeInfo();
        
        // 执行演示
        await demoTraderJoeBNBUSDC();
        
    } catch (error) {
        logger.error("演示过程中发生错误:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// 仅在直接运行此文件时执行
if (require.main === module) {
    main().catch((error) => {
        logger.error("未捕获的错误:", error);
        process.exit(1);
    });
}

export { demoTraderJoeBNBUSDC, showTraderJoeInfo };
