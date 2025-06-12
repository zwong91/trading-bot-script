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
  const { address, isConnected } = useAccount();
  const { getQuote, swapTokens, approveToken, loading, error, isSuccess, hash } = useDEXTrading();
  
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  // Get quote when amount changes
  useEffect(() => {
    const getSwapQuote = async () => {
      if (fromAmount && parseFloat(fromAmount) > 0 && fromToken.symbol !== toToken.symbol) {
        setQuoteLoading(true);
        const quoteResult = await getQuote({
          fromToken: fromToken.symbol as keyof typeof import('@/hooks/useDEXTrading').TOKEN_ADDRESSES,
          toToken: toToken.symbol as keyof typeof import('@/hooks/useDEXTrading').TOKEN_ADDRESSES,
          amount: fromAmount
        });
        
        if (quoteResult) {
          setToAmount(quoteResult.amountOut);
          setQuote(quoteResult);
        }
        setQuoteLoading(false);
      } else {
        setToAmount('');
        setQuote(null);
      }
    };

    const debounceTimer = setTimeout(getSwapQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [fromAmount, fromToken, toToken, getQuote]);

  const handleSwap = async () => {
    if (!isConnected || !fromAmount || !address) return;
    
    try {
      await swapTokens({
        fromToken: fromToken.symbol as keyof typeof import('@/hooks/useDEXTrading').TOKEN_ADDRESSES,
        toToken: toToken.symbol as keyof typeof import('@/hooks/useDEXTrading').TOKEN_ADDRESSES,
        amount: fromAmount,
        slippage
      });
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  const handleApprove = async () => {
    if (!fromAmount || !address) return;
    
    try {
      await approveToken(fromToken.address, fromAmount);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const canSwap = isConnected && fromAmount && parseFloat(fromAmount) > 0 && toAmount && !loading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Swap Tokens</h1>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <CogIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Slippage Tolerance</h3>
              <div className="flex space-x-2">
                {[0.1, 0.5, 1.0, 3.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded text-sm ${
                      slippage === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 1)}
                  placeholder="Custom"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  step="0.1"
                  min="0.1"
                  max="50"
                />
              </div>
            </div>
          )}

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
              loading={quoteLoading}
            />
          </div>

          {/* Quote Information */}
          {quote && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Price Impact:</span>
                <span className={`font-medium ${
                  parseFloat(quote.priceImpact) > 5 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {quote.priceImpact}%
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Network Fee:</span>
                <span className="font-medium">{quote.fee}</span>
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
                ✅ Transaction successful! 
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

          {/* Swap Button */}
          <div className="mt-6">
            {!isConnected ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Connect your wallet to start trading</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Approve Button (if needed) */}
                <button
                  onClick={handleApprove}
                  disabled={loading || !fromAmount}
                  className="w-full bg-yellow-600 text-white py-3 rounded-lg font-medium hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Approving...' : `Approve ${fromToken.symbol}`}
                </button>

                {/* Swap Button */}
                <button
                  onClick={handleSwap}
                  disabled={!canSwap}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Swap ${fromToken.symbol} for ${toToken.symbol}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* High Slippage Warning */}
          {slippage > 5 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-yellow-600 text-sm">
                High slippage tolerance! You may receive significantly fewer tokens.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
