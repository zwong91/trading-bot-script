'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { ArrowDownIcon, CogIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useDEXTrading } from '@/hooks/useDEXTrading';

const TOKENS = [
  { symbol: 'BNB', name: 'Binance Coin', address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x64544969ed7EBf5f083679233325356EbE738930' },
  { symbol: 'USDT', name: 'Tether USD', address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' },
];

interface TokenSelectProps {
  selectedToken: typeof TOKENS[0];
  onSelect: (token: typeof TOKENS[0]) => void;
  label: string;
  amount: string;
  onAmountChange: (amount: string) => void;
  readOnly?: boolean;
  loading?: boolean;
}

function TokenSelect({ selectedToken, onSelect, label, amount, onAmountChange, readOnly, loading }: TokenSelectProps) {
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
          className="flex-1 text-2xl bg-transparent border-none outline-none"
          readOnly={readOnly}
        />
        {loading && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        )}
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

export default function SwapPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slippage, setSlippage] = useState('0.5');

  const handleSwap = async () => {
    if (!isConnected || !fromAmount) {
      alert('Please connect wallet and enter amount');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbolIn: fromToken,
          symbolOut: toToken,
          amountIn: fromAmount,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Swap successful! TX: ${result.txHash}`);
        setFromAmount('');
        setToAmount('');
      } else {
        alert(`Swap failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Swap Tokens</h1>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <CogIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <TokenSelect
              selectedToken={fromToken}
              onSelect={setFromToken}
              label="From"
              amount={fromAmount}
              onAmountChange={setFromAmount}
            />

            <div className="flex justify-center">
              <button
                onClick={switchTokens}
                className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                <ArrowDownIcon className="w-5 h-5" />
              </button>
            </div>

            <TokenSelect
              selectedToken={toToken}
              onSelect={setToToken}
              label="To"
              amount={toAmount}
              onAmountChange={setToAmount}
              readOnly
            />
          </div>

          {/* Slippage Settings */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Slippage Tolerance</span>
              <div className="flex space-x-2">
                {['0.1', '0.5', '1.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 text-xs rounded ${
                      slippage === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  step="0.1"
                  min="0.1"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* Swap Info */}
          {fromAmount && toAmount && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Rate:</span>
                <span>1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Fee:</span>
                <span>~$0.20</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSwap}
            disabled={!isConnected || !fromAmount || isLoading}
            className={`w-full mt-6 py-4 rounded-lg font-semibold ${
              !isConnected || !fromAmount
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {!isConnected
              ? 'Connect Wallet'
              : isLoading
              ? 'Swapping...'
              : 'Swap Tokens'
            }
          </button>

          {/* Network Info */}
          <div className="mt-4 text-center text-sm text-gray-500">
            {isConnected && (
              <>Network: {chainId === 97 ? 'BSC Testnet' : chainId === 56 ? 'BSC Mainnet' : 'Unknown'}</>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
