'use server';

import crypto from 'crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import db from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8);

// SECURITY: Always return generic message to prevent email enumeration
const GENERIC_SUCCESS = 'If an account with that email exists, a reset link has been sent.';

export async function requestPasswordReset(email: string) {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: 'Please enter a valid email address.' };
  }

  const normalizedEmail = parsed.data.toLowerCase().trim();

  // Look up user — but do NOT reveal whether they exist
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    // Return generic success — prevents email enumeration
    return { success: GENERIC_SUCCESS };
  }

  // Generate raw token — 256 bits of entropy
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store only the SHA-256 hash — raw token never touches the DB
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiry = new Date(Date.now() + RESET_EXPIRY_MS);

  await db.user.update({
    where: { email: normalizedEmail },
    data: {
      resetToken: tokenHash,
      resetTokenExpiry: expiry,
    },
  });

  // Build reset URL
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://kanvi.app';
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

  // Send email via Resend
  try {
    await resend.emails.send({
      from: 'Kanvi <hello@kanvi.app>',
      to: normalizedEmail,
      subject: 'Reset your password',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#09090b">
          <p style="font-size:20px;font-weight:700;margin:0 0 8px">Reset your password</p>
          <p style="font-size:14px;color:#71717a;margin:0 0 24px">
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
            Reset password
          </a>
          <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
        </div>
      `,
    });
  } catch {
    // Don't expose email delivery errors to the client
    return { success: GENERIC_SUCCESS };
  }

  return { success: GENERIC_SUCCESS };
}

export async function confirmPasswordReset(
  email: string,
  rawToken: string,
  newPassword: string
) {
  // Validate inputs
  const emailParsed = emailSchema.safeParse(email);
  const passwordParsed = passwordSchema.safeParse(newPassword);

  if (!emailParsed.success) return { error: 'Invalid request.' };
  if (!passwordParsed.success) return { error: 'Password must be at least 8 characters.' };

  const normalizedEmail = emailParsed.data.toLowerCase().trim();

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });

  // Reject if user not found, no token, or token expired
  if (
    !user ||
    !user.resetToken ||
    !user.resetTokenExpiry ||
    user.resetTokenExpiry < new Date()
  ) {
    return { error: 'This reset link is invalid or has expired.' };
  }

  // Hash the incoming raw token and compare with stored hash
  const incomingHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  const storedBuffer = Buffer.from(user.resetToken, 'hex');
  const incomingBuffer = Buffer.from(incomingHash, 'hex');

  const isValid =
    storedBuffer.length === incomingBuffer.length &&
    crypto.timingSafeEqual(storedBuffer, incomingBuffer);

  if (!isValid) {
    return { error: 'This reset link is invalid or has expired.' };
  }

  // Hash the new password and update — clear token fields (single-use)
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { email: normalizedEmail },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { success: 'Password updated. You can now sign in with your new password.' };
}
