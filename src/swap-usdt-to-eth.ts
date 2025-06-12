import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from "viem";
import { bscTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";

config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment variables");
}

const account = privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`);

const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http()
});

const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http()
});

// 合约地址
const PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const USDT = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
const ETH = "0x8babbb98678facc7342735486c851abd7a0d17ca";

// 路由器 ABI
const ROUTER_ABI = [
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

// ERC20 ABI
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

async function approveToken(tokenAddress: string, spenderAddress: string, amount: bigint) {
  const currentAllowance = await publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, spenderAddress as `0x${string}`]
  });

  if ((currentAllowance as bigint) < amount) {
    console.log(`🔓 批准 ${tokenAddress} 使用权限...`);
    const { request } = await publicClient.simulateContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, amount],
      account
    });

    const approvalHash = await walletClient.writeContract(request);
    console.log(`✅ 批准交易哈希: ${approvalHash}`);
    
    await publicClient.waitForTransactionReceipt({ 
      hash: approvalHash as `0x${string}` 
    });
    console.log("✅ 批准完成");
  } else {
    console.log("✅ 代币已获得足够的使用权限");
  }
}

async function swapUSDTToETH() {
  try {
    console.log("🔄 开始 USDT → WBNB → ETH 多跳交易");
    console.log("=".repeat(50));
    
    const amountIn = parseUnits("1", 18); // 1 USDT
    const path = [USDT, WBNB, ETH];
    const slippage = 0.5; // 0.5% 滑点
    
    console.log("交易参数:");
    console.log(`   输入: ${formatUnits(amountIn, 18)} USDT`);
    console.log(`   路径: USDT → WBNB → ETH`);
    console.log(`   滑点: ${slippage}%`);
    
    // 1. 获取预期输出
    const amounts = await publicClient.readContract({
      address: PANCAKE_ROUTER as `0x${string}`,
      abi: ROUTER_ABI,
      functionName: "getAmountsOut",
      args: [amountIn, path as `0x${string}`[]]
    });
    
    const expectedAmountOut = (amounts as bigint[])[2]; // ETH 输出量
    const minAmountOut = expectedAmountOut * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
    
    console.log(`💸 预期输出: ${formatUnits(expectedAmountOut, 18)} ETH`);
    console.log(`🛡️ 最小输出: ${formatUnits(minAmountOut, 18)} ETH`);
    
    // 2. 批准 USDT
    await approveToken(USDT, PANCAKE_ROUTER, amountIn);
    
    // 3. 执行交易
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30分钟后过期
    
    console.log("\n🚀 执行多跳交易...");
    const { request } = await publicClient.simulateContract({
      address: PANCAKE_ROUTER as `0x${string}`,
      abi: ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [
        amountIn,
        minAmountOut,
        path as `0x${string}`[],
        account.address,
        deadline
      ],
      account
    });
    
    const txHash = await walletClient.writeContract(request);
    console.log(`✅ 交易已发送: ${txHash}`);
    
    // 4. 等待确认
    console.log("⏳ 等待交易确认...");
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash as `0x${string}` 
    });
    
    console.log(`🎉 交易成功确认!`);
    console.log(`   区块号: ${receipt.blockNumber}`);
    console.log(`   Gas 使用量: ${receipt.gasUsed}`);
    console.log("=".repeat(50));
    
    console.log("🔍 请运行余额检查脚本验证 ETH 余额变化:");
    console.log("   npm run build && node dist/check-balance.js");
    
  } catch (error) {
    console.error("❌ 多跳交易失败:", error);
  }
}

swapUSDTToETH();
