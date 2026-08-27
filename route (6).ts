import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { approveReview, deleteReview, editReview, setFeatured } from '../../../../../lib/reviews';

export const runtime = 'nodejs';

type PatchBody =
  | { type: 'approve' }
  | { type: 'feature'; featured: boolean }
  | { type: 'edit'; firstName: string; petName: string | null; service: string; rating: number; body: string };

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId)) {
    return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as PatchBody | null;
  if (!payload) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    if (payload.type === 'approve') {
      const review = await approveReview(reviewId);
      if (!review) return NextResponse.json({ error: 'Review not found or already approved.' }, { status: 404 });
      return NextResponse.json({ review });
    }

    if (payload.type === 'feature') {
      const review = await setFeatured(reviewId, payload.featured);
      if (!review) return NextResponse.json({ error: 'Only approved reviews can be featured.' }, { status: 400 });
      return NextResponse.json({ review });
    }

    if (payload.type === 'edit') {
      if (!payload.firstName?.trim() || !payload.service?.trim() || !payload.body?.trim() || !Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
        return NextResponse.json({ error: 'Please fill in every field with a valid rating.' }, { status: 400 });
      }
      const review = await editReview(reviewId, {
        firstName: payload.firstName.trim(),
        petName: payload.petName?.trim() || null,
        service: payload.service.trim(),
        rating: payload.rating,
        body: payload.body.trim(),
      });
      if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
      return NextResponse.json({ review });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update review:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId)) {
    return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 });
  }

  try {
    const deleted = await deleteReview(reviewId);
    if (!deleted) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

    // Best-effort cleanup — don't fail the delete if Blob storage hiccups.
    if (deleted.photoUrl) {
      await del(deleted.photoUrl).catch((error) => console.warn('Could not delete review photo:', error));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete review:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
