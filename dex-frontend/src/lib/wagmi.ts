import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc, bscTestnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'DEX Trading Platform',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
  chains: [bsc, bscTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

// Token addresses for BSC and BSC Testnet
export const TOKENS = {
  mainnet: {
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  },
  testnet: {
    USDC: '0x64544969ed7EBf5f083679233325356EbE738930',
    USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  },
};

// API endpoints
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-vercel-domain.vercel.app'
  : 'http://localhost:5000';
