"use strict";
/**
 * TraderJoe V2.2 BNB-USDC 流动性演示
 * 快速测试TraderJoe在BSC上的BNB-USDC流动性添加功能
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoTraderJoeBNBUSDC = demoTraderJoeBNBUSDC;
exports.showTraderJoeInfo = showTraderJoeInfo;
const addLiquidity_1 = require("./addLiquidity");
const fs_1 = require("./fs");
const dotenv_1 = __importDefault(require("dotenv"));
// 加载环境变量
dotenv_1.default.config();
const MODE = process.env.MODE || 'dev';
/**
 * 演示TraderJoe BNB-USDC流动性添加
 */
function demoTraderJoeBNBUSDC() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fs_1.logger.info("🚀 TraderJoe V2.2 BNB-USDC 流动性演示");
            fs_1.logger.info(`   环境: ${MODE === "dev" ? "BSC测试网" : "BSC主网"}`);
            // 演示参数 - 使用较小的金额进行测试
            const binStep = "25"; // 0.25% 费率，适合BNB-USDC
            const bnbAmount = "0.005"; // 0.005 BNB
            const usdcAmount = "1.0"; // 1 USDC
            fs_1.logger.info("\n📋 演示参数:");
            fs_1.logger.info(`   Bin Step: ${binStep} (${Number(binStep) / 100}% 费率)`);
            fs_1.logger.info(`   BNB数量: ${bnbAmount} BNB`);
            fs_1.logger.info(`   USDC数量: ${usdcAmount} USDC`);
            fs_1.logger.info("\n🔄 开始执行流动性添加...");
            // 执行TraderJoe BNB-USDC流动性添加
            const txHash = yield (0, addLiquidity_1.addLiquidityBNBUSDC)(binStep, bnbAmount, usdcAmount);
            fs_1.logger.success("🎉 TraderJoe BNB-USDC 流动性添加成功!");
            fs_1.logger.success(`   交易哈希: ${txHash}`);
            // 显示区块链浏览器链接
            if (MODE === "dev") {
                fs_1.logger.info(`   查看交易: https://testnet.bscscan.com/tx/${txHash}`);
            }
            else {
                fs_1.logger.info(`   查看交易: https://bscscan.com/tx/${txHash}`);
            }
            fs_1.logger.info("\n✨ 演示完成! 你已成功使用TraderJoe V2.2在BSC上添加了BNB-USDC流动性");
        }
        catch (error) {
            fs_1.logger.error("❌ TraderJoe BNB-USDC演示失败:");
            fs_1.logger.error(`   错误: ${error instanceof Error ? error.message : String(error)}`);
            // 提供故障排除提示
            fs_1.logger.info("\n🔧 故障排除提示:");
            fs_1.logger.info("   1. 检查钱包是否有足够的BNB和USDC余额");
            fs_1.logger.info("   2. 确认网络连接和RPC节点状态");
            fs_1.logger.info("   3. 验证私钥配置正确");
            fs_1.logger.info("   4. 检查代币合约地址是否正确");
            throw error;
        }
    });
}
/**
 * 显示TraderJoe V2.2特点
 */
function showTraderJoeInfo() {
    fs_1.logger.info("\n📚 TraderJoe V2.2 Liquidity Book 介绍:");
    fs_1.logger.info("   🎯 创新技术: 基于Bin的集中流动性");
    fs_1.logger.info("   💰 动态费率: 根据市场波动自动调整");
    fs_1.logger.info("   ⚡ 高效资本: 比传统AMM提供更好的资本效率");
    fs_1.logger.info("   🛡️  风险管理: 减少无常损失，提供更好的风险控制");
    fs_1.logger.info("   🎁 激励机制: 流动性提供者可获得JOE代币奖励");
    fs_1.logger.info("\n💡 适用场景:");
    fs_1.logger.info("   • DeFi协议流动性管理");
    fs_1.logger.info("   • 做市商策略实现");
    fs_1.logger.info("   • 自动化交易策略");
    fs_1.logger.info("   • 资产管理和收益优化");
}
/**
 * 主函数
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 显示TraderJoe信息
            showTraderJoeInfo();
            // 执行演示
            yield demoTraderJoeBNBUSDC();
        }
        catch (error) {
            fs_1.logger.error("演示过程中发生错误:", error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
}
// 仅在直接运行此文件时执行
if (require.main === module) {
    main().catch((error) => {
        fs_1.logger.error("未捕获的错误:", error);
        process.exit(1);
    });
}
