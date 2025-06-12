import Link from 'next/link';
import { Header } from '@/components/Header';
import { ArrowRightIcon, ChartBarIcon, CurrencyDollarIcon, CogIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Decentralized Exchange Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Trade, provide liquidity, and manage your DeFi portfolio with our advanced DEX platform
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/swap"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              Start Trading
              <ArrowRightIcon className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/liquidity"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Add Liquidity
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <CurrencyDollarIcon className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Token Swapping</h3>
            <p className="text-gray-600">
              Swap between USDC, USDT, BNB and other BSC tokens with minimal slippage
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ChartBarIcon className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Liquidity Management</h3>
            <p className="text-gray-600">
              Add and remove liquidity from trading pairs to earn fees from trades
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <CogIcon className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Advanced Features</h3>
            <p className="text-gray-600">
              Real-time charts, portfolio tracking, and automated trading strategies
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">$1.2M+</div>
              <div className="text-gray-600">Total Volume</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">150+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">25</div>
              <div className="text-gray-600">Trading Pairs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
