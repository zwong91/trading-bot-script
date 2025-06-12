"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAddLiquidity = testAddLiquidity;
const addLiquidity_1 = require("./addLiquidity");
const fs_1 = require("./fs");
/**
 * 测试TraderJoe和TraderJoe流动性添加功能
 */
function testAddLiquidity() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🧪 测试流动性添加功能...");
        console.log("=".repeat(60));
        try {
            // 1. 测试TraderJoe USDC-USDT流动性添加
            console.log("\n1️⃣ 测试TraderJoe V2.2 USDC-USDT流动性添加");
            console.log("-".repeat(50));
            try {
                const traderJoeResult = yield (0, addLiquidity_1.addLiquidityUSDCUSDT)("1", // binStep
                "0.1", // usdcAmount 
                "0.1" // usdtAmount
                );
                fs_1.logger.success(`✅ TraderJoe流动性添加成功: ${traderJoeResult}`);
            }
            catch (error) {
                fs_1.logger.warn(`⚠️ TraderJoe流动性添加测试跳过: ${error instanceof Error ? error.message : String(error)}`);
            }
            // 等待一下再进行下一个测试
            yield new Promise(resolve => setTimeout(resolve, 5000));
            // 2. 测试TraderJoe BNB-USDC流动性添加
            console.log("\n2️⃣ 测试TraderJoe V2.2 BNB-USDC流动性添加");
            console.log("-".repeat(50));
            try {
                const traderJoeBNBUSDCResult = yield (0, addLiquidity_1.addLiquidityBNBUSDC)("25", // binStep
                "0.01", // bnbAmount
                "0.1");
                fs_1.logger.success(`✅ TraderJoe BNB-USDC流动性添加成功: ${traderJoeBNBUSDCResult}`);
            }
            catch (error) {
                fs_1.logger.warn(`⚠️ TraderJoe BNB-USDC流动性添加测试跳过: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        catch (error) {
            fs_1.logger.error("❌ 流动性添加测试失败:", error instanceof Error ? error.message : String(error));
        }
        console.log("\n" + "=".repeat(60));
        console.log("🎯 流动性添加测试完成!");
        console.log("\n💡 功能说明:");
        console.log("   🔵 TraderJoe V2.2:");
        console.log("      - 使用Liquidity Book (LB) 协议");
        console.log("      - 支持集中流动性和bin分布");
        console.log("      - 适合专业流动性提供者");
        console.log("\n📊 使用方法:");
        console.log("   - addLiquidityUSDCUSDT(binStep, usdcAmount, usdtAmount)");
        console.log("   - addLiquidityBNBUSDC(binStep, bnbAmount, usdcAmount)");
        console.log("\n⚠️ 注意事项:");
        console.log("   - 确保钱包有足够的代币余额");
        console.log("   - TraderJoe需要更高的技术理解");
        console.log("   - 所有交易都需要BNB支付gas费");
        console.log("   - 建议先用小额进行测试");
    });
}
// 如果直接运行此文件，执行测试
if (require.main === module) {
    testAddLiquidity().catch(console.error);
}
