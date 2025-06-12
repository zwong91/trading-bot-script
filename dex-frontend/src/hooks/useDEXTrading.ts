import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// TraderJoe V2.2 Router ABI (minimal)
const ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'pairBinSteps', type: 'uint256[]' },
      { name: 'tokenPath', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' }
    ]
  },
  {
    name: 'addLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'binStep', type: 'uint256' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'activeIdDesired', type: 'int256' },
      { name: 'idSlippage', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' }
    ]
  }
] as const;

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool' }
    ]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  }
] as const;

// Token addresses on BSC Testnet
export const TOKEN_ADDRESSES = {
  WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  USDC: '0x64544969ed7EBf5f083679233325356EbE738930',
  USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
} as const;

// TraderJoe V2.2 Router address on BSC Testnet
export const ROUTER_ADDRESS = '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30' as const;

interface SwapParams {
  fromToken: keyof typeof TOKEN_ADDRESSES;
  toToken: keyof typeof TOKEN_ADDRESSES;
  amount: string;
  slippage?: number;
}

interface LiquidityParams {
  tokenA: keyof typeof TOKEN_ADDRESSES;
  tokenB: keyof typeof TOKEN_ADDRESSES;
  amountA: string;
  amountB: string;
}

interface Quote {
  amountOut: string;
  priceImpact: string;
  fee: string;
}

export function useDEXTrading() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Reset error when starting new transaction
  useEffect(() => {
    if (isPending) {
      setError(null);
    }
  }, [isPending]);

  const getQuote = async (params: SwapParams): Promise<Quote | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/swap?fromToken=${params.fromToken}&toToken=${params.toToken}&amount=${params.amount}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get quote');
      }

      const quote = await response.json();
      return quote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approveToken = async (tokenAddress: string, amount: string, decimals: number = 18) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const amountWei = parseUnits(amount, decimals);

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, amountWei],
    });
  };

  const swapTokens = async (params: SwapParams) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const fromTokenAddress = TOKEN_ADDRESSES[params.fromToken];
      const toTokenAddress = TOKEN_ADDRESSES[params.toToken];
      const amountIn = parseUnits(params.amount, 18);
      const slippage = params.slippage || 1; // Default 1%
      
      // Get quote for minimum amount out
      const quote = await getQuote(params);
      if (!quote) {
        throw new Error('Failed to get quote');
      }

      const amountOutMin = parseUnits(
        (parseFloat(quote.amountOut) * (1 - slippage / 100)).toString(),
        18
      );

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes

      writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          amountIn,
          amountOutMin,
          [BigInt(20)], // binStep for the pair
          [fromTokenAddress, toTokenAddress],
          address,
          deadline
        ],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addLiquidity = async (params: LiquidityParams) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const tokenAAddress = TOKEN_ADDRESSES[params.tokenA];
      const tokenBAddress = TOKEN_ADDRESSES[params.tokenB];
      
      // Ensure correct token order (ascending addresses)
      const [token0, token1] = tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase() 
        ? [tokenAAddress, tokenBAddress]
        : [tokenBAddress, tokenAAddress];
      
      const [amount0, amount1] = tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase()
        ? [parseUnits(params.amountA, 18), parseUnits(params.amountB, 18)]
        : [parseUnits(params.amountB, 18), parseUnits(params.amountA, 18)];

      const amount0Min = amount0 * BigInt(95) / BigInt(100); // 5% slippage
      const amount1Min = amount1 * BigInt(95) / BigInt(100); // 5% slippage
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes

      writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'addLiquidity',
        args: [
          token0,
          token1,
          BigInt(20), // binStep
          amount0,
          amount1,
          amount0Min,
          amount1Min,
          BigInt(0), // activeIdDesired (let the router decide)
          BigInt(1), // idSlippage
          address,
          deadline
        ],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Add liquidity failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPortfolio = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/portfolio?walletAddress=${address}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get portfolio');
      }

      const portfolio = await response.json();
      return portfolio;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get portfolio';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading: loading || isPending || isConfirming,
    error,
    isSuccess,
    hash,

    // Functions
    getQuote,
    swapTokens,
    addLiquidity,
    approveToken,
    getPortfolio,

    // Constants
    TOKEN_ADDRESSES,
    ROUTER_ADDRESS
  };
}
