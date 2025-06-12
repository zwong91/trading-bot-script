import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromToken, toToken, amount, slippage, walletAddress } = body;

    // Validate required fields
    if (!fromToken || !toToken || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: fromToken, toToken, amount, walletAddress' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromToken,
        toToken,
        amount,
        slippage: slippage || 1, // Default 1% slippage
        walletAddress
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Swap failed' },
        { status: response.status }
      );
    }

    const swapData = await response.json();
    return NextResponse.json(swapData);

  } catch (error) {
    console.error('Swap API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromToken = searchParams.get('fromToken');
    const toToken = searchParams.get('toToken');
    const amount = searchParams.get('amount');

    if (!fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromToken, toToken, amount' },
        { status: 400 }
      );
    }

    // Get quote from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(
      `${backendUrl}/quote?fromToken=${fromToken}&toToken=${toToken}&amount=${amount}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get quote' },
        { status: response.status }
      );
    }

    const quoteData = await response.json();
    return NextResponse.json(quoteData);

  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
