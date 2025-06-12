import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameter: walletAddress' },
        { status: 400 }
      );
    }

    // Get portfolio data from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Fetch data from backend with error handling
    let balances, transactions, positions;
    
    try {
      const balancesResponse = await fetch(`${backendUrl}/wallets`);
      balances = balancesResponse.ok ? await balancesResponse.json() : { wallets: [] };
    } catch (error) {
      console.error('Error fetching balances:', error);
      balances = { wallets: [] };
    }

    try {
      const transactionsResponse = await fetch(`${backendUrl}/analysis`);
      transactions = transactionsResponse.ok ? await transactionsResponse.json() : [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      transactions = [];
    }

    try {
      const positionsResponse = await fetch(`${backendUrl}/liquidity-info/usdc-usdt`);
      positions = positionsResponse.ok ? await positionsResponse.json() : {};
    } catch (error) {
      console.error('Error fetching positions:', error);
      positions = {};
    }

    // Extract wallet data from backend response
    const walletData = balances.wallets || [];
    const userWallet = walletData.find((w: any) => 
      w.address && w.address.toLowerCase() === walletAddress.toLowerCase()
    );
    
    // Format balances for frontend with fallback values
    const formattedBalances = userWallet ? [
      { 
        symbol: 'BNB', 
        balance: userWallet.bnb || '0.0000', 
        value: (parseFloat(userWallet.bnb || '0') * 300).toFixed(2), 
        change24h: '+2.34',
        address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'
      },
      { 
        symbol: 'USDC', 
        balance: userWallet.usdc || '0.00', 
        value: userWallet.usdc || '0.00', 
        change24h: '+0.02',
        address: '0x64544969ed7EBf5f083679233325356EbE738930'
      },
      { 
        symbol: 'USDT', 
        balance: userWallet.usdt || '0.00', 
        value: userWallet.usdt || '0.00', 
        change24h: '-0.01',
        address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
      }
    ] : [
      { symbol: 'BNB', balance: '0.0000', value: '0.00', change24h: '0.00', address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' },
      { symbol: 'USDC', balance: '0.00', value: '0.00', change24h: '0.00', address: '0x64544969ed7EBf5f083679233325356EbE738930' },
      { symbol: 'USDT', balance: '0.00', value: '0.00', change24h: '0.00', address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' }
    ];

    // Calculate total portfolio value
    const totalValue = formattedBalances.reduce((sum: number, balance: any) => 
      sum + parseFloat(balance.value || '0'), 0
    );

    // Calculate 24h change
    const change24h = formattedBalances.reduce((sum: number, balance: any) => 
      sum + parseFloat(balance.change24h || '0'), 0
    );

    // Format transactions
    const formattedTransactions = Array.isArray(transactions) ? transactions.map((tx: any) => ({
      hash: tx.tx_hash || 'N/A',
      type: 'swap',
      tokenA: tx.swap_from_token || 'N/A',
      tokenB: tx.swap_to_token || 'N/A',
      amount: tx.amount_from ? tx.amount_from.toString() : '0',
      timestamp: tx.created_at || new Date().toISOString(),
      status: 'confirmed'
    })) : [];

    const portfolioData = {
      totalValue: totalValue.toFixed(2),
      change24h: change24h.toFixed(2),
      balances: formattedBalances,
      transactions: formattedTransactions.slice(0, 10), // Latest 10 transactions
      positions: positions.liquidityInfo ? [positions] : [],
      summary: {
        totalTransactions: formattedTransactions.length,
        activePositions: positions.liquidityInfo ? 1 : 0,
        totalValueChange: change24h > 0 ? 'up' : 'down'
      }
    };

    return NextResponse.json(portfolioData);

  } catch (error) {
    console.error('Portfolio API error:', error);
    
    // Return a safe fallback response
    return NextResponse.json({
      totalValue: '0.00',
      change24h: '0.00',
      balances: [
        { symbol: 'BNB', balance: '0.0000', value: '0.00', change24h: '0.00', address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' },
        { symbol: 'USDC', balance: '0.00', value: '0.00', change24h: '0.00', address: '0x64544969ed7EBf5f083679233325356EbE738930' },
        { symbol: 'USDT', balance: '0.00', value: '0.00', change24h: '0.00', address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' }
      ],
      transactions: [],
      positions: [],
      summary: {
        totalTransactions: 0,
        activePositions: 0,
        totalValueChange: 'neutral'
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
