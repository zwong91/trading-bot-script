'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import Link from 'next/link';

export function Header() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <header className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              DEX Platform
            </Link>
            <nav className="hidden md:flex ml-8 space-x-8">
              <Link 
                href="/swap" 
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Swap
              </Link>
              <Link 
                href="/liquidity" 
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Liquidity
              </Link>
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {isConnected && (
              <div className="text-sm text-gray-600">
                Network: {chainId === 97 ? 'BSC Testnet' : chainId === 56 ? 'BSC Mainnet' : 'Unknown'}
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
