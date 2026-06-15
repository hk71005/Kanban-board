'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

import db from '@/lib/db';
import { loginSchema, registerSchema } from '@/lib/validations';

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

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: 'User created successfully! Please log in.' };
}

export async function logout() {
  // In next-auth v4, sign-out happens client-side via signOut() from 'next-auth/react'.
  // This action just redirects — the Navbar should call signOut() from 'next-auth/react' instead.
  redirect('/login');
}