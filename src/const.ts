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

config();
const { PRIVATE_KEY, MODE } = process.env;
const chain = MODE === "dev" ? bscTestnet : bsc;
const CHAIN_ID = MODE === "dev" ? ChainId.BNB_TESTNET : ChainId.BNB_CHAIN;

const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
const router = LB_ROUTER_V21_ADDRESS[CHAIN_ID];
console.log("🔍 路由器检查:");
console.log("   链ID:", CHAIN_ID);
console.log("   路由器地址:", router);

// // 使用PancakeSwap路由器
// const router = MODE === "dev" 
//   ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // PancakeSwap V2 测试网路由器
//   : "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 主网路由器

// console.log("🔧 使用PancakeSwap路由器:");
// console.log("   环境:", MODE === "dev" ? "BSC测试网" : "BSC主网");
// console.log("   路由器地址:", router);
// console.log("   账户地址:", account.address);

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

/* Step 4 */
// declare bases used to generate trade routes
const BASES = [WBNB, USDC, USDT];

const publicClient = createPublicClient({
  chain: chain,
  transport: http(),
});

const mainWalletClient = createWalletClient({
  account,
  chain: chain,
  transport: http(),
});

// Please update these values only
const assetParams = {
  [WBNB.symbol!]: {
    min: 0.01,
    max: 0.1,
  },
  [USDC.symbol!]: {
    min: 0.1,
    max: 1,
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
  chain,
  assetParams,
  wallets_count,
};
