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
exports.selectBestRouter = selectBestRouter;
exports.getRouterInterface = getRouterInterface;
exports.getRouterFallback = getRouterFallback;
const sdk_v2_1 = require("@traderjoe-xyz/sdk-v2");
function selectBestRouter(chainId, mode, publicClient) {
    return __awaiter(this, void 0, void 0, function* () {
        // TraderJoe 路由器地址
        const traderJoeRouter = sdk_v2_1.LB_ROUTER_V21_ADDRESS[chainId];
        // PancakeSwap 路由器地址
        const pancakeRouter = mode === "dev"
            ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // BSC测试网
            : "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // BSC主网
        console.log("🔍 路由器选择分析:");
        console.log("=".repeat(50));
        // 检查 TraderJoe 路由器
        const traderJoeValid = yield checkRouterValidity(traderJoeRouter, "TraderJoe", publicClient);
        // 检查 PancakeSwap 路由器
        const pancakeValid = yield checkRouterValidity(pancakeRouter, "PancakeSwap", publicClient);
        // 选择策略 - 在测试网上优先使用 PancakeSwap (更好的流动性)
        if (mode === "dev" && pancakeValid) {
            console.log("🎯 选择策略: BSC测试网优先使用 PancakeSwap (更好的流动性)");
            return {
                address: pancakeRouter,
                type: "pancakeswap",
                name: "PancakeSwap V2",
                isValid: true
            };
        }
        else if (traderJoeValid && pancakeValid) {
            console.log("🎯 选择策略: 两个路由器都可用，优先使用 TraderJoe");
            return {
                address: traderJoeRouter,
                type: "traderjoe",
                name: "TraderJoe V2.1",
                isValid: true
            };
        }
        else if (traderJoeValid) {
            console.log("🎯 选择策略: 仅 TraderJoe 可用");
            return {
                address: traderJoeRouter,
                type: "traderjoe",
                name: "TraderJoe V2.1",
                isValid: true
            };
        }
        else if (pancakeValid) {
            console.log("🎯 选择策略: 仅 PancakeSwap 可用");
            return {
                address: pancakeRouter,
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
            needsVersions: true
        };
    }
    else {
        return {
            swapFunction: "swapExactTokensForTokens",
            approveFunction: "approve",
            needsBinSteps: false,
            needsVersions: false
        };
    }
}
// 获取路由器回退配置
function getRouterFallback(mode) {
    return mode === "dev"
        ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // PancakeSwap测试网
        : "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap主网
}
