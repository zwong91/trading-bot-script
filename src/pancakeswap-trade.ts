import { Token, TokenAmount, Percent } from "@traderjoe-xyz/sdk-core";
import { parseUnits, WalletClient } from "viem";
import { publicClient, CHAIN_ID } from "./const";
import { getNonce, getUnixTime } from "./utils";
import log from "./fs";
import { insertDB, txn_sql } from "./database";

// ERC20 ABI for approval
const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// PancakeSwap V2 Router ABI (简化版本，只包含需要的方法)
const PANCAKE_ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactETHForTokens",
    "outputs": [
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForETH",
    "outputs": [
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface PancakeSwapRouteParams {
  amount: string;
  inputToken: Token;
  outputToken: Token;
  isNativeIn: boolean;
  isNativeOut: boolean;
}

interface PancakeSwapRoute {
  amountIn: bigint;
  inputToken: Token;
  outputToken: Token;
  isNativeIn: boolean;
  isNativeOut: boolean;
  path: string[];
  expectedAmountOut: bigint;
}

export function getPancakeSwapRoute(routeParams: PancakeSwapRouteParams): PancakeSwapRoute {
  try {
    const { amount, inputToken, outputToken, isNativeIn, isNativeOut } = routeParams;
    
    // 解析输入金额
    const amountIn = parseUnits(amount, inputToken.decimals);
    
    // 构建交易路径
    const path: string[] = [];
    
    if (isNativeIn) {
      // BNB -> Token: [WBNB, Token]
      path.push(inputToken.address);
      path.push(outputToken.address);
    } else if (isNativeOut) {
      // Token -> BNB: [Token, WBNB]
      path.push(inputToken.address);
      path.push(outputToken.address);
    } else {
      // Token -> Token: [TokenA, TokenB] 或 [TokenA, WBNB, TokenB]
      if (inputToken.address.toLowerCase() !== outputToken.address.toLowerCase()) {
        path.push(inputToken.address);
        path.push(outputToken.address);
      } else {
        throw new Error("Input and output tokens cannot be the same");
      }
    }
    
    console.log("🛣️ PancakeSwap 路径:", path);
    console.log("💰 输入金额:", amount, inputToken.symbol);
    
    return {
      amountIn,
      inputToken,
      outputToken,
      isNativeIn,
      isNativeOut,
      path,
      expectedAmountOut: BigInt(0) // 将在交易前获取实际报价
    };
    
  } catch (error) {
    console.error("❌ PancakeSwap 路径生成失败:", error);
    throw new Error("Error generating PancakeSwap route");
  }
}

export async function tradePancakeSwap(
  walletClient: WalletClient, 
  route: PancakeSwapRoute, 
  routerAddress: string
) {
  try {
    const account = walletClient.account!;
    const { amountIn, inputToken, outputToken, isNativeIn, isNativeOut, path } = route;
    
    console.log("🥞 执行 PancakeSwap 交易:");
    console.log("   路由器:", routerAddress);
    console.log("   输入:", inputToken.symbol, "->", outputToken.symbol);
    
    // 如果不是原生代币输入，需要先批准代币支出
    if (!isNativeIn) {
      await approveTokenIfNeeded(walletClient, inputToken.address, routerAddress, amountIn);
    }
    
    // 获取预期输出金额
    const amountsOut = await publicClient.readContract({
      address: routerAddress as `0x${string}`,
      abi: PANCAKE_ROUTER_ABI,
      functionName: "getAmountsOut",
      args: [amountIn, path as `0x${string}`[]]
    });
    
    const expectedAmountOut = amountsOut[amountsOut.length - 1];
    const slippageTolerance = 0.005; // 0.5% 滑点
    const amountOutMin = expectedAmountOut * BigInt(Math.floor((1 - slippageTolerance) * 10000)) / BigInt(10000);
    
    console.log("   预期输出:", expectedAmountOut.toString());
    console.log("   最小输出:", amountOutMin.toString());
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes
    let nonce = await getNonce(account.address);
    
    let hash: string;
    
    if (isNativeIn) {
      // BNB -> Token
      const { request } = await publicClient.simulateContract({
        address: routerAddress as `0x${string}`,
        abi: PANCAKE_ROUTER_ABI,
        functionName: "swapExactETHForTokens",
        args: [amountOutMin, path as `0x${string}`[], account.address, deadline],
        account,
        value: amountIn,
        nonce,
      });
      hash = await walletClient.writeContract(request);
    } else if (isNativeOut) {
      // Token -> BNB
      const { request } = await publicClient.simulateContract({
        address: routerAddress as `0x${string}`,
        abi: PANCAKE_ROUTER_ABI,
        functionName: "swapExactTokensForETH",
        args: [amountIn, amountOutMin, path as `0x${string}`[], account.address, deadline],
        account,
        nonce,
      });
      hash = await walletClient.writeContract(request);
    } else {
      // Token -> Token
      const { request } = await publicClient.simulateContract({
        address: routerAddress as `0x${string}`,
        abi: PANCAKE_ROUTER_ABI,
        functionName: "swapExactTokensForTokens",
        args: [amountIn, amountOutMin, path as `0x${string}`[], account.address, deadline],
        account,
        nonce,
      });
      hash = await walletClient.writeContract(request);
    }
    
    // 计算实际输出金额用于显示
    const actualAmountOut = expectedAmountOut;
    const actualAmountOutFormatted = (Number(actualAmountOut) / Math.pow(10, outputToken.decimals)).toFixed(6);
    const amountInFormatted = (Number(amountIn) / Math.pow(10, inputToken.decimals)).toFixed(6);
    
    let txn_data = [
      hash,
      account.address,
      inputToken.symbol,
      outputToken.symbol,
      amountInFormatted,
      actualAmountOutFormatted,
      getUnixTime(),
    ];
    
    log(
      `${trim(account.address)} PancakeSwap Swap ${amountInFormatted} ${inputToken.symbol} for ${actualAmountOutFormatted} ${outputToken.symbol} \nTransaction sent with hash ${hash} \n\n`,
    );
    
    await insertDB(txn_sql, txn_data);
    
    await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
    
  } catch (error) {
    log(`PancakeSwap 交易失败: ${error} \n\n`);
    throw new Error("Error executing PancakeSwap trade");
  }
}

// 检查并批准代币支出
async function approveTokenIfNeeded(
  walletClient: WalletClient,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint
) {
  try {
    const account = walletClient.account!;
    
    // 检查当前批准额度
    const currentAllowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [account.address, spenderAddress as `0x${string}`]
    });
    
    console.log("   当前批准额度:", currentAllowance.toString());
    console.log("   需要额度:", amount.toString());
    
    // 如果当前批准额度不足，进行批准
    if (currentAllowance < amount) {
      console.log("   📝 批准代币支出...");
      
      const nonce = await getNonce(account.address);
      const { request } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spenderAddress as `0x${string}`, amount * BigInt(2)], // 批准2倍金额以避免频繁批准
        account,
        nonce,
      });
      
      const approveHash = await walletClient.writeContract(request);
      console.log("   ✅ 批准交易哈希:", approveHash);
      
      // 等待批准交易确认
      await publicClient.waitForTransactionReceipt({ hash: approveHash as `0x${string}` });
      console.log("   ✅ 代币批准成功");
    } else {
      console.log("   ✅ 批准额度充足，无需重新批准");
    }
  } catch (error) {
    console.error("   ❌ 代币批准失败:", error);
    throw new Error("Token approval failed");
  }
}

function trim(address: string, startLength = 7, endLength = 5) {
  const truncatedStart = address.slice(0, startLength);
  const truncatedEnd = address.slice(-endLength);
  return truncatedStart + "..." + truncatedEnd;
}
