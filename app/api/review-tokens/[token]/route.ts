import { NextRequest, NextResponse } from 'next/server';
import { getTokenStatus } from '../../../../lib/reviews';

export const runtime = 'nodejs';

// Read-only check — does NOT consume the token. Consuming happens
// atomically at submission time in /api/reviews/submit.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const status = await getTokenStatus(token);
    if (status === 'unused') return NextResponse.json({ valid: true });
    return NextResponse.json({ valid: false, reason: status });
  } catch (error) {
    console.error('Token status check failed:', error);
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 });
  }
}
