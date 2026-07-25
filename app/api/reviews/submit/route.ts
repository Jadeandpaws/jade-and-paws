import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { line, resendFrom, sendEmail } from '../../../../lib/email';
import { claimToken, createReview, releaseToken } from '../../../../lib/reviews';

export const runtime = 'nodejs';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB upload cap, before we resize it down
const recipient = 'jadeandpaws@gmail.com';

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'This feature is not configured yet.' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read your submission.' }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field in.
  if (readText(formData, 'website')) {
    return NextResponse.json({ ok: true });
  }

  const token = readText(formData, 'token');
  const firstName = readText(formData, 'firstName');
  const petName = readText(formData, 'petName') || null;
  const service = readText(formData, 'service');
  const rating = Number(readText(formData, 'rating'));
  const body = readText(formData, 'body');
  const permission = readText(formData, 'permission') === 'true';
  const photo = formData.get('photo');

  if (!token || !firstName || !service || !body || !permission || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Please complete all required fields and agree to the permission checkbox.' },
      { status: 400 }
    );
  }
  if (firstName.length > 200 || service.length > 200 || body.length > 3000 || (petName?.length ?? 0) > 200) {
    return NextResponse.json({ error: 'One or more entries is too long.' }, { status: 400 });
  }

  // Atomically claim the token. This is what makes the link one-time-use:
  // if two requests race, or the same link is opened twice, only the first
  // claim can ever succeed.
  const tokenId = await claimToken(token);
  if (tokenId === null) {
    return NextResponse.json(
      { error: 'This review link is invalid, expired, or has already been used.' },
      { status: 400 }
    );
  }

  try {
    let photoUrl: string | null = null;

    if (photo instanceof File && photo.size > 0) {
      if (photo.size > MAX_PHOTO_BYTES) {
        throw new Error('Photo is too large. Please use an image under 8MB.');
      }
      if (!photo.type.startsWith('image/')) {
        throw new Error('The uploaded file needs to be an image.');
      }

      // Resize and re-encode server-side so every stored photo is a
      // reasonably small, consistent JPEG regardless of what was uploaded.
      const inputBuffer = Buffer.from(await photo.arrayBuffer());
      const optimized = await sharp(inputBuffer)
        .rotate() // respect EXIF orientation before stripping metadata
        .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();

      const blob = await put(`reviews/${randomUUID()}.jpg`, optimized, {
        access: 'public',
        contentType: 'image/jpeg',
      });
      photoUrl = blob.url;
    }

    const review = await createReview({
      tokenId,
      firstName,
      petName,
      service,
      rating,
      body,
      photoUrl,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const adminLink = `${siteUrl}/admin/reviews?highlight=${review.id}`;

    const details = `
      <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:15px">
        ${line('Customer', firstName)}
        ${line('Pet name', petName || undefined)}
        ${line('Service', service)}
        ${line('Rating', `${rating} / 5`)}
        ${line('Review', body)}
        ${line('Submitted', new Date(review.createdAt).toLocaleString('en-US'))}
      </table>
    `;

    await sendEmail({
      from: resendFrom(),
      to: [recipient],
      subject: `New review submitted — ${firstName}${petName ? ` & ${petName}` : ''}`,
      html: `
        <div style="max-width:620px;margin:auto;padding:28px;background:#F7F4EE;color:#6D5645">
          <h1 style="font-family:Georgia,serif">New Jade &amp; Paws review</h1>
          <p>A client just submitted a review. It's saved as pending and won't appear on the site until you approve it.</p>
          ${details}
          ${adminLink ? `<p style="margin-top:20px"><a href="${adminLink}" style="color:#6D5645;font-weight:600">Review it in the admin dashboard →</a></p>` : ''}
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Something failed after the token was claimed — release it so the
    // client's link still works if they try again.
    await releaseToken(tokenId).catch(() => {});
    console.error('Review submission failed:', error);
    const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
