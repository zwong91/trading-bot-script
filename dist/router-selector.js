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
exports.PANCAKE_INFINITY_CONFIG = void 0;
exports.selectBestRouter = selectBestRouter;
exports.getRouterInterface = getRouterInterface;
exports.getRouterFallback = getRouterFallback;
const sdk_v2_1 = require("@lb-xyz/sdk-v2");
function selectBestRouter(chainId, mode, publicClient) {
    return __awaiter(this, void 0, void 0, function* () {
        // TraderJoe 路由器地址
        const traderJoeRouter = sdk_v2_1.LB_ROUTER_V22_ADDRESS[chainId];
        // PancakeSwap Infinity 路由器地址 (最新版本)
        const pancakeInfinityRouter = mode === "dev"
            ? "0x1b81D678ffb9C0263b24A97847620C99d213eB14" // BSC测试网 Infinity Router
            : "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4"; // BSC主网 Infinity Router
        // PancakeSwap V2 路由器地址 (稳定版本)
        const pancakeV2Router = mode === "dev"
            ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // BSC测试网 V2
            : "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // BSC主网 V2
        console.log("🔍 路由器选择分析 (包含所有选项):");
        console.log("=".repeat(50));
        // 检查 PancakeSwap V2 路由器
        const pancakeV2Valid = yield checkRouterValidity(pancakeV2Router, "PancakeSwap V2", publicClient);
        // 检查 PancakeSwap Infinity 路由器
        const infinityValid = yield checkRouterValidity(pancakeInfinityRouter, "PancakeSwap Infinity", publicClient);
        // 检查 TraderJoe 路由器
        const traderJoeValid = yield checkRouterValidity(traderJoeRouter, "TraderJoe", publicClient);
        // 选择策略 - 测试网优先使用TraderJoe V2.2 (自己的流动性)
        if (traderJoeValid) {
            console.log("🎯 选择策略: 使用 TraderJoe V2.2");
            return {
                address: traderJoeRouter,
                type: "traderjoe",
                name: "TraderJoe V2.2",
                isValid: true
            };
        }
        else if (infinityValid) {
            console.log("🎯 选择策略: 使用 PancakeSwap Infinity (最佳流动性和智能路由)");
            return {
                address: pancakeInfinityRouter,
                type: "pancakeswap-infinity",
                name: "PancakeSwap Infinity",
                isValid: true
            };
        }
        else if (pancakeV2Valid) {
            console.log("🎯 选择策略: 使用 PancakeSwap V2 (最后备用选项, 其他路由器不可用)");
            return {
                address: pancakeV2Router,
                type: "pancakeswap",
                name: "PancakeSwap V2",
                isValid: true
            };
        }
        else {
            console.log("❌ 错误: 没有可用的路由器!");
            throw new Error("No valid router available");
        }
    });
}
function checkRouterValidity(routerAddress, routerName, publicClient) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`\n🔍 检查 ${routerName} 路由器:`);
            console.log(`   地址: ${routerAddress}`);
            // 检查是否为零地址
            if (!routerAddress || routerAddress === "0x0000000000000000000000000000000000000000") {
                console.log(`   ❌ ${routerName}: 零地址或未定义`);
                return false;
            }
            // 检查地址格式
            if (!/^0x[a-fA-F0-9]{40}$/.test(routerAddress)) {
                console.log(`   ❌ ${routerName}: 地址格式无效`);
                return false;
            }
            // 检查是否为合约地址
            const bytecode = yield publicClient.getBytecode({
                address: routerAddress,
            });
            if (!bytecode || bytecode === "0x") {
                console.log(`   ❌ ${routerName}: 地址不是合约地址`);
                return false;
            }
            console.log(`   ✅ ${routerName}: 有效的合约地址`);
            console.log(`   📊 字节码长度: ${bytecode.length} 字符`);
            // 特别为 PancakeSwap Infinity 添加额外验证
            if (routerName.includes("Infinity")) {
                console.log(`   🚀 ${routerName}: 支持智能路由和最佳价格发现`);
            }
            return true;
        }
        catch (error) {
            console.log(`   ❌ ${routerName}: 检查失败 - ${error}`);
            return false;
        }
    });
}
// 路由器兼容性检查
function getRouterInterface(routerType) {
    if (routerType === "traderjoe") {
        return {
            swapFunction: "swapExactTokensForTokens",
            approveFunction: "approve",
            needsBinSteps: true,
            needsVersions: true,
            supportsSmartRouting: false
        };
    }
    else if (routerType === "pancakeswap-infinity") {
        return {
            swapFunction: "exactInputSingle", // Infinity 使用 V3 风格的接口
            approveFunction: "approve",
            needsBinSteps: false,
            needsVersions: false,
            supportsSmartRouting: true,
            supportsBestPriceRouting: true,
            supportsMultiHop: true
        };
    }
    else {
        return {
            swapFunction: "swapExactTokensForTokens",
            approveFunction: "approve",
            needsBinSteps: false,
            needsVersions: false,
            supportsSmartRouting: false
        };
    }
}
// 获取路由器回退配置
function getRouterFallback(mode) {
    // 使用 PancakeSwap Infinity 作为主要选择
    return mode === "dev"
        ? "0x1b81D678ffb9C0263b24A97847620C99d213eB14" // PancakeSwap Infinity 测试网
        : "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4"; // PancakeSwap Infinity 主网
}
// PancakeSwap Infinity 专用配置
exports.PANCAKE_INFINITY_CONFIG = {
    testnet: {
        router: "0x1b81D678ffb9C0263b24A97847620C99d213eB14",
        factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
        weth: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        quoter: "0xbC203d7f83677c7ed3F7acEc959963E7F4ECC5C2"
    },
    mainnet: {
        router: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
        factory: "0x41ff9AA7e16B8B1a8a8dc4f0eFacd93D02d071c9",
        weth: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        quoter: "0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997"
    }
};
