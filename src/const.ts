import {
  ChainId,
  WNATIVE,
  Token,
} from "@traderjoe-xyz/sdk-core";

import { LB_ROUTER_V21_ADDRESS } from "@traderjoe-xyz/sdk-v2";

import {
  createPublicClient,
  createWalletClient,
  http,
} from "viem";

import { privateKeyToAccount } from "viem/accounts";
import { bsc, bscTestnet } from "viem/chains";
import { config } from "dotenv";
import { selectBestRouter, getRouterFallback } from "./router-selector";

config();
const { PRIVATE_KEY, MODE } = process.env;
const chain = MODE === "dev" ? bscTestnet : bsc;
const CHAIN_ID = MODE === "dev" ? ChainId.BNB_TESTNET : ChainId.BNB_CHAIN;

const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

const publicClient = createPublicClient({
  chain: chain,
  transport: http(),
});

const mainWalletClient = createWalletClient({
  account,
  chain: chain,
  transport: http(),
});

// 动态路由器配置
let routerConfig: any = null;
let router: `0x${string}` = "0x0000000000000000000000000000000000000000";

async function initializeRouter() {
  try {
    console.log("🔧 初始化动态路由器选择...");
    routerConfig = await selectBestRouter(CHAIN_ID, MODE || "dev", publicClient);
    router = routerConfig.address as `0x${string}`;
    
    console.log("\n🎉 路由器初始化完成:");
    console.log("   选择的路由器:", routerConfig.name);
    console.log("   路由器地址:", router);
    console.log("   路由器类型:", routerConfig.type);
    console.log("=".repeat(50));
    
    return routerConfig;
  } catch (error) {
    console.error("❌ 动态路由器选择失败，使用备用路由器");
    router = getRouterFallback(MODE || "dev") as `0x${string}`;
    routerConfig = {
      address: router,
      type: "pancakeswap",
      name: "PancakeSwap V2 (Fallback)",
      isValid: true
    };
    console.log("🔄 使用备用 PancakeSwap 路由器:", router);
    return routerConfig;
  }
}

// 为了保持向后兼容，提供静态路由器作为后备
const staticRouter = LB_ROUTER_V21_ADDRESS[CHAIN_ID as keyof typeof LB_ROUTER_V21_ADDRESS] || getRouterFallback(MODE || "dev");
if (!router || router === "0x0000000000000000000000000000000000000000") {
  router = staticRouter as `0x${string}`;
}

console.log("🔍 当前路由器状态:");
console.log("   链ID:", CHAIN_ID);
console.log("   静态路由器地址:", staticRouter);
console.log("   当前使用路由器:", router);

// initialize tokens
const WBNB = WNATIVE[CHAIN_ID]; // Token instance of WBNB
const USDC = new Token(
  CHAIN_ID,
  MODE === "dev"
    ? "0x64544969ed7EBf5f083679233325356EbE738930" // BSC测试网USDC (PancakeSwap测试)
    : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC主网USDC
  18,
  "USDC",
  "USD Coin",
);

const USDT = new Token(
  CHAIN_ID,
  MODE === "dev" 
    ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" // BSC测试网USDT (PancakeSwap测试)
    : "0x55d398326f99059fF775485246999027B3197955", // BSC主网USDT
  18,
  "USDT",
  "Tether USD",
);

// declare bases used to generate trade routes
const BASES = [WBNB, USDC, USDT];

// Please update these values only
const assetParams = {
  [WBNB.symbol!]: {
    min: 0.01,   // 提高到 0.01 BNB 以满足验证要求
    max: 0.05,   // 提高到 0.05 BNB
  },
  [USDC.symbol!]: {
    min: 0.1,    // 保持 0.1 USDC
    max: 1.0,    // 提高到 1.0 USDC
  },
  [USDT.symbol!]: {
    min: 0.1,
    max: 1.0,    // 提高到 1.0 USDT
  },
};
const wallets_count = 2;

export {
  BASES,
  publicClient,
  mainWalletClient,
  CHAIN_ID,
  account,
  router,
  routerConfig,
  chain,
  assetParams,
  wallets_count,
  initializeRouter,
};
