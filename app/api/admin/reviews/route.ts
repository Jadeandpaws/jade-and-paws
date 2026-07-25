import { NextResponse } from 'next/server';
import { listAllReviewsForAdmin, listAllTokens } from '../../../../lib/reviews';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [reviews, tokens] = await Promise.all([listAllReviewsForAdmin(), listAllTokens()]);
    return NextResponse.json({ reviews, tokens });
  } catch (error) {
    console.error('Failed to load admin review data:', error);
    return NextResponse.json({ error: 'Unable to load reviews.' }, { status: 500 });
  }
}
