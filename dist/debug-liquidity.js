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
exports.debugLiquidity = debugLiquidity;
exports.checkPancakeSwapLiquidity = checkPancakeSwapLiquidity;
const sdk_core_1 = require("@traderjoe-xyz/sdk-core");
const sdk_v2_1 = require("@traderjoe-xyz/sdk-v2");
const viem_1 = require("viem");
const const_1 = require("./const");
const { LBRouterV21ABI, LBRouterV22ABI } = sdk_v2_1.jsonAbis;
function debugLiquidity() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🔍 调试流动性和路由状态:");
        console.log("   当前路由器:", const_1.router);
        console.log("   路由器配置:", const_1.routerConfig);
        console.log("   链ID:", const_1.CHAIN_ID);
        const [WBNB, USDC] = const_1.BASES;
        console.log("\n📊 代币信息:");
        console.log("   WBNB地址:", WBNB.address);
        console.log("   USDC地址:", USDC.address);
        try {
            // 测试小额交易路径
            const amount = "0.001"; // 0.001 WBNB
            const typedValueInParsed = (0, viem_1.parseUnits)(amount, WBNB.decimals);
            const amountIn = new sdk_core_1.TokenAmount(WBNB, typedValueInParsed);
            console.log("\n🔄 尝试生成交易路径:");
            console.log("   输入金额:", amountIn.toExact(), WBNB.symbol);
            console.log("   输出代币:", USDC.symbol);
            // 获取所有代币对
            const allTokenPairs = sdk_v2_1.PairV2.createAllTokenPairs(WBNB, USDC, const_1.BASES);
            console.log("   可用代币对数量:", allTokenPairs.length);
            // 初始化配对
            const allPairs = sdk_v2_1.PairV2.initPairs(allTokenPairs);
            console.log("   初始化配对数量:", allPairs.length);
            // 生成路径
            const allRoutes = sdk_v2_1.RouteV2.createAllRoutes(allPairs, WBNB, USDC);
            console.log("   可用路径数量:", allRoutes.length);
            if (allRoutes.length === 0) {
                console.log("❌ 没有找到可用的交易路径!");
                return;
            }
            // 获取交易报价
            console.log("\n💰 获取交易报价...");
            const trades = yield sdk_v2_1.TradeV2.getTradesExactIn(allRoutes, amountIn, USDC, true, // isNativeIn
            false, // isNativeOut
            const_1.publicClient, const_1.CHAIN_ID);
            const validTrades = trades.filter(trade => trade !== undefined);
            console.log("   有效交易数量:", validTrades.length);
            if (validTrades.length > 0) {
                const bestTrade = sdk_v2_1.TradeV2.chooseBestTrade(validTrades, true);
                if (bestTrade) {
                    console.log("✅ 找到最佳交易:");
                    console.log("   输入:", bestTrade.inputAmount.toExact(), bestTrade.inputAmount.token.symbol);
                    console.log("   输出:", bestTrade.outputAmount.toExact(), bestTrade.outputAmount.token.symbol);
                    console.log("   执行价格:", bestTrade.executionPrice.toSignificant(6));
                    console.log("   路径长度:", bestTrade.route.path.length);
                    // 获取费用信息
                    try {
                        const { totalFeePct, feeAmountIn } = yield bestTrade.getTradeFee();
                        console.log("   总费用:", totalFeePct.toSignificant(6), "%");
                        console.log("   费用金额:", feeAmountIn.toSignificant(6), feeAmountIn.token.symbol);
                    }
                    catch (feeError) {
                        console.log("   费用信息获取失败:", (feeError === null || feeError === void 0 ? void 0 : feeError.message) || feeError);
                    }
                }
            }
            else {
                console.log("❌ 没有找到有效的交易!");
            }
        }
        catch (error) {
            console.error("❌ 调试过程中出错:", error);
        }
    });
}
function checkPancakeSwapLiquidity() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n🥞 检查 PancakeSwap 流动性:");
        // PancakeSwap V2 Router on BSC Testnet
        const pancakeRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
        try {
            // 检查路由器合约是否存在
            const routerCode = yield const_1.publicClient.getBytecode({ address: pancakeRouter });
            console.log("   PancakeSwap 路由器有效:", routerCode && routerCode !== "0x");
            if (routerCode && routerCode !== "0x") {
                console.log("   PancakeSwap 路由器地址:", pancakeRouter);
                console.log("   建议切换到 PancakeSwap 进行 BSC 测试网交易");
            }
        }
        catch (error) {
            console.error("   PancakeSwap 路由器检查失败:", (error === null || error === void 0 ? void 0 : error.message) || error);
        }
    });
}
