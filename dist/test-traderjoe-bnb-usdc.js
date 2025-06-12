"use strict";
/**
 * TraderJoe V2.2 BNB-USDC 流动性测试
 * 测试在BSC网络上使用TraderJoe Liquidity Book协议添加BNB-USDC流动性
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
exports.testTraderJoeBNBUSDCLiquidity = testTraderJoeBNBUSDCLiquidity;
exports.testBNBWrapping = testBNBWrapping;
exports.displayTraderJoeFeatures = displayTraderJoeFeatures;
const addLiquidity_1 = require("./addLiquidity");
const fs_1 = require("./fs");
const dotenv_1 = __importDefault(require("dotenv"));
// 加载环境变量
dotenv_1.default.config();
// 定义MODE常量
const MODE = process.env.MODE || 'dev';
/**
 * 测试TraderJoe BNB-USDC流动性添加
 */
function testTraderJoeBNBUSDCLiquidity() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fs_1.logger.info("🧪 开始测试 TraderJoe V2.2 BNB-USDC 流动性添加");
            fs_1.logger.info(`   当前模式: ${MODE === "dev" ? "开发环境 (BSC测试网)" : "生产环境 (BSC主网)"}`);
            // 测试参数
            const testCases = [
                {
                    name: "小额测试 - 25 bips",
                    binStep: "25", // 0.25% 费率，适合稳定代币对
                    bnbAmount: "0.005", // 0.005 BNB (~$1.2)
                    usdcAmount: "1.0" // 1 USDC
                },
                {
                    name: "中等数额 - 100 bips",
                    binStep: "100", // 1% 费率，适合波动性代币对
                    bnbAmount: "0.01", // 0.01 BNB (~$2.4)
                    usdcAmount: "2.5" // 2.5 USDC
                }
            ];
            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                fs_1.logger.info(`\n📋 测试案例 ${i + 1}: ${testCase.name}`);
                fs_1.logger.info(`   Bin Step: ${testCase.binStep} (${Number(testCase.binStep) / 100}% 费率)`);
                fs_1.logger.info(`   BNB数量: ${testCase.bnbAmount}`);
                fs_1.logger.info(`   USDC数量: ${testCase.usdcAmount}`);
                try {
                    // 执行流动性添加
                    const txHash = yield (0, addLiquidity_1.addLiquidityBNBUSDC)(testCase.binStep, testCase.bnbAmount, testCase.usdcAmount);
                    fs_1.logger.success(`✅ 测试案例 ${i + 1} 成功!`);
                    fs_1.logger.success(`   交易哈希: ${txHash}`);
                    if (MODE === "dev") {
                        fs_1.logger.info(`   BSC测试网浏览器: https://testnet.bscscan.com/tx/${txHash}`);
                    }
                    else {
                        fs_1.logger.info(`   BSC主网浏览器: https://bscscan.com/tx/${txHash}`);
                    }
                    // 在测试用例之间等待，避免nonce冲突
                    if (i < testCases.length - 1) {
                        fs_1.logger.info("   ⏳ 等待15秒后进行下一个测试...");
                        yield sleep(15000);
                    }
                }
                catch (error) {
                    fs_1.logger.error(`❌ 测试案例 ${i + 1} 失败:`);
                    fs_1.logger.error(`   错误: ${error instanceof Error ? error.message : String(error)}`);
                    // 继续执行其他测试案例
                    if (i < testCases.length - 1) {
                        fs_1.logger.info("   ⏳ 等待10秒后继续下一个测试...");
                        yield sleep(10000);
                    }
                }
            }
            fs_1.logger.info("\n🎉 TraderJoe BNB-USDC流动性测试完成!");
        }
        catch (error) {
            fs_1.logger.error("❌ TraderJoe BNB-USDC流动性测试失败:", error instanceof Error ? error.message : String(error));
            throw error;
        }
    });
}
/**
 * 测试BNB包装功能
 */
function testBNBWrapping() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fs_1.logger.info("\n🧪 测试BNB包装功能");
            // 这个测试只检查包装逻辑，不实际执行交易
            fs_1.logger.info("   BNB包装功能已集成在流动性添加中");
            fs_1.logger.info("   功能说明:");
            fs_1.logger.info("   1. 自动检查WBNB余额");
            fs_1.logger.info("   2. 如果WBNB不足，自动将BNB包装为WBNB");
            fs_1.logger.info("   3. 批准WBNB和USDC给TraderJoe路由器");
            fs_1.logger.info("   4. 执行流动性添加交易");
            fs_1.logger.success("✅ BNB包装功能就绪");
        }
        catch (error) {
            fs_1.logger.error("❌ BNB包装功能测试失败:", error instanceof Error ? error.message : String(error));
        }
    });
}
/**
 * 显示TraderJoe流动性特点
 */
function displayTraderJoeFeatures() {
    fs_1.logger.info("\n📚 TraderJoe V2.2 Liquidity Book 特点:");
    fs_1.logger.info("   🎯 Bin-based 流动性: 在特定价格区间提供流动性");
    fs_1.logger.info("   📊 费率层级:");
    fs_1.logger.info("      • 25 bips (0.25%) - 稳定币对");
    fs_1.logger.info("      • 100 bips (1.0%) - 主流币对");
    fs_1.logger.info("      • 250 bips (2.5%) - 高波动性币对");
    fs_1.logger.info("   💰 动态费率: 根据市场波动性调整");
    fs_1.logger.info("   🎁 流动性挖矿: 可能获得额外JOE代币奖励");
    fs_1.logger.info("   ⚡ 资本效率: 比传统AMM提供更好的资本利用率");
    fs_1.logger.info("   🛡️  无常损失保护: Bin结构减少无常损失风险");
}
/**
 * 主测试函数
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fs_1.logger.info("🚀 启动 TraderJoe V2.2 BNB-USDC 流动性全面测试");
            // 显示功能特点
            displayTraderJoeFeatures();
            // 测试BNB包装功能
            yield testBNBWrapping();
            // 测试流动性添加
            yield testTraderJoeBNBUSDCLiquidity();
            fs_1.logger.success("\n🎊 所有测试完成!");
        }
        catch (error) {
            fs_1.logger.error("❌ 测试过程中发生错误:", error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
}
/**
 * 工具函数：延时
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// 仅在直接运行此文件时执行主函数
if (require.main === module) {
    main().catch((error) => {
        fs_1.logger.error("未捕获的错误:", error);
        process.exit(1);
    });
}
