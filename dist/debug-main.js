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
const const_1 = require("./const");
const debug_liquidity_1 = require("./debug-liquidity");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🧪 开始调试流动性问题...");
        try {
            // 初始化路由器
            yield (0, const_1.initializeRouter)();
            // 调试当前路由器的流动性
            yield (0, debug_liquidity_1.debugLiquidity)();
            // 检查 PancakeSwap 作为备选
            yield (0, debug_liquidity_1.checkPancakeSwapLiquidity)();
        }
        catch (error) {
            console.error("调试失败:", error);
        }
    });
}
main().catch(console.error);
