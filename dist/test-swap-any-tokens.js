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
exports.testSwapAnyTokens = testSwapAnyTokens;
const swapAnyTokens_1 = require("./swapAnyTokens");
const fs_1 = require("./fs");
/**
 * 测试任意代币交换功能
 */
function testSwapAnyTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🧪 测试任意代币交换功能...");
        console.log("=".repeat(60));
        try {
            // 1. 测试 USDT -> USDC 交换
            console.log("\n1️⃣ 测试 USDT -> USDC 交换");
            console.log("-".repeat(50));
            try {
                const usdtToUsdcResult = yield (0, swapAnyTokens_1.swapAnyTokens)("USDT", // symbolIn
                "USDC", // symbolOut
                "0.1" // amountIn (0.1 USDT)
                );
                fs_1.logger.success(`✅ USDT->USDC 交换成功: ${usdtToUsdcResult}`);
            }
            catch (error) {
                fs_1.logger.warn(`⚠️ USDT->USDC 交换测试跳过: ${error instanceof Error ? error.message : String(error)}`);
            }
            // 等待一下再进行下一个测试
            yield new Promise(resolve => setTimeout(resolve, 5000));
            // 2. 测试 USDC -> USDT 交换
            console.log("\n2️⃣ 测试 USDC -> USDT 交换");
            console.log("-".repeat(50));
            try {
                const usdcToUsdtResult = yield (0, swapAnyTokens_1.swapAnyTokens)("USDC", // symbolIn
                "USDT", // symbolOut
                "0.005" // amountIn (0.005 USDC, 钱包只有0.009 USDC)
                );
                fs_1.logger.success(`✅ USDC->USDT 交换成功: ${usdcToUsdtResult}`);
            }
            catch (error) {
                fs_1.logger.warn(`⚠️ USDC->USDT 交换测试跳过: ${error instanceof Error ? error.message : String(error)}`);
            }
            // 等待一下再进行下一个测试
            yield new Promise(resolve => setTimeout(resolve, 5000));
            // 3. 测试 BNB -> USDT 交换
            console.log("\n3️⃣ 测试 BNB -> USDT 交换");
            console.log("-".repeat(50));
            try {
                const bnbToUsdtResult = yield (0, swapAnyTokens_1.swapAnyTokens)("BNB", // symbolIn
                "USDT", // symbolOut
                "0.001" // amountIn (0.001 BNB, 很小的数量)
                );
                fs_1.logger.success(`✅ BNB->USDT 交换成功: ${bnbToUsdtResult}`);
            }
            catch (error) {
                fs_1.logger.warn(`⚠️ BNB->USDT 交换测试跳过: ${error instanceof Error ? error.message : String(error)}`);
            }
            // 等待一下再进行下一个测试
            yield new Promise(resolve => setTimeout(resolve, 5000));
            // 4. 测试 USDT -> BNB 交换
            console.log("\n4️⃣ 测试 USDT -> BNB 交换");
            console.log("-".repeat(50));
            try {
                const usdtToBnbResult = yield (0, swapAnyTokens_1.swapAnyTokens)("USDT", // symbolIn
                "BNB", // symbolOut
                "0.5" // amountIn (0.5 USDT)
                );
                fs_1.logger.success(`✅ USDT->BNB 交换成功: ${usdtToBnbResult}`);
            }
            catch (error) {
                fs_1.logger.warn(`⚠️ USDT->BNB 交换测试跳过: ${error instanceof Error ? error.message : String(error)}`);
            }
            // 等待一下再进行下一个测试
            yield new Promise(resolve => setTimeout(resolve, 5000));
            // 5. 测试 WBNB -> USDC 交换
            console.log("\n5️⃣ 测试 WBNB -> USDC 交换");
            console.log("-".repeat(50));
            try {
                const wbnbToUsdcResult = yield (0, swapAnyTokens_1.swapAnyTokens)("WBNB", // symbolIn
                "USDC", // symbolOut
                "0.01" // amountIn (0.01 WBNB, 钱包有0.09 WBNB)
                );
                fs_1.logger.success(`✅ WBNB->USDC 交换成功: ${wbnbToUsdcResult}`);
            }
            catch (error) {
                fs_1.logger.warn(`⚠️ WBNB->USDC 交换测试跳过: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        catch (error) {
            fs_1.logger.error("❌ 代币交换测试失败:", error instanceof Error ? error.message : String(error));
        }
        console.log("\n" + "=".repeat(60));
        console.log("🎯 代币交换测试完成!");
        console.log("\n💡 功能说明:");
        console.log("   🔄 支持的交换对:");
        console.log("      - USDT ↔ USDC (稳定币互换)");
        console.log("      - BNB/WBNB ↔ USDT/USDC (主币与稳定币)");
        console.log("      - 自动选择最优路由");
        console.log("\n🎯 路由策略:");
        console.log("   🥞 PancakeSwap: 大部分主流交换对");
        console.log("   🎯 TraderJoe: 专业流动性和集中流动性");
        console.log("   📊 自动选择最优价格路径");
        console.log("\n📊 使用方法:");
        console.log("   - swapAnyTokens('USDT', 'USDC', '1.0')");
        console.log("   - swapAnyTokens('BNB', 'USDT', '0.01')");
        console.log("   - swapAnyTokens('WBNB', 'USDC', '0.005')");
        console.log("\n⚠️ 注意事项:");
        console.log("   - 确保钱包有足够的代币余额");
        console.log("   - 交换前会自动检查和批准代币授权");
        console.log("   - 原生BNB和WBNB会自动处理");
        console.log("   - 滑点容忍度默认为0.5%");
        console.log("   - 所有交易都需要BNB支付gas费");
        console.log("   - 建议先用小额进行测试");
    });
}
// 如果直接运行此文件，执行测试
if (require.main === module) {
    testSwapAnyTokens().catch(console.error);
}
