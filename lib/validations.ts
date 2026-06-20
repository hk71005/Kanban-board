import { z } from 'zod';
import { Priority, BoardRole } from '@prisma/client';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

export const boardSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(50),
  emoji: z.string().optional(),
});

export const columnSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color.'),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(Priority),
  dueDate: z.date().optional().nullable(),
  assignee: z.string().optional().nullable(),
  storyPoints: z.number().int().positive().optional().nullable(),
  labels: z.array(z.object({ name: z.string(), color: z.string() })).optional(),
  subtasks: z.array(z.object({ title: z.string() })).optional(),
});

export const subtaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200),
  completed: z.boolean().default(false),
});

export const labelSchema = z.object({
  name: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color.'),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.').max(1000),
});

export const memberSchema = z.object({
  email: z.string().email('Please enter a valid email to invite.'),
});

export const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email to invite.'),
  role: z.nativeEnum(BoardRole).default(BoardRole.EDITOR),
});