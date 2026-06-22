'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import db from '@/lib/db';

export async function updateName(name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated.' };

  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: 'Name must be at least 2 characters.' };
  if (trimmed.length > 100) return { error: 'Name is too long.' };

  await db.user.update({ where: { id: session.user.id }, data: { name: trimmed } });
  return { success: 'Name updated.' };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated.' };

  const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) return { error: 'Cannot change password for this account.' };

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { error: 'Current password is incorrect.' };

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: session.user.id }, data: { password: hashed } });
  return { success: 'Password updated.' };
}
