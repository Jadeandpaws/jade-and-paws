import { NextResponse } from 'next/server';
import { getPublicReviews } from '../../../lib/reviews';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { reviews, stats } = await getPublicReviews();
    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error('Failed to load public reviews:', error);
    return NextResponse.json({ error: 'Unable to load reviews right now.' }, { status: 500 });
  }
}
