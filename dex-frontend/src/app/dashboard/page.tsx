'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Header } from '@/components/Header';
import { formatEther, parseUnits } from 'viem';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface TokenBalance {
  symbol: string;
  balance: string;
  value: string;
  change24h: string;
  address: string;
}

interface Transaction {
  hash: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity';
  tokenA: string;
  tokenB: string;
  amount: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState('0');
  const [loading, setLoading] = useState(true);

  // Mock data - in production, fetch from API
  useEffect(() => {
    if (isConnected && address) {
      // Simulate API call delay
      setTimeout(() => {
        setTokenBalances([
          {
            symbol: 'BNB',
            balance: ethBalance ? formatEther(ethBalance.value) : '0',
            value: '304.50',
            change24h: '+2.34',
            address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'
          },
          {
            symbol: 'USDC',
            balance: '1,250.00',
            value: '1,250.00',
            change24h: '+0.02',
            address: '0x64544969ed7EBf5f083679233325356EbE738930'
          },
          {
            symbol: 'USDT',
            balance: '850.75',
            value: '850.75',
            change24h: '-0.01',
            address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
          }
        ]);

        setTransactions([
          {
            hash: '0x1234...5678',
            type: 'swap',
            tokenA: 'USDT',
            tokenB: 'USDC',
            amount: '100.00',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'confirmed'
          },
          {
            hash: '0x2345...6789',
            type: 'add_liquidity',
            tokenA: 'BNB',
            tokenB: 'USDC',
            amount: '0.5',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            status: 'confirmed'
          },
          {
            hash: '0x3456...7890',
            type: 'swap',
            tokenA: 'BNB',
            tokenB: 'USDT',
            amount: '0.25',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            status: 'pending'
          }
        ]);

        setTotalPortfolioValue('2,405.25');
        setLoading(false);
      }, 1000);
    }
  }, [isConnected, address, ethBalance]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return '🔄';
      case 'add_liquidity':
        return '➕';
      case 'remove_liquidity':
        return '➖';
      default:
        return '📝';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to view your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Portfolio Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">${totalPortfolioValue}</p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">24h Change</p>
                  <p className="text-2xl font-bold text-green-600">+$12.45</p>
                </div>
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Positions</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Balances */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Token Balances</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading balances...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tokenBalances.map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{token.symbol[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{token.symbol}</p>
                          <p className="text-sm text-gray-600">{token.balance}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${token.value}</p>
                        <p className={`text-sm ${
                          token.change24h.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {token.change24h}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading transactions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.hash} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getTransactionIcon(tx.type)}</div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {tx.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {tx.tokenA} → {tx.tokenB}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{tx.amount}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            tx.status === 'confirmed' ? 'bg-green-400' : 
                            tx.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></span>
                          <p className="text-sm text-gray-600">{formatTimeAgo(tx.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
