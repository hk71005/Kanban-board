'use server';

import { z } from 'zod';
import db from '@/lib/db';

const emailSchema = z.string().email();

export async function subscribeToWaitlist(email: string) {
  const parsed = emailSchema.safeParse(email.toLowerCase().trim());
  if (!parsed.success) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    await db.waitlistEmail.create({ data: { email: parsed.data } });
    return { success: "You're on the list. We'll reach out when we ship new features." };
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { success: "You're already on the list." };
    }
    return { error: 'Something went wrong. Please try again.' };
  }
}
