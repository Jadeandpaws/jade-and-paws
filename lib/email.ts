// Shared email helpers built around Resend. Both the booking form and the
// review system send mail through sendEmail() so there's a single place
// that knows how to talk to Resend and a single HTML table layout.

export const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character] ?? character));

export const line = (label: string, value?: string) =>
  value
    ? `<tr><td style="padding:8px 16px 8px 0;color:#6D5645;font-weight:600;vertical-align:top">${label}</td><td style="padding:8px 0;color:#4b3b30">${escapeHtml(value)}</td></tr>`
    : '';

export async function sendEmail(payload: Record<string, unknown>) {
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
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || 'Resend could not deliver the email.');
  }
}

export const resendFrom = () =>
  process.env.RESEND_FROM || 'Jade & Paws <onboarding@resend.dev>';
