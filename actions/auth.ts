'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';

import db from '@/lib/db';
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

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // Create a default "Personal Productivity" board for the new user
  let boardId: string | undefined;
  try {
    const defaultCols = [
      { title: 'Ideas', color: '#a78bfa', tasks: [] as string[] },
      { title: 'Today', color: '#f59e0b', tasks: ['Plan the week', 'Review priorities'] },
      { title: 'This Week', color: '#3b82f6', tasks: [] as string[] },
      { title: 'Completed', color: '#22c55e', tasks: [] as string[] },
    ];

    const board = await db.board.create({
      data: {
        title: 'My First Board',
        emoji: 'Target',
        userId: user.id,
        members: {
          create: [{ userId: user.id, role: 'OWNER' }],
        },
      },
    });

    await db.$transaction(async (tx) => {
      for (let i = 0; i < defaultCols.length; i++) {
        const col = defaultCols[i];
        const column = await tx.column.create({
          data: { title: col.title, color: col.color, order: i, boardId: board.id },
        });
        for (let j = 0; j < col.tasks.length; j++) {
          await tx.task.create({
            data: { title: col.tasks[j], priority: 'MEDIUM', order: j, columnId: column.id },
          });
        }
      }
    });

    boardId = board.id;
  } catch (err) {
    console.error('[register] default board creation failed:', err);
  }

  // Send welcome email — awaited so Vercel does not cut the request before delivery
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://kanvi.app';
  const boardUrl = boardId ? `${baseUrl}/boards/${boardId}` : `${baseUrl}/boards`;
  try {
    await resend.emails.send({
      from: 'Kanvi <hello@kanvi.app>',
      to: email,
      subject: `Welcome to Kanvi, ${name}!`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#09090b">
          <p style="font-size:20px;font-weight:700;margin:0 0 8px">Welcome to Kanvi, ${name}!</p>
          <p style="font-size:14px;color:#71717a;margin:0 0 24px">
            Your account is ready. We've created your first board to help you hit the ground running.
          </p>
          <a href="${boardUrl}"
             style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
            Open your board
          </a>
          <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0">
            Questions? Just reply to this email — I read every one.<br/>
            — Hari, Founder
          </p>
          <p style="font-size:11px;color:#d4d4d8;margin:20px 0 0;border-top:1px solid #f4f4f5;padding-top:16px">
            You received this because you created a Kanvi account.
          </p>
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
