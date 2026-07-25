import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '../../../../lib/reviews';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { label } = (await request.json().catch(() => ({}))) as { label?: string };

  try {
    const { token, expiresAt } = await generateToken(label?.trim() || null);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const url = `${siteUrl}/review/${token}`;
    return NextResponse.json({ token, url, expiresAt });
  } catch (error) {
    console.error('Failed to generate review link:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
