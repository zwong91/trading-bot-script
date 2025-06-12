import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenA, tokenB, amountA, amountB, walletAddress } = body;

    // Validate required fields
    if (!tokenA || !tokenB || !amountA || !amountB || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenA, tokenB, amountA, amountB, walletAddress' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/add-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenA,
        tokenB,
        amountA,
        amountB,
        walletAddress
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Add liquidity failed' },
        { status: response.status }
      );
    }

    const liquidityData = await response.json();
    return NextResponse.json(liquidityData);

  } catch (error) {
    console.error('Add liquidity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenA, tokenB, liquidity, walletAddress } = body;

    // Validate required fields
    if (!tokenA || !tokenB || !liquidity || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenA, tokenB, liquidity, walletAddress' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/remove-liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenA,
        tokenB,
        liquidity,
        walletAddress
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Remove liquidity failed' },
        { status: response.status }
      );
    }

    const liquidityData = await response.json();
    return NextResponse.json(liquidityData);

  } catch (error) {
    console.error('Remove liquidity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get liquidity positions from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(
      `${backendUrl}/liquidity-positions?walletAddress=${walletAddress}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get liquidity positions' },
        { status: response.status }
      );
    }

    const positionsData = await response.json();
    return NextResponse.json(positionsData);

  } catch (error) {
    console.error('Liquidity positions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
