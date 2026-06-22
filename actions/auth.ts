'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';

import db from '@/lib/db';
import { seedDemoBoard } from '@/lib/seed';
import { loginSchema, registerSchema } from '@/lib/validations';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function login(values: z.infer<typeof loginSchema>) {
  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }

  const { email, password } = validatedFields.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return { error: 'Invalid credentials.' };
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    return { error: 'Invalid credentials.' };
  }

  // In next-auth v4, actual sign-in happens client-side via signIn() from 'next-auth/react'.
  // This server action just validates credentials and returns success.
  // The login page will call signIn('credentials', ...) directly after this succeeds.
  return { success: 'Credentials verified.' };
}

export async function register(values: z.infer<typeof registerSchema>) {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }

  const { name, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: 'Email already in use.' };
  }

  let user: { id: string; name: string | null; email: string };
  try {
    user = await db.user.create({ data: { name, email, password: hashedPassword } });
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') {
      return { error: 'Email already in use.' };
    }
    return { error: 'Failed to create account. Please try again.' };
  }

  let boardId: string | undefined;
  const boardTitle = 'Website Redesign';
  try {
    boardId = await seedDemoBoard(user.id);
  } catch (err) {
    console.error('[register] default board creation failed:', err);
  }

  // Send welcome email — awaited so Vercel does not cut the request before delivery
  const firstName = name.split(' ')[0];
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://kanvi.app';
  const boardUrl = boardId ? `${baseUrl}/boards/${boardId}` : `${baseUrl}/boards`;
  try {
    await resend.emails.send({
      from: 'Hari from Kanvi <hello@kanvi.app>',
      to: email,
      subject: `Welcome to Kanvi, ${firstName}!`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;background:#ffffff;color:#09090b">
          <div style="padding:16px 24px 14px;border-bottom:1px solid #f4f4f5;border-top:3px solid #7c3aed">
            <span style="font-size:15px;font-weight:800;color:#7c3aed;letter-spacing:-0.3px">Kanvi</span>
          </div>
          <div style="padding:24px 24px 20px">
            <p style="font-size:20px;font-weight:700;margin:0 0 10px;line-height:1.25;color:#09090b">Hi ${firstName}, welcome aboard.</p>
            <p style="font-size:14px;color:#52525b;margin:0 0 24px;line-height:1.65">
              Your account is ready. We've set up your first board &mdash; <strong style="color:#09090b">${boardTitle}</strong> &mdash; with a few columns to get you started.
            </p>
            <a href="${boardUrl}"
               style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
              Open your board &rarr;
            </a>
            <p style="font-size:13px;color:#71717a;margin:20px 0 0;line-height:1.65">
              Once you're in, press <strong style="color:#09090b">N</strong> to add a task, or click <strong style="color:#09090b">Share</strong> to send your client a live progress link.
            </p>
            <p style="font-size:13px;color:#71717a;margin:20px 0 0;line-height:1.65">
              Questions? Just reply &mdash; I read every one.<br/>
              <strong style="color:#09090b">Hari</strong>, Founder &middot; Kanvi
            </p>
          </div>
          <div style="padding:14px 24px;border-top:1px solid #f4f4f5">
            <p style="font-size:11px;color:#a1a1aa;margin:0;line-height:1.5">You received this because you created a Kanvi account.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('[register] welcome email failed:', err);
  }

  return { success: 'User created successfully! Please log in.', boardId };
}

export async function logout() {
  // In next-auth v4, sign-out happens client-side via signOut() from 'next-auth/react'.
  // This action just redirects — the Navbar should call signOut() from 'next-auth/react' instead.
  redirect('/login');
}
