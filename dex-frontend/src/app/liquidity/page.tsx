'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { PlusIcon, MinusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useDEXTrading } from '@/hooks/useDEXTrading';

const TOKENS = [
  { symbol: 'BNB', name: 'Binance Coin', address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x64544969ed7EBf5f083679233325356EbE738930' },
  { symbol: 'USDT', name: 'Tether USD', address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' },
];

interface TokenInputProps {
  selectedToken: typeof TOKENS[0];
  onSelect: (token: typeof TOKENS[0]) => void;
  label: string;
  amount: string;
  onAmountChange: (amount: string) => void;
}

function TokenInput({ selectedToken, onSelect, label, amount, onAmountChange }: TokenInputProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm text-gray-600">Balance: 0.00</span>
      </div>
      <div className="flex items-center space-x-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.0"
          className="flex-1 text-xl bg-transparent border-none outline-none"
        />
        <select
          value={selectedToken.symbol}
          onChange={(e) => {
            const token = TOKENS.find(t => t.symbol === e.target.value);
            if (token) onSelect(token);
          }}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium min-w-[80px]"
        >
          {TOKENS.map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function LiquidityPage() {
  const { address, isConnected } = useAccount();
  const { addLiquidity, approveToken, loading, error, isSuccess, hash } = useDEXTrading();
  
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [tokenA, setTokenA] = useState(TOKENS[0]);
  const [tokenB, setTokenB] = useState(TOKENS[1]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [positions, setPositions] = useState<any[]>([]);

  // Fetch user's liquidity positions
  useEffect(() => {
    if (isConnected && address) {
      // Mock positions - in production, fetch from API
      setPositions([
        {
          id: '1',
          tokenA: 'BNB',
          tokenB: 'USDC',
          liquidity: '0.5',
          valueUSD: '150.00',
          apr: '12.5'
        },
        {
          id: '2', 
          tokenA: 'USDC',
          tokenB: 'USDT',
          liquidity: '500',
          valueUSD: '500.00',
          apr: '8.2'
        }
      ]);
    }
  }, [isConnected, address]);

  const handleAddLiquidity = async () => {
    if (!isConnected || !amountA || !amountB || !address) return;
    
    try {
      await addLiquidity({
        tokenA: tokenA.symbol as keyof typeof import('@/hooks/useDEXTrading').TOKEN_ADDRESSES,
        tokenB: tokenB.symbol as keyof typeof import('@/hooks/useDEXTrading').TOKEN_ADDRESSES,
        amountA,
        amountB
      });
    } catch (err) {
      console.error('Add liquidity failed:', err);
    }
  };

  const handleApproveTokenA = async () => {
    if (!amountA || !address) return;
    
    try {
      await approveToken(tokenA.address, amountA);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleApproveTokenB = async () => {
    if (!amountB || !address) return;
    
    try {
      await approveToken(tokenB.address, amountB);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const canAddLiquidity = isConnected && amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0 && !loading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add/Remove Liquidity Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex mb-6">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                  activeTab === 'add'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Liquidity</span>
              </button>
              <button
                onClick={() => setActiveTab('remove')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ml-2 ${
                  activeTab === 'remove'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MinusIcon className="w-4 h-4" />
                <span>Remove Liquidity</span>
              </button>
            </div>

            {activeTab === 'add' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Add Liquidity</h2>
                
                <TokenInput
                  selectedToken={tokenA}
                  onSelect={setTokenA}
                  label="Token A"
                  amount={amountA}
                  onAmountChange={setAmountA}
                />

                <div className="flex justify-center">
                  <PlusIcon className="w-6 h-6 text-gray-400" />
                </div>

                <TokenInput
                  selectedToken={tokenB}
                  onSelect={setTokenB}
                  label="Token B"
                  amount={amountB}
                  onAmountChange={setAmountB}
                />

                {/* Pool Information */}
                {amountA && amountB && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Pool Share:</span>
                      <span className="font-medium">0.01%</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Estimated APR:</span>
                      <span className="font-medium text-green-600">15.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network Fee:</span>
                      <span className="font-medium">~$0.30</span>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Success Display */}
                {isSuccess && hash && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">
                      ✅ Liquidity added successfully! 
                      <a 
                        href={`https://testnet.bscscan.com/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline ml-1"
                      >
                        View on BSCScan
                      </a>
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 mt-6">
                  {!isConnected ? (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Connect your wallet to add liquidity</p>
                    </div>
                  ) : (
                    <>
                      {/* Approval Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleApproveTokenA}
                          disabled={loading || !amountA}
                          className="bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {loading ? 'Approving...' : `Approve ${tokenA.symbol}`}
                        </button>
                        <button
                          onClick={handleApproveTokenB}
                          disabled={loading || !amountB}
                          className="bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {loading ? 'Approving...' : `Approve ${tokenB.symbol}`}
                        </button>
                      </div>

                      {/* Add Liquidity Button */}
                      <button
                        onClick={handleAddLiquidity}
                        disabled={!canAddLiquidity}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Adding Liquidity...</span>
                          </div>
                        ) : (
                          `Add ${tokenA.symbol}-${tokenB.symbol} Liquidity`
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Remove Liquidity</h2>
                <div className="text-center text-gray-600 py-8">
                  <p>Select a liquidity position from the right panel to remove liquidity</p>
                </div>
              </div>
            )}
          </div>

          {/* Liquidity Positions Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Your Liquidity Positions</h2>
            
            {!isConnected ? (
              <div className="text-center text-gray-600 py-8">
                <p>Connect your wallet to view your liquidity positions</p>
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                <p>You don't have any liquidity positions yet</p>
                <p className="text-sm mt-2">Add liquidity to start earning fees</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => (
                  <div key={position.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-lg">
                          {position.tokenA}/{position.tokenB}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Liquidity: {position.liquidity} LP
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${position.valueUSD}</p>
                        <p className="text-sm text-green-600">APR: {position.apr}%</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                        Add More
                      </button>
                      <button className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pool Statistics */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Popular Pools</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">BNB/USDC</p>
                    <p className="text-sm text-gray-600">24h Volume: $125k</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">18.2% APR</p>
                    <p className="text-sm text-gray-600">$2.1M TVL</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">USDC/USDT</p>
                    <p className="text-sm text-gray-600">24h Volume: $89k</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">12.5% APR</p>
                    <p className="text-sm text-gray-600">$1.8M TVL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
