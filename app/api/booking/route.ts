import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const recipient = 'jadeandpaws@gmail.com';
const required = [
  'ownerName',
  'email',
  'phone',
  'petNames',
  'service',
  'dates',
  'depositAcknowledged',
] as const;

type Booking = Record<string, string>;

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character] ?? character));

const line = (label: string, value?: string) =>
  value
    ? `<tr><td style="padding:8px 16px 8px 0;color:#6D5645;font-weight:600;vertical-align:top">${label}</td><td style="padding:8px 0;color:#4b3b30">${escapeHtml(value)}</td></tr>`
    : '';

async function sendEmail(payload: Record<string, unknown>) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };

    throw new Error(body.message || 'Resend could not deliver the email.');
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email service is not configured yet.' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Booking;

    // Honeypot field
    if (body.website) {
      return NextResponse.json({ ok: true });
    }

    const invalid =
      required.some((field) => !body[field]?.trim()) ||
      !/^\S+@\S+\.\S+$/.test(body.email || '');

    if (invalid) {
      return NextResponse.json(
        {
          error:
            'Please complete all required fields with a valid email address.',
        },
        { status: 400 }
      );
    }

    if (
      Object.values(body).some(
        (value) => typeof value !== 'string' || value.length > 3000
      )
    ) {
      return NextResponse.json(
        { error: 'One or more entries is too long.' },
        { status: 400 }
      );
    }

    const from =
      process.env.RESEND_FROM ||
      'Jade & Paws <onboarding@resend.dev>';

    const details = `
      <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:15px">
        ${line('Owner', body.ownerName)}
        ${line('Email', body.email)}
        ${line('Phone', body.phone)}
        ${line('Pet name(s)', body.petNames)}
        ${line('Service requested', body.service)}
        ${line('Requested dates', body.dates)}
        ${line('Additional notes', body.notes)}
      </table>
    `;

    // Send booking notification to YOU
    await sendEmail({
      from,
      to: [recipient],
      reply_to: body.email,
      subject: `New booking request — ${body.ownerName}`,
      html: `
        <div style="max-width:620px;margin:auto;padding:28px;background:#F7F4EE;color:#6D5645">
          <h1 style="font-family:Georgia,serif">
            New Jade & Paws booking request
          </h1>
          <p>A new customer is ready to connect.</p>
          ${details}
        </div>
      `,
    });

    // Try to send confirmation email to the customer.
    // If it fails (because Resend is in testing mode), don't fail the booking.
    try {
      await sendEmail({
        from,
        to: [body.email],
        subject: "We've received your booking request! 🐾",
        html: `
          <div style="max-width:620px;margin:auto;padding:28px;background:#F7F4EE;color:#6D5645;font-family:Arial,sans-serif;line-height:1.6">
            <p>Hi ${escapeHtml(body.ownerName)},</p>

            <p>Thank you for contacting Jade & Paws!</p>

            <p>I've received your booking request and will review it as soon as possible.</p>

            <p>I'll reach out shortly to confirm availability and schedule a complimentary meet & greet if needed.</p>

            <p>Looking forward to meeting you and your pets!</p>

            <p>— Jade<br />Jade & Paws</p>
          </div>
        `,
      });
    } catch (error) {
      console.warn(
        'Customer confirmation email could not be sent:',
        error
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Booking request failed:', error);

    return NextResponse.json(
      {
        error:
          'Something went wrong while sending your request. Please try again, or email jadeandpaws@gmail.com.',
      },
      { status: 500 }
    );
  }
}
