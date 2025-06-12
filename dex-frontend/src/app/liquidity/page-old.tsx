'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { useAccount, useChainId } from 'wagmi';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface LiquidityPair {
  name: string;
  token1: string;
  token2: string;
  balance: string;
  apr: string;
}

const LIQUIDITY_PAIRS: LiquidityPair[] = [
  { name: 'USDC-USDT', token1: 'USDC', token2: 'USDT', balance: '0.00', apr: '12.5%' },
  { name: 'BNB-USDC', token1: 'BNB', token2: 'USDC', balance: '0.00', apr: '18.2%' },
];

export default function LiquidityPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [selectedPair, setSelectedPair] = useState('usdc-usdt');
  const [amount1, setAmount1] = useState('');
  const [amount2, setAmount2] = useState('');
  const [removePercentage, setRemovePercentage] = useState('100');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddLiquidity = async () => {
    if (!isConnected || !amount1 || !amount2) {
      alert('Please connect wallet and enter amounts');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/add-liquidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedPair,
          amount1,
          amount2,
          binStep: selectedPair === 'usdc-usdt' ? '1' : '25',
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Liquidity added successfully! TX: ${result.txHash}`);
        setAmount1('');
        setAmount2('');
      } else {
        alert(`Failed to add liquidity: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!isConnected) {
      alert('Please connect wallet');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/remove-liquidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedPair,
          percentage: removePercentage,
          protocol: 'traderjoe',
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Liquidity removed successfully! TX: ${result.txHash}`);
      } else {
        alert(`Failed to remove liquidity: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Liquidity Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  activeTab === 'add'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <PlusIcon className="w-4 h-4 inline mr-2" />
                Add Liquidity
              </button>
              <button
                onClick={() => setActiveTab('remove')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  activeTab === 'remove'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <MinusIcon className="w-4 h-4 inline mr-2" />
                Remove Liquidity
              </button>
            </div>

            {/* Pair Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Pair
              </label>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="usdc-usdt">USDC-USDT</option>
                <option value="bnb-usdc">BNB-USDC</option>
              </select>
            </div>

            {activeTab === 'add' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedPair === 'usdc-usdt' ? 'USDC Amount' : selectedPair === 'bnb-usdc' ? 'BNB Amount' : 'Amount 1'}
                  </label>
                  <input
                    type="number"
                    value={amount1}
                    onChange={(e) => setAmount1(e.target.value)}
                    placeholder="0.0"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedPair === 'usdc-usdt' ? 'USDT Amount' : selectedPair === 'bnb-usdc' ? 'USDC Amount' : 'Amount 2'}
                  </label>
                  <input
                    type="number"
                    value={amount2}
                    onChange={(e) => setAmount2(e.target.value)}
                    placeholder="0.0"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                
                {amount1 && amount2 && (
                  <div className="p-4 bg-blue-50 rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span>Pool Share:</span>
                      <span>~0.01%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LP Tokens:</span>
                      <span>{Math.sqrt(parseFloat(amount1) * parseFloat(amount2)).toFixed(6)}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddLiquidity}
                  disabled={!isConnected || !amount1 || !amount2 || isLoading}
                  className={`w-full py-4 rounded-lg font-semibold ${
                    !isConnected || !amount1 || !amount2
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {!isConnected
                    ? 'Connect Wallet'
                    : isLoading
                    ? 'Adding Liquidity...'
                    : 'Add Liquidity'
                  }
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage to Remove
                  </label>
                  <div className="flex space-x-2 mb-2">
                    {['25', '50', '75', '100'].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setRemovePercentage(percent)}
                        className={`flex-1 py-2 px-3 text-sm rounded ${
                          removePercentage === percent
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={removePercentage}
                    onChange={(e) => setRemovePercentage(e.target.value)}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">
                    {removePercentage}%
                  </div>
                </div>

                <button
                  onClick={handleRemoveLiquidity}
                  disabled={!isConnected || isLoading}
                  className={`w-full py-4 rounded-lg font-semibold ${
                    !isConnected
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {!isConnected
                    ? 'Connect Wallet'
                    : isLoading
                    ? 'Removing Liquidity...'
                    : `Remove ${removePercentage}% Liquidity`
                  }
                </button>
              </div>
            )}

            {/* Network Info */}
            <div className="mt-4 text-center text-sm text-gray-500">
              {isConnected && (
                <>Network: {chainId === 97 ? 'BSC Testnet' : chainId === 56 ? 'BSC Mainnet' : 'Unknown'}</>
              )}
            </div>
          </div>

          {/* Your Liquidity Positions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Your Liquidity Positions</h2>
            
            <div className="space-y-4">
              {LIQUIDITY_PAIRS.map((pair) => (
                <div key={pair.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{pair.name}</h3>
                    <span className="text-green-600 text-sm font-medium">APR: {pair.apr}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Your Balance:</span>
                      <span>{pair.balance} LP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{pair.token1}:</span>
                      <span>0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{pair.token2}:</span>
                      <span>0.00</span>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button className="flex-1 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                      Add More
                    </button>
                    <button className="flex-1 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {LIQUIDITY_PAIRS.every(pair => pair.balance === '0.00') && (
              <div className="text-center py-8 text-gray-500">
                <p>No liquidity positions found</p>
                <p className="text-sm">Add liquidity to earn trading fees</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
